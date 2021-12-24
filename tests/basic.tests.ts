import * as P from '../src/index';

import * as mocha from 'mocha';
import * as chai from 'chai';
const expect = chai.expect;

describe("test one", () => {
    let g = new P.Grammar<null>();
    let p = new P.Parser(g);
    it("test accepting a single literal", () => {
        let v = P.one('a');
        expect(p.accept(v, 'a', null)).to.eql(true);
    });
    it("test not accepting a single literal", () => {
        let v = P.one('a');
        expect(p.accept(v, 'b', null)).to.eql(false);
    });
    it("test accepting one of some alternatives", () => {
        let v = P.one('ab');
        expect(p.accept(v, 'a', null)).to.eql(true);
        expect(p.accept(v, 'b', null)).to.eql(true);
        expect(p.accept(v, 'c', null)).to.eql(false);
    });
});

describe("test str", () => {
    let g = new P.Grammar<null>();
    let p = new P.Parser(g);
    it("test accepting a single literal", () => {
        let v = P.str('qux');
        expect(p.accept(v, 'qu', null)).to.eql(false);
        expect(p.accept(v, 'qux', null)).to.eql(true);
        expect(p.accept(v, 'quxa', null)).to.eql(true);
        expect(p.accept(v, 'quux', null)).to.eql(false);
    });
});

describe("test range", () => {
    let g = new P.Grammar<null>();
    let p = new P.Parser(g);
    it("singleton range", () => {
        let v = P.range('a', 'a');
        expect(p.accept(v, 'a', null)).to.eql(true);
        expect(p.accept(v, 'b', null)).to.eql(false);
    });
    it("ordinary range (string)", () => {
        let v = P.range('a', 'z');
        expect(p.accept(v, 'a', null)).to.eql(true);
        expect(p.accept(v, 'b', null)).to.eql(true);
        expect(p.accept(v, '', null)).to.eql(false);
        expect(p.accept(v, 'A', null)).to.eql(false);
    });
    it("ordinary range (string)", () => {
        let v = P.range(97, 122);
        expect(p.accept(v, 'a', null)).to.eql(true);
        expect(p.accept(v, 'b', null)).to.eql(true);
        expect(p.accept(v, '', null)).to.eql(false);
        expect(p.accept(v, 'A', null)).to.eql(false);
    });
    it("invalid ranges", () => {
        expect(() => {P.range('', 'z')}).to.throw('range: first element of range must be a single character.');
        expect(() => {P.range('a', 'zz')}).to.throw('range: last element of range must be a single character.');
        expect(() => {P.range('z', 'a')}).to.throw('range: last must be less than or equal to first.');
    });
});

describe("test seq", () => {
    let g = new P.Grammar<null>();
    let p = new P.Parser(g);
    it("test empty sequence", () => {
        let v = P.seq([]);
        expect(p.accept(v, '', null)).to.eql(true);
    });
    it("test singleton sequence", () => {
        let v = P.seq([P.one('a')]);
        expect(p.accept(v, '', null)).to.eql(false);
        expect(p.accept(v, 'a', null)).to.eql(true);
        expect(p.accept(v, 'b', null)).to.eql(false);
        expect(p.accept(v, 'ab', null)).to.eql(true);
    });
    it("test 'long' sequence", () => {
        let v = P.seq([P.one('a'), P.one('b'), P.one('c')]);
        expect(p.accept(v, 'abc', null)).to.eql(true);
    });
});

describe("test sor", () => {
    let g = new P.Grammar<null>();
    let p = new P.Parser(g);
    it("test empty sor", () => {
        let v = P.sor([]);
        expect(p.accept(v, '', null)).to.eql(false);
        expect(p.accept(v, 'abc', null)).to.eql(false);
    });
    it("test singleton sor", () => {
        let v = P.sor([P.one('a')]);
        expect(p.accept(v, '', null)).to.eql(false);
        expect(p.accept(v, 'abc', null)).to.eql(true);
    });
    it("test multi sor", () => {
        let v = P.sor([P.one('a'), P.one('b')]);
        expect(p.accept(v, '', null)).to.eql(false);
        expect(p.accept(v, 'abc', null)).to.eql(true);
        expect(p.accept(v, 'bca', null)).to.eql(true);
        expect(p.accept(v, 'cab', null)).to.eql(false);
    });
});

