export class Input {
    source: string;
    position: number;
    length: number;
    span: [number, number];

    constructor(source : string) {
        this.source = source;
        this.position = 0;
        this.length = this.source.length;
        this.span = [0, 0];
    }

    save() : number {
        return this.position;
    }

    restore(position : number) {
        this.position = position;
    }

    string() : string {
        return this.source.slice(this.span[0], this.span[1]);
    }
}

export interface Action<State> {
    (input: Input, state: State) : void
};

export interface RuleActions<State> {
    [index: string]: Action<State>
}

export interface ExprnActions<State> {
    [index: symbol]: Action<State>
}

export interface Fwd {kind: "fwd", id: symbol};
export interface Any {kind: "any", id: symbol};
export interface One {kind: "one", one: string, id: symbol};
export interface NotOne {kind: "not_one", not_one: string, id: symbol};
export interface Str {kind: "str", str: string, id: symbol};
export interface Range {kind: "range", first: number, last: number, id: symbol};
export interface Star {kind: "star", star: Expression, id: symbol};
export interface Plus {kind: "plus", plus: Expression, id: symbol};
export interface Seq {kind: "seq", seq: Expression[], id: symbol};
export interface Sor {kind: "sor", sor: Expression[], id: symbol};
export interface At {kind: "at", at: Expression, id: symbol};
export interface NotAt {kind: "not_at", not_at: Expression, id: symbol};

export type Expression = Fwd | Any | One | NotOne | Str | Range | Star | Plus | Seq | Sor | At | NotAt;

export interface Rules {
    [index: string]: Expression
};

export type ExprnArg = Expression;
function makeExpression(arg : ExprnArg) : Expression {
    return arg;
}

let nextId = 1;
function makeUniquesymbol() : symbol {
    let n = nextId++;
    return Symbol.for(`${n}`);
}

export function fwd() : Expression {
    return {kind: "fwd", id: makeUniquesymbol()};
}

export function implement(forward: Expression, implementation: Expression) : Expression {
    if (forward.kind != "fwd") {
        throw new Error(`cannot implement over the top of non-forward.`);
    }
    let id0 = forward.id;
    Object.assign(forward, implementation);
    forward.id = id0;
    return forward;
}

export function any() : Expression {
    return {kind: "any", id: makeUniquesymbol()};
}

export function one(chrs : string) : Expression {
    return {kind: "one", one: chrs, id: makeUniquesymbol()};
}

export function not_one(chrs : string) : Expression {
    return {kind: "not_one", not_one: chrs, id: makeUniquesymbol()};
}

export function str(s : string) : Expression {
    return {kind: "str", str: s, id: makeUniquesymbol()};
}

export function range(first: string, last: string) : Expression;
export function range(first: number, last: number) : Expression;
export function range(first: (string|number), last: (string|number)) : Expression {
    if (typeof first == "string") {
        if (first.length != 1) {
            throw new Error(`range: first element of range must be a single character.`);
        }
        first = first.charCodeAt(0);
    }
    if (typeof last == "string") {
        if (last.length != 1) {
            throw new Error(`range: last element of range must be a single character.`);
        }
        last = last.charCodeAt(0);
    }
    if (first > last) {
        throw new Error(`range: last must be less than or equal to first.`);
    }
    return {kind: "range", first, last, id: makeUniquesymbol()};
}

export function opt(arg : ExprnArg) : Expression {
    return sor([makeExpression(arg), seq([])]);
}

export function star(arg: ExprnArg) : Expression {
    return {kind: "star", star: makeExpression(arg), id: makeUniquesymbol()};
}

export function plus(arg: ExprnArg) : Expression {
    return {kind: "plus", plus: makeExpression(arg), id: makeUniquesymbol()};
}

export function seq(args: ExprnArg[]) : Expression {
    let exprns : Expression[] = [];
    for (let arg of args) {
        exprns.push(makeExpression(arg));
    }
    if (exprns.length == 1) {
        return exprns[0];
    }
    return {kind: "seq", seq: exprns, id: makeUniquesymbol()};
}

export function sor(args: ExprnArg[]) : Expression {
    let exprns : Expression[] = [];
    for (let arg of args) {
        exprns.push(makeExpression(arg));
    }
    if (exprns.length == 1) {
        return exprns[0];
    }
    return {kind: "sor", sor: exprns, id: makeUniquesymbol()};
}

