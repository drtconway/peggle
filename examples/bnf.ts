import { fwd, not_at, any, one, not_one, str, opt, seq, sor, star, plus, range, implement, Expression, Grammar, Input} from '../src/index';
import { Tarjan } from '../src/tarjan';

const eol = seq([opt(one('\r')), one('\n')]);
const eof = seq([not_at(any())]);
const ws_char = one(' \t\r\n\f\v');
const ws = star(seq([not_at(seq([eol, eol])), ws_char]));

function sseq(...args: Expression[]) : Expression {
    let res : Expression[] = [];
    for (let arg of args) {
        res.push(ws);
        res.push(arg);
    }
    return seq(res);
}

function braces(body: Expression) : Expression {
    return sseq(one('{'), body, one('}'));
}

const name_char = sor([range('a', 'z'), range('A', 'Z'), range('0', '9'), one(' -_:=/.')]);
const name_body = plus(name_char);
const name = seq([one('<'), name_body, one('>')]);

const assigns = str('::=');

const graphic_literal = plus(seq([not_at(ws_char), any()]));
const literal = plus(seq([not_at(one(' ')), name_char]));

const expression = fwd();
const optional_expression = sseq(one('['), expression, one(']'));
const expression_primary = sor([
    name, 
    literal,
    optional_expression,
    braces(expression)
]);
const ellipsis = str('...');
const postfix_expression = seq([expression_primary, opt(ellipsis)]);
const repeating_expression = sseq(postfix_expression);
const seq_expression = sseq(postfix_expression, star(repeating_expression));
const alternative_expression = sseq(one('|'), seq_expression);
implement(expression, sseq(seq_expression, star(alternative_expression)));

const end = sor([seq([eol, eol]), eof]);

export const rule = sseq(name, assigns, sor([expression, graphic_literal]), end);


export interface NameNode {kind: "name", value: string};
export interface LiteralNode {kind: "literal", value: string};
export interface OptNode {kind: "opt", value: ExpressionNode};
export interface PlusNode {kind: "plus", value: ExpressionNode};
export interface ConjNode {kind: "conj", value: ExpressionNode[]};
export interface DisjNode {kind: "disj", value: ExpressionNode[]};
export interface DefinitionNode {kind: "definition", name: string, body: ExpressionNode};

export type ExpressionNode = NameNode | LiteralNode | OptNode | PlusNode | ConjNode | DisjNode ;
export type Node = ExpressionNode | DefinitionNode ;

/* istanbul ignore next */
function error(msg: string) : Node {
    throw new Error(msg);
}

function popExpressionNode(state: Node[]) : ExpressionNode {
    let n = state.pop() || error('popExpressionNode: no nodes!');
    /* istanbul ignore next */
    if (n.kind == 'definition') {
        throw new Error(`popExpressionNode: unexpected definition node`);
    }
    return n;
}

export const grammar = new Grammar<Node[]>();
grammar.rules.declaration = rule;

grammar.with(name_body, (input: Input, state: Node[]) => {
    state.push({kind: "name", value: input.string()});
});
grammar.with(literal, (input: Input, state: Node[]) => {
    state.push({kind: "literal", value: input.string()});
});
grammar.with(graphic_literal, (input: Input, state: Node[]) => {
    state.push({kind: "literal", value: input.string()});
});
grammar.with(optional_expression, (input: Input, state: Node[]) => {
    let exprn : ExpressionNode = popExpressionNode(state);
    state.push({kind: "opt", value: exprn});
});
grammar.with(ellipsis, (input: Input, state: Node[]) => {
    let exprn : ExpressionNode = popExpressionNode(state);
    state.push({kind: "plus", value: exprn});
});
grammar.with(repeating_expression, (input: Input, state: Node[]) => {
    let exprn : ExpressionNode = popExpressionNode(state);
    let conj : ExpressionNode = popExpressionNode(state);
    if (conj.kind != "conj") {
        conj = {kind: "conj", value: [conj]};
    }
    conj.value.push(exprn);
    state.push(conj);
});
grammar.with(alternative_expression, (input: Input, state: Node[]) => {
    let exprn : ExpressionNode = popExpressionNode(state);
    let disj : ExpressionNode = popExpressionNode(state);
    if (disj.kind != "disj") {
        disj = {kind: "disj", value: [disj]};
    }
    disj.value.push(exprn);
    state.push(disj);
});
grammar.with(rule, (input: Input, state: Node[]) => {
    let exprn : ExpressionNode = popExpressionNode(state);
    let nameNode : ExpressionNode = popExpressionNode(state);
    /* istanbul ignore next */
    if (nameNode.kind != "name") {
        throw new Error('internal error at rule (3)');
    }
    state.push({kind: "definition", name: nameNode.value, body: exprn});
});

export class Syntax {
    definitions: {[name: string]: ExpressionNode};
    names: string[];
    dependencies: {[name: string]: string[]};
    sccs : string[][];

    constructor(definitions: {[name: string]: ExpressionNode}) {
        this.definitions = definitions;
        this.names = [];
        this.dependencies = {};
        for (let name in this.definitions) {
            this.dependencies[name] = [];
            this.addDependencies(name, this.definitions[name]);
        }
        this.names.sort();
        for (let name in this.dependencies) {
            this.dependencies[name] = [...new Set<string>(this.dependencies[name])].sort();
        }
        let t = new Tarjan(this.names, this.dependencies);
        this.sccs = t.O;
    }

    addDependencies(name: string, exprn: ExpressionNode) {
        switch (exprn.kind) {
            case 'name': {
                this.dependencies[name].push(exprn.value);
                return;
            }
            case 'opt': {
                this.addDependencies(name, exprn.value);
                return;
            }
            case 'plus': {
                this.addDependencies(name, exprn.value);
                return;
            }
            case 'conj': {
                for (let kid of exprn.value) {
                    this.addDependencies(name, kid);
                }
                return;
            }
            case 'disj': {
                for (let kid of exprn.value) {
                    this.addDependencies(name, kid);
                }
                return;
            }
        }
    }

    missingRules() : string[] {
        let r = new Set<string>();
        let s = new Set<string>();
        for (let name in this.dependencies) {
            r.add(name);
            let deps = this.dependencies[name];
            for (let kid of deps) {
                s.add(kid);
            }
        }
        r.forEach((name) => { s.delete(name); });
        return [...s].sort();
    }

    makeRules(init:  {[name: string]: Expression} = {}) : {[name: string]: Expression} {
        let rules : {[name: string]: Expression} = {...init};
        for (let scc of this.sccs) {
            for (let name of scc) {
                rules[name] = fwd();
            }
            for (let name of scc) {
                let exprn = this.makeExpression(this.definitions[name], rules);
                implement(rules[name], exprn);
            }
        }
        return rules;
    }

    makeExpression(exprn: ExpressionNode, rules: {[name: string]: Expression}) : Expression {
        switch (exprn.kind) {
            case 'literal': {
                return str(exprn.value);
            }
            case 'name': {
                return rules[exprn.value];
            }
            case 'opt': {
                return opt(this.makeExpression(exprn.value, rules));
            }
            case 'plus': {
                return plus(this.makeExpression(exprn.value, rules));
            }
            case 'conj': {
                return seq(exprn.value.map((kid) => this.makeExpression(kid, rules)));
            }
            case 'disj': {
                return sor(exprn.value.map((kid) => this.makeExpression(kid, rules)));
            }
        }
    }
}