describe("test star", () => {
    let g = new P.Grammar<null>();
    let p = new P.Parser(g);
    it("test star", () => {
        let v = P.star(P.one('a'));
        expect(p.accept(v, '', null)).to.eql(true);
        expect(p.accept(v, 'abc', null)).to.eql(true);
        expect(p.accept(v, 'aaac', null)).to.eql(true);
    });
    it("test star in seq", () => {
        let v = P.seq([P.star(P.one('a')), P.one('b')]);
        expect(p.accept(v, 'b', null)).to.eql(true);
        expect(p.accept(v, 'ab', null)).to.eql(true);
        expect(p.accept(v, 'aaab', null)).to.eql(true);
        expect(p.accept(v, 'aaac', null)).to.eql(false);
    });
});

describe("test plus", () => {
    let g = new P.Grammar<null>();
    let p = new P.Parser(g);
    it("test plus", () => {
        let v = P.plus(P.one('a'));
        expect(p.accept(v, '', null)).to.eql(false);
        expect(p.accept(v, 'abc', null)).to.eql(true);
        expect(p.accept(v, 'aaac', null)).to.eql(true);
    });
    it("test plus in seq", () => {
        let v = P.seq([P.plus(P.one('a')), P.one('b')]);
        expect(p.accept(v, 'b', null)).to.eql(false);
        expect(p.accept(v, 'ab', null)).to.eql(true);
        expect(p.accept(v, 'aaab', null)).to.eql(true);
        expect(p.accept(v, 'aaac', null)).to.eql(false);
    });
});

describe("test opt", () => {
    let g = new P.Grammar<null>();
    let p = new P.Parser(g);
    it("test opt", () => {
        let v = P.opt(P.one('a'));
        expect(p.accept(v, '', null)).to.eql(true);
        expect(p.accept(v, 'abc', null)).to.eql(true);
        expect(p.accept(v, 'bca', null)).to.eql(true);
        expect(p.accept(v, 'aaac', null)).to.eql(true);
    });  
});

describe("test named", () => {
    let g = new P.Grammar<null>();
    g.rules['foo'] = P.one('a');
    let p = new P.Parser(g);
    it("test named", () => {
        let v = P.named('foo');
        expect(p.accept(v, '', null)).to.eql(false);
        expect(p.accept(v, 'a', null)).to.eql(true);
        expect(p.accept(v, 'b', null)).to.eql(false);
    });
    it("test mis-named", () => {
        let v = P.named('bar');
        expect(() => p.accept(v, '', null)).to.throw("no such rule 'bar'");
    });
});

type Item = {kind: "num", value: number};

describe("test simple grammar", () => {
    let g = new P.Grammar<number[]>();
    g.rules = {
        num: P.plus(P.one("0123456789")),
        plusNum: P.seq([P.one("+"), "num"]),
        plus: P.seq(["num", P.star("plusNum")])
    };
    g.namedActions = {
        num: (input: P.Input, state: number[]) => {
            let n = Number(input.string());
            state.push(n);
        },
        plusNum: (input: P.Input, state: number[]) => {
            let x2 = state.pop() || 0;
            let x1 = state.pop() || 0;
            state.push(x1 + x2);
        }
    };
    let p = new P.Parser(g);
    it("just a number", () => {
        let stk : number[] = [];
        expect(p.accept("plus", "123", stk)).to.eql(true);
        expect(stk.length).to.eql(1);
        expect(stk[0]).to.eql(123);
    });
    it("just two numbers", () => {
        let stk : number[] = [];
        expect(p.accept("plus", "123+456", stk)).to.eql(true);
        expect(stk.length).to.eql(1);
        expect(stk[0]).to.eql(579);
    });
});