export function at(arg: ExprnArg) : Expression {
    return {kind: 'at', at: makeExpression(arg), id: makeUniquesymbol()};
}

export function not_at(arg: ExprnArg) : Expression {
    return {kind: 'not_at', not_at: makeExpression(arg), id: makeUniquesymbol()};
}

export class Grammar<State> {
    rules: Rules;
    exprnActions: ExprnActions<State>;
    namedActions: RuleActions<State>;

    constructor() {
        this.rules = {};
        this.exprnActions = {};
        this.namedActions = {};
    }

    update(lval: Expression, rval: Expression) {
        let id = lval.id;
        Object.assign(lval, rval);
        lval.id = id;
    }

    with(exprn: Expression, action: Action<State>) : Expression {
        this.exprnActions[exprn.id] = action;
        return exprn;
    }
}

export class Parser<State> {
    grammar: Grammar<State>;
    in_predicate: number;

    constructor(grammar: Grammar<State>) {
        this.grammar = grammar;
        this.in_predicate = 0;
    }

    accept(arg : ExprnArg, input : string, state: State) : boolean {
        let inp = new Input(input);
        this.in_predicate = 0;
        return this.parse(makeExpression(arg), inp, state);
    }

    parse(exprn : Expression, input : Input, state: State) : boolean {
        let begin = input.position;
        let res = this.parseExprn(exprn, input, state);
        if (res && exprn.id in this.grammar.exprnActions && this.in_predicate == 0) {
            input.span[0] = begin;
            input.span[1] = input.position;
            this.grammar.exprnActions[exprn.id](input, state);
        }
        return res;
    }

    parseExprn(exprn : Expression, input : Input, state: State) : boolean {
        switch (exprn.kind) {
            case 'fwd': {
                throw new Error(`unresolved forward declaration.`);
            }
            case 'any': {
                if (input.position == input.length) {
                    return false;
                }
                input.position += 1;
                return true;
            }
            case 'one': {
                if (input.position == input.length) {
                    return false;
                }
                let ch = input.source[input.position];
                if (exprn.one.indexOf(ch) < 0) {
                    return false;
                }
                input.position += 1;
                return true;
            }
            case 'not_one': {
                if (input.position == input.length) {
                    return false;
                }
                let ch = input.source[input.position];
                if (exprn.not_one.indexOf(ch) >= 0) {
                    return false;
                }
                input.position += 1;
                return true;
            }
            case 'str': {
                let n = exprn.str.length;
                if (input.position + n > input.length) {
                    return false;
                }
                if (input.source.substring(input.position, input.position + n) == exprn.str) {
                    input.position += n;
                    return true;
                } else {
                    return false;
                }
            }
            case 'range': {
                if (input.position == input.length) {
                    return false;
                }
                let chrCode = input.source.charCodeAt(input.position);
                if (exprn.first <= chrCode && chrCode <= exprn.last) {
                    input.position += 1;
                    return true;
                }
                return false;
            }
            case 'seq': {
                for (let kid of exprn.seq) {
                    if (!this.parse(kid, input, state)) {
                        return false;
                    }
                }
                return true;
            }
            case 'sor': {
                let s = input.save();
                for (let kid of exprn.sor) {
                    if (this.parse(kid, input, state)) {
                        return true;
                    }
                    input.restore(s);
                }
                return false;
            }
            case 'plus': {
                let n = 0;
                while (this.parse(exprn.plus, input, state)) {
                    n += 1;
                }
                return n > 0;
            }
            case 'star': {
                let n = 0;
                while (this.parse(exprn.star, input, state)) {
                    n += 1;
                }
                return true;
            }
            case 'at': {
                let here = input.position;
                this.in_predicate += 1;
                let res = this.parse(exprn.at, input, state);
                this.in_predicate -= 1;
                input.position = here;
                return res;
            }
            case 'not_at': {
                let here = input.position;
                this.in_predicate += 1;
                let res = this.parse(exprn.not_at, input, state);
                this.in_predicate -= 1;
                input.position = here;
                return !res;
            }
        }
    }
};