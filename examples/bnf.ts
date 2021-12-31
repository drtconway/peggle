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
const strictly_assigns = str(":==");

const unquoted_literal_char = sor([range('a', 'z'), range('A', 'Z'), range('0', '9'), one('-_:=/.')]);
const unquoted_literal = plus(unquoted_literal_char);

const escape_character = one('\\"rntvf');
const character_escape = seq([one('\\'), escape_character]);
const quoted_literal_char = sor([not_one('"\\'), character_escape]);
const quoted_literal_body = plus(quoted_literal_char);
const quoted_literal = seq([one('"'), quoted_literal_body, one('"')]);
const literal = sor([unquoted_literal, quoted_literal]);

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

export const ruleLoose = sseq(assigns, expression, end);
export const ruleStrict = sseq(strictly_assigns, expression, end);
export const rule = sseq(name, sor([ruleLoose, ruleStrict]));

export interface NameNode {kind: "name", value: string};
export interface LiteralNode {kind: "literal", value: string};
export interface OptNode {kind: "opt", value: ExpressionNode};
export interface PlusNode {kind: "plus", value: ExpressionNode};
export interface ConjNode {kind: "conj", value: ExpressionNode[]};
export interface DisjNode {kind: "disj", value: ExpressionNode[]};
export interface DefinitionNode {kind: "definition", name: string, body: ExpressionNode, mode: "strict" | "loose"};

export type ExpressionNode = NameNode | LiteralNode | OptNode | PlusNode | ConjNode | DisjNode ;
export type Node = ExpressionNode | DefinitionNode ;

export interface Definition {body: ExpressionNode, mode: "strict" | "loose"};

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
grammar.with(unquoted_literal, (input: Input, state: Node[]) => {
    state.push({kind: "literal", value: input.string()});
});
grammar.with(quoted_literal_body, (input: Input, state: Node[]) => {
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
grammar.with(ruleStrict, (input: Input, state: Node[]) => {
    let exprn : ExpressionNode = popExpressionNode(state);
    let nameNode : ExpressionNode = popExpressionNode(state);
    /* istanbul ignore next */
    if (nameNode.kind != "name") {
        throw new Error('internal error at rule (3)');
    }
    state.push({kind: "definition", name: nameNode.value, body: exprn, mode: "strict"});
});
grammar.with(ruleLoose, (input: Input, state: Node[]) => {
    let exprn : ExpressionNode = popExpressionNode(state);
    let nameNode : ExpressionNode = popExpressionNode(state);
    /* istanbul ignore next */
    if (nameNode.kind != "name") {
        throw new Error('internal error at rule (3)');
    }
    state.push({kind: "definition", name: nameNode.value, body: exprn, mode: "loose"});
});

export class Syntax {
    definitions: {[name: string]: Definition};
    whitespace?: string;
    names: string[];
    dependencies: {[name: string]: string[]};
    sccs : string[][];

    constructor(definitions: {[name: string]: Definition}, whitespace?: string) {
        this.definitions = definitions;
        if (whitespace) {
            if (!(whitespace in this.definitions)) {
                throw new Error(`Syntax: whitespace rule not defined.`);
            }
            if (this.definitions[whitespace].mode != "strict") {
                throw new Error(`Syntax: whitespace rule must be strict.`)
            }
            this.whitespace = whitespace;
        }
        this.names = [];
        this.dependencies = {};
        for (let name in this.definitions) {
            this.names.push(name);
            this.dependencies[name] = [];
            let defn = this.definitions[name];
            if (this.whitespace && defn.mode == "loose") {
                this.dependencies[name].push(this.whitespace);
            }
            this.addDependencies(name, defn.body);
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
        //console.log([...r].sort());
        //console.log([...s].sort());
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
                if (!(name in this.definitions)) {
                    if (!(name in rules)) {
                        throw new Error(`Syntax.makeRules: undefined/un-predefined name "${name}"`)
                    }
                    continue;
                }
                let defn = this.definitions[name];
                let exprn = this.makeExpression(defn.body, defn.mode, rules);
                implement(rules[name], exprn);
            }
        }
        return rules;
    }

    makeExpression(exprn: ExpressionNode, mode: "strict" | "loose", rules: {[name: string]: Expression}) : Expression {
        switch (exprn.kind) {
            case 'literal': {
                return str(exprn.value);
            }
            case 'name': {
                if (!(exprn.value in rules)) {
                    throw new Error(`Syntax.makeExpression: undefined name "${exprn.value}"`);
                }
                return rules[exprn.value];
            }
            case 'opt': {
                return opt(this.makeExpression(exprn.value, mode, rules));
            }
            case 'plus': {
                return plus(this.makeExpression(exprn.value, mode, rules));
            }
            case 'conj': {
                if (mode == "strict" || !this.whitespace) {
                    return seq(exprn.value.map((kid) => this.makeExpression(kid, mode, rules)));
                }
                let whitespace = rules[this.whitespace];
                let conj : Expression[] = [];
                for (let kid of exprn.value) {
                    conj.push(whitespace);
                    conj.push(this.makeExpression(kid, mode, rules));
                }
                return seq(exprn.value.map((kid) => this.makeExpression(kid, mode, rules)));
            }
            case 'disj': {
                return sor(exprn.value.map((kid) => this.makeExpression(kid, mode, rules)));
            }
        }
    }
}