describe("recursive grammar", () => {
    let g = new P.Grammar<number[]>();
    g.rules = {
        num: P.plus(P.one("0123456789")),
        factor: P.sor(["num", P.seq([P.one('('), "exprn", P.one(')')])]),
        timesFactor: P.seq([P.one('*'), "factor"]),
        term: P.seq(["factor", P.star("timesFactor")]),
        plusTerm: P.seq([P.one("+"), "term"]),
        exprn: P.seq(["term", P.star("plusTerm")])
    };
    g.namedActions = {
        num: (input: P.Input, state: number[]) => { state.push(Number(input.string())); },
        timesFactor: (input: P.Input, state: number[]) => {
            let x2 = state.pop() || 0;
            let x1 = state.pop() || 0;
            state.push(x1 * x2);
        },
        plusTerm: (input: P.Input, state: number[]) => {
            let x2 = state.pop() || 0;
            let x1 = state.pop() || 0;
            state.push(x1 + x2);
        }
    };
    let p = new P.Parser(g);
    it("just a number", () => {
        let stk : number[] = [];
        expect(p.accept("exprn", "123", stk)).to.eql(true);
        expect(stk.length).to.eql(1);
        expect(stk[0]).to.eql(123);
    });
    it("just two numbers + ", () => {
        let stk : number[] = [];
        expect(p.accept("exprn", "123+456", stk)).to.eql(true);
        expect(stk.length).to.eql(1);
        expect(stk[0]).to.eql(579);
    });
    it("just two numbers *", () => {
        let stk : number[] = [];
        expect(p.accept("exprn", "123*456", stk)).to.eql(true);
        expect(stk.length).to.eql(1);
        expect(stk[0]).to.eql(56088);
    });
    it("a more complex expression", () => {
        let stk : number[] = [];
        expect(p.accept("exprn", "(1+2)*(3+4)+5*6", stk)).to.eql(true);
        expect(stk.length).to.eql(1);
        expect(stk[0]).to.eql(51);
    });
});

