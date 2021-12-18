import * as P from '../src/index';

import * as mocha from 'mocha';
import * as chai from 'chai';
const expect = chai.expect;

describe("test one", () => {
    let p = new P.Parser();
    it("test creating a literal", () => {
        let v = P.one('a');
        expect(v).to.eql({kind: "one", one:"a"});
    });
    it("test accepting a single literal", () => {
        let v = P.one('a');
        expect(p.accept(v, 'a')).to.eql(true);
    });
    it("test not accepting a single literal", () => {
        let v = P.one('a');
        expect(p.accept(v, 'b')).to.eql(false);
    });
    it("test accepting one of some alternatives", () => {
        let v = P.one('ab');
        expect(p.accept(v, 'a')).to.eql(true);
        expect(p.accept(v, 'b')).to.eql(true);
        expect(p.accept(v, 'c')).to.eql(false);
    });
});

describe("test seq", () => {
    let p = new P.Parser();
    it("test empty sequence", () => {
        let v = P.seq([]);
        expect(p.accept(v, '')).to.eql(true);
    });
    it("test singleton sequence", () => {
        let v = P.seq([P.one('a')]);
        expect(p.accept(v, '')).to.eql(false);
        expect(p.accept(v, 'a')).to.eql(true);
        expect(p.accept(v, 'b')).to.eql(false);
        expect(p.accept(v, 'ab')).to.eql(true);
    });
    it("test 'long' sequence", () => {
        let v = P.seq([P.one('a'), P.one('b'), P.one('c')]);
        expect(p.accept(v, 'abc')).to.eql(true);
    });
});

describe("test sor", () => {
    let p = new P.Parser();
    it("test empty sor", () => {
        let v = P.sor([]);
        expect(p.accept(v, '')).to.eql(false);
        expect(p.accept(v, 'abc')).to.eql(false);
    });
    it("test singleton sor", () => {
        let v = P.sor([P.one('a')]);
        expect(p.accept(v, '')).to.eql(false);
        expect(p.accept(v, 'abc')).to.eql(true);
    });
    it("test multi sor", () => {
        let v = P.sor([P.one('a'), P.one('b')]);
        expect(p.accept(v, '')).to.eql(false);
        expect(p.accept(v, 'abc')).to.eql(true);
        expect(p.accept(v, 'bca')).to.eql(true);
        expect(p.accept(v, 'cab')).to.eql(false);
    });
});

describe("test star", () => {
    let p = new P.Parser();
    it("test star", () => {
        let v = P.star(P.one('a'));
        expect(p.accept(v, '')).to.eql(true);
        expect(p.accept(v, 'abc')).to.eql(true);
        expect(p.accept(v, 'aaac')).to.eql(true);
    });
    it("test star in seq", () => {
        let v = P.seq([P.star(P.one('a')), P.one('b')]);
        expect(p.accept(v, 'b')).to.eql(true);
        expect(p.accept(v, 'ab')).to.eql(true);
        expect(p.accept(v, 'aaab')).to.eql(true);
        expect(p.accept(v, 'aaac')).to.eql(false);
    });
});

describe("test plus", () => {
    let p = new P.Parser();
    it("test plus", () => {
        let v = P.plus(P.one('a'));
        expect(p.accept(v, '')).to.eql(false);
        expect(p.accept(v, 'abc')).to.eql(true);
        expect(p.accept(v, 'aaac')).to.eql(true);
    });
    it("test plus in seq", () => {
        let v = P.seq([P.plus(P.one('a')), P.one('b')]);
        expect(p.accept(v, 'b')).to.eql(false);
        expect(p.accept(v, 'ab')).to.eql(true);
        expect(p.accept(v, 'aaab')).to.eql(true);
        expect(p.accept(v, 'aaac')).to.eql(false);
    });
});

describe("test named", () => {
    let p = new P.Parser({foo: P.one('a')});
    it("test named", () => {
        let v = P.named('foo');
        expect(p.accept(v, '')).to.eql(false);
        expect(p.accept(v, 'a')).to.eql(true);
        expect(p.accept(v, 'b')).to.eql(false);
    });
    it("test mis-named", () => {
        let v = P.named('bar');
        expect(() => p.accept(v, '')).to.throw("no such rule 'bar'");
    });
});

