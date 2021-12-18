
export interface One {kind: "one", one: string};
export interface Star {kind: "star", star: Expression};
export interface Plus {kind: "plus", plus: Expression};
export interface Seq {kind: "seq", seq: Expression[]};
export interface Sor {kind: "sor", sor: Expression[]};
export interface Named {kind: "named", named: string};

export type Expression = One | Star | Plus | Seq | Sor | Named;

export interface Rules {
    [index: string]: Expression
};

export type Action = ((arg : string) => void);

export interface Actions {
    [index: string]: Action
}

export function one(chrs : string) : Expression {
    return {kind: "one", one: chrs};
}

export function star(exprn: Expression) : Expression {
    return {kind: "star", star: exprn};
}

export function plus(exprn: Expression) : Expression {
    return {kind: "plus", plus: exprn};
}

export function seq(exprns: Expression[]) : Expression {
    return {kind: "seq", seq: exprns};
}

export function sor(exprns: Expression[]) : Expression {
    return {kind: "sor", sor: exprns};
}

export function named(name: string) : Expression {
    return {kind: "named", named: name};
}

export class Input {
    source: string;
    position: number;
    length: number;

    constructor(source : string) {
        this.source = source;
        this.position = 0;
        this.length = this.source.length;
    }

    save() : number {
        return this.position;
    }

    restore(position : number) {
        this.position = position;
    }
}

export class Parser {
    rules: Rules;
    actions: Actions;

    constructor(rules : Rules = {}, actions: Actions = {}) {
        this.rules = rules;
        this.actions = actions;
    }

    accept(exprn : Expression, input : string) : boolean {
        let inp = new Input(input);
        return this.doParse(exprn, inp);
    }

    doParse(exprn : Expression, input : Input) : boolean {
        switch (exprn.kind) {
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
            case 'seq': {
                for (let kid of exprn.seq) {
                    if (!this.doParse(kid, input)) {
                        return false;
                    }
                }
                return true;
            }
            case 'sor': {
                let s = input.save();
                for (let kid of exprn.sor) {
                    if (this.doParse(kid, input)) {
                        return true;
                    }
                    input.restore(s);
                }
                return false;
            }
            case 'plus': {
                let n = 0;
                while (this.doParse(exprn.plus, input)) {
                    n += 1;
                }
                return n > 0;
            }
            case 'star': {
                let n = 0;
                while (this.doParse(exprn.star, input)) {
                    n += 1;
                }
                return true;
            }
            case 'named': {
                if (!(exprn.named in this.rules)) {
                    throw new Error(`no such rule '${exprn.named}'`);
                }
                let p = input.position;
                let res = this.doParse(this.rules[exprn.named], input);
                if (res && (exprn.named in this.actions)) {
                    let a : Action = this.actions[exprn.named];
                    a(input.source.substring(p, input.position));
                }
                return res;
            }
        }
    }
};