describe("test expression actions", () => {
    describe("one", () => {
        let g = new P.Grammar<Set<string>>();
        let e = g.one('a', (input: P.Input, state: Set<string>) => {
            state.add('a');
        });
        let p = new P.Parser(g);
        it("with this one", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'a', s)).to.eql(true);
            expect(s.size).to.eql(1);
            expect(s.has('a')).to.eql(true);    
        });
        it("without this one", () => {
            let s = new Set<string>();
            expect(p.accept(g.one('a'), 'a', s)).to.eql(true);
            expect(s.size).to.eql(0);
        });
    });

    describe("str", () => {
        let g = new P.Grammar<Set<string>>();
        let e = g.str('a', (input: P.Input, state: Set<string>) => {
            state.add('a');
        });
        let p = new P.Parser(g);
        it("with this str", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'a', s)).to.eql(true);
            expect(s.size).to.eql(1);
            expect(s.has('a')).to.eql(true);    
        });
        it("without this str", () => {
            let s = new Set<string>();
            expect(p.accept(g.str('a'), 'a', s)).to.eql(true);
            expect(s.size).to.eql(0);
        });
    });

    describe("range", () => {
        let g = new P.Grammar<Set<string>>();
        let e = g.range('a', 'z', (input: P.Input, state: Set<string>) => {
            state.add(input.string());
        });
        let p = new P.Parser(g);
        it("with this range", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'a', s)).to.eql(true);
            expect(s.size).to.eql(1);
            expect(s.has('a')).to.eql(true);    
        });
        it("without this range", () => {
            let s = new Set<string>();
            expect(p.accept(g.range('a', 'z'), 'a', s)).to.eql(true);
            expect(s.size).to.eql(0);
        });
    });

    describe("opt", () => {
        let g = new P.Grammar<Set<string>>();
        let e = g.opt(P.one('a'), (input: P.Input, state: Set<string>) => {
            state.add(input.string());
        });
        let p = new P.Parser(g);
        it("with this opt (1)", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'a', s)).to.eql(true);
            expect(s.size).to.eql(1);
            expect(s.has('a')).to.eql(true);    
        });
        it("with this opt (2)", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'b', s)).to.eql(true);
            expect(s.size).to.eql(1);
            expect(s.has('')).to.eql(true);    
        });
        it("without this opt (1)", () => {
            let s = new Set<string>();
            expect(p.accept(g.opt(g.one('a')), 'a', s)).to.eql(true);
            expect(s.size).to.eql(0);
        });
    });

    describe("star", () => {
        let g = new P.Grammar<Set<string>>();
        let e = g.star(P.one('a'), (input: P.Input, state: Set<string>) => {
            state.add(input.string());
        });
        let p = new P.Parser(g);
        it("with this star (1)", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'aaa', s)).to.eql(true);
            expect(s.size).to.eql(1);
            expect(s.has('aaa')).to.eql(true);    
        });
        it("with this star (2)", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'b', s)).to.eql(true);
            expect(s.size).to.eql(1);
            expect(s.has('')).to.eql(true);    
        });
        it("without this star (1)", () => {
            let s = new Set<string>();
            expect(p.accept(g.star(g.one('a')), 'aaa', s)).to.eql(true);
            expect(s.size).to.eql(0);
        });
    });

    describe("plus", () => {
        let g = new P.Grammar<Set<string>>();
        let e = g.plus(P.one('a'), (input: P.Input, state: Set<string>) => {
            state.add(input.string());
        });
        let p = new P.Parser(g);
        it("with this plus (1)", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'aaa', s)).to.eql(true);
            expect(s.size).to.eql(1);
            expect(s.has('aaa')).to.eql(true);    
        });
        it("with this plus (2)", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'b', s)).to.eql(false);
            expect(s.size).to.eql(0);
        });
        it("without this plus (1)", () => {
            let s = new Set<string>();
            expect(p.accept(g.plus(g.one('a')), 'aaa', s)).to.eql(true);
            expect(s.size).to.eql(0);
        });
    });

    describe("seq", () => {
        let g = new P.Grammar<Set<string>>();
        let e = g.seq([P.one('a'), P.one('b')], (input: P.Input, state: Set<string>) => {
            state.add(input.string());
        });
        let p = new P.Parser(g);
        it("with this seq (1)", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'ab', s)).to.eql(true);
            expect(s.size).to.eql(1);
            expect(s.has('ab')).to.eql(true);    
        });
        it("without this seq (1)", () => {
            let s = new Set<string>();
            expect(p.accept(g.seq([g.one('a'), g.one('b')]), 'ab', s)).to.eql(true);
            expect(s.size).to.eql(0);
        });
    });

    describe("sor", () => {
        let g = new P.Grammar<Set<string>>();
        let e = g.sor([P.one('a'), P.one('b')], (input: P.Input, state: Set<string>) => {
            state.add(input.string());
        });
        let p = new P.Parser(g);
        it("with this sor (1)", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'a', s)).to.eql(true);
            expect(s.size).to.eql(1);
            expect(s.has('a')).to.eql(true);    
        });
        it("with this sor (2)", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'b', s)).to.eql(true);
            expect(s.size).to.eql(1);
            expect(s.has('b')).to.eql(true);    
        });
        it("with this sor (3)", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'c', s)).to.eql(false);
            expect(s.size).to.eql(0);
        });
        it("without this sor (1)", () => {
            let s = new Set<string>();
            expect(p.accept(g.sor([g.one('a'), g.one('b')]), 'a', s)).to.eql(true);
            expect(s.size).to.eql(0);
        });
    });

    describe("named", () => {
        let g = new P.Grammar<Set<string>>();
        g.rules.qux = P.one('a');
        let e = g.named("qux", (input: P.Input, state: Set<string>) => {
            state.add(input.string());
        });
        let p = new P.Parser(g);
        it("with this named (1)", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'a', s)).to.eql(true);
            expect(s.size).to.eql(1);
            expect(s.has('a')).to.eql(true);    
        });
        it("with this named (2)", () => {
            let s = new Set<string>();
            expect(p.accept(e, 'c', s)).to.eql(false);
            expect(s.size).to.eql(0);
        });
        it("without this named (1)", () => {
            let s = new Set<string>();
            expect(p.accept(g.named('qux'), 'a', s)).to.eql(true);
            expect(s.size).to.eql(0);
        });
    });
});