describe("test action", () => {
    it("closure instanceof function", () => {
        expect(((s : string) => {}) instanceof Function).to.eql(true);
    });
    it("construct action 0", () => {
        let a = P.action(() => {});
        expect(a.arity).to.eql(0);
    });
    it("construct action 1", () => {
        let a = P.action((s : string) => {});
        expect(a.arity).to.eql(1);
    });
    it("try an action 1", () => {
        let x = '';
        let p = new P.Parser({foo: P.one('a')}, {foo: P.action((s:string) => { x = s; })});
        expect(p.accept(P.named("foo"), 'b')).to.eql(false);
        expect(x).to.eql('');   
    });
    it("try an action 2", () => {
        let x = '';
        let p = new P.Parser({foo: P.one('a')}, {foo: P.action((s:string) => { x = s; })});
        expect(p.accept(P.named("foo"), 'a')).to.eql(true);
        expect(x).to.eql('a');   
    });
});

type Item = {kind: "num", value: number};

describe("test simple grammar", () => {
    let stk : number[] = [];

    const rules = {
        num: P.plus(P.one("0123456789")),
        plusNum: P.seq([P.one("+"), "num"]),
        plus: P.seq(["num", P.star("plusNum")])
    };
    const actions : P.Actions = {
        num: P.action((s : string) => { stk.push(Number(s)); }),
        plusNum: P.action(() => {
            let x2 = stk.pop() || 0;
            let x1 = stk.pop() || 0;
            stk.push(x1 + x2);
        })
    };
    let p = new P.Parser(rules, actions);
    it("just a number", () => {
        stk = [];
        expect(p.accept("plus", "123")).to.eql(true);
        expect(stk.length).to.eql(1);
        expect(stk[0]).to.eql(123);
    });
    it("just two numbers", () => {
        stk = [];
        expect(p.accept("plus", "123+456")).to.eql(true);
        expect(stk.length).to.eql(1);
        expect(stk[0]).to.eql(579);
    });
});

describe("recursive grammar", () => {
    let stk : number[] = [];

    const rules = {
        num: P.plus(P.one("0123456789")),
        factor: P.sor(["num", P.seq([P.one('('), "exprn", P.one(')')])]),
        timesFactor: P.seq([P.one('*'), "factor"]),
        term: P.seq(["factor", P.star("timesFactor")]),
        plusTerm: P.seq([P.one("+"), "term"]),
        exprn: P.seq(["term", P.star("plusTerm")])
    };
    const actions : P.Actions = {
        num: P.action((s : string) => { stk.push(Number(s)); }),
        timesFactor: P.action(() => {
            let x2 = stk.pop() || 0;
            let x1 = stk.pop() || 0;
            console.log(`${x1} * ${x2}`);
            stk.push(x1 * x2);
        }),
        plusTerm: P.action(() => {
            let x2 = stk.pop() || 0;
            let x1 = stk.pop() || 0;
            console.log(`${x1} + ${x2}`);
            stk.push(x1 + x2);
        })
    };
    let p = new P.Parser(rules, actions);
    it("just a number", () => {
        stk = [];
        expect(p.accept("exprn", "123")).to.eql(true);
        expect(stk.length).to.eql(1);
        expect(stk[0]).to.eql(123);
    });
    it("just two numbers + ", () => {
        stk = [];
        expect(p.accept("exprn", "123+456")).to.eql(true);
        expect(stk.length).to.eql(1);
        expect(stk[0]).to.eql(579);
    });
    it("just two numbers *", () => {
        stk = [];
        expect(p.accept("exprn", "123*456")).to.eql(true);
        expect(stk.length).to.eql(1);
        expect(stk[0]).to.eql(56088);
    });
    it("a more complex expression", () => {
        stk = [];
        expect(p.accept("exprn", "(1+2)*(3+4)+5*6")).to.eql(true);
        expect(stk.length).to.eql(1);
        expect(stk[0]).to.eql(51);
    });
});