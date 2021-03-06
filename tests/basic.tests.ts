import * as P from "../src/index";

import * as mocha from "mocha";
import * as chai from "chai";
const expect = chai.expect;

describe("test fwd", () => {
    let g = new P.Grammar<null>();
    let p = new P.Parser(g);
    it ("test attempting to parse a forward declaration", () => {
        let v = P.fwd();
        expect(() => { p.accept(v, "", null); }).to.throw("unresolved forward declaration");
    });
    it("test assigning a forward delcalration", () => {
        let v = P.fwd();
        g.update(v, P.one('a'));
        expect(p.accept(v, "a", null)).to.eql(true);
    })
});

describe("test one", () => {
  let g = new P.Grammar<null>();
  let p = new P.Parser(g);
  it("test accepting a single literal", () => {
    let v = P.one("a");
    expect(p.accept(v, "a", null)).to.eql(true);
  });
  it("test not accepting a single literal", () => {
    let v = P.one("a");
    expect(p.accept(v, "b", null)).to.eql(false);
  });
  it("test accepting one of some alternatives", () => {
    let v = P.one("ab");
    expect(p.accept(v, "a", null)).to.eql(true);
    expect(p.accept(v, "b", null)).to.eql(true);
    expect(p.accept(v, "c", null)).to.eql(false);
  });
});

describe("test not_one", () => {
  let g = new P.Grammar<null>();
  let p = new P.Parser(g);
  it("test accepting an empty input", () => {
    let v = P.not_one("a");
    expect(p.accept(v, "", null)).to.eql(false);
  });
  it("test accepting a single literal", () => {
    let v = P.not_one("a");
    expect(p.accept(v, "a", null)).to.eql(false);
  });
  it("test not accepting a single literal", () => {
    let v = P.not_one("a");
    expect(p.accept(v, "b", null)).to.eql(true);
  });
  it("test accepting one of some alternatives", () => {
    let v = P.not_one("ab");
    expect(p.accept(v, "a", null)).to.eql(false);
    expect(p.accept(v, "b", null)).to.eql(false);
    expect(p.accept(v, "c", null)).to.eql(true);
  });
});

describe("test str", () => {
  let g = new P.Grammar<null>();
  let p = new P.Parser(g);
  it("test accepting a single literal", () => {
    let v = P.str("qux");
    expect(p.accept(v, "qu", null)).to.eql(false);
    expect(p.accept(v, "qux", null)).to.eql(true);
    expect(p.accept(v, "quxa", null)).to.eql(true);
    expect(p.accept(v, "quux", null)).to.eql(false);
  });
});

describe("test range", () => {
  let g = new P.Grammar<null>();
  let p = new P.Parser(g);
  it("singleton range", () => {
    let v = P.range("a", "a");
    expect(p.accept(v, "a", null)).to.eql(true);
    expect(p.accept(v, "b", null)).to.eql(false);
  });
  it("ordinary range (string)", () => {
    let v = P.range("a", "z");
    expect(p.accept(v, "a", null)).to.eql(true);
    expect(p.accept(v, "b", null)).to.eql(true);
    expect(p.accept(v, "", null)).to.eql(false);
    expect(p.accept(v, "A", null)).to.eql(false);
  });
  it("ordinary range (string)", () => {
    let v = P.range(97, 122);
    expect(p.accept(v, "a", null)).to.eql(true);
    expect(p.accept(v, "b", null)).to.eql(true);
    expect(p.accept(v, "", null)).to.eql(false);
    expect(p.accept(v, "A", null)).to.eql(false);
  });
  it("invalid ranges", () => {
    expect(() => {
      P.range("", "z");
    }).to.throw("range: first element of range must be a single character.");
    expect(() => {
      P.range("a", "zz");
    }).to.throw("range: last element of range must be a single character.");
    expect(() => {
      P.range("z", "a");
    }).to.throw("range: last must be less than or equal to first.");
  });
});

describe("test seq", () => {
  let g = new P.Grammar<null>();
  let p = new P.Parser(g);
  it("test empty sequence", () => {
    let v = P.seq([]);
    expect(p.accept(v, "", null)).to.eql(true);
  });
  it("test singleton sequence", () => {
    let v = P.seq([P.one("a")]);
    expect(p.accept(v, "", null)).to.eql(false);
    expect(p.accept(v, "a", null)).to.eql(true);
    expect(p.accept(v, "b", null)).to.eql(false);
    expect(p.accept(v, "ab", null)).to.eql(true);
  });
  it("test 'long' sequence", () => {
    let v = P.seq([P.one("a"), P.one("b"), P.one("c")]);
    expect(p.accept(v, "abc", null)).to.eql(true);
  });
});

describe("test sor", () => {
  let g = new P.Grammar<null>();
  let p = new P.Parser(g);
  it("test empty sor", () => {
    let v = P.sor([]);
    expect(p.accept(v, "", null)).to.eql(false);
    expect(p.accept(v, "abc", null)).to.eql(false);
  });
  it("test singleton sor", () => {
    let v = P.sor([P.one("a")]);
    expect(p.accept(v, "", null)).to.eql(false);
    expect(p.accept(v, "abc", null)).to.eql(true);
  });
  it("test multi sor", () => {
    let v = P.sor([P.one("a"), P.one("b")]);
    expect(p.accept(v, "", null)).to.eql(false);
    expect(p.accept(v, "abc", null)).to.eql(true);
    expect(p.accept(v, "bca", null)).to.eql(true);
    expect(p.accept(v, "cab", null)).to.eql(false);
  });
});

describe("test star", () => {
  let g = new P.Grammar<null>();
  let p = new P.Parser(g);
  it("test star", () => {
    let v = P.star(P.one("a"));
    expect(p.accept(v, "", null)).to.eql(true);
    expect(p.accept(v, "abc", null)).to.eql(true);
    expect(p.accept(v, "aaac", null)).to.eql(true);
  });
  it("test star in seq", () => {
    let v = P.seq([P.star(P.one("a")), P.one("b")]);
    expect(p.accept(v, "b", null)).to.eql(true);
    expect(p.accept(v, "ab", null)).to.eql(true);
    expect(p.accept(v, "aaab", null)).to.eql(true);
    expect(p.accept(v, "aaac", null)).to.eql(false);
  });
});

describe("test plus", () => {
  let g = new P.Grammar<null>();
  let p = new P.Parser(g);
  it("test plus", () => {
    let v = P.plus(P.one("a"));
    expect(p.accept(v, "", null)).to.eql(false);
    expect(p.accept(v, "abc", null)).to.eql(true);
    expect(p.accept(v, "aaac", null)).to.eql(true);
  });
  it("test plus in seq", () => {
    let v = P.seq([P.plus(P.one("a")), P.one("b")]);
    expect(p.accept(v, "b", null)).to.eql(false);
    expect(p.accept(v, "ab", null)).to.eql(true);
    expect(p.accept(v, "aaab", null)).to.eql(true);
    expect(p.accept(v, "aaac", null)).to.eql(false);
  });
});

describe("test opt", () => {
  let g = new P.Grammar<null>();
  let p = new P.Parser(g);
  it("test opt", () => {
    let v = P.opt(P.one("a"));
    expect(p.accept(v, "", null)).to.eql(true);
    expect(p.accept(v, "abc", null)).to.eql(true);
    expect(p.accept(v, "bca", null)).to.eql(true);
    expect(p.accept(v, "aaac", null)).to.eql(true);
  });
});

describe("test at and not_at", () => {
  let g = new P.Grammar<null>();
  let p = new P.Parser(g);
  let a = P.one("a");
  it("test at with matching prefix", () => {
    let v = P.at(a);
    expect(p.accept(v, "a", null)).to.eql(true);
  });
  it("test not_at with matching prefix", () => {
    let v = P.not_at(a);
    expect(p.accept(v, "a", null)).to.eql(false);
  });
  it("test at with non-matching prefix", () => {
    let v = P.at(a);
    expect(p.accept(v, "b", null)).to.eql(false);
  });
  it("test not_at with non-matching prefix", () => {
    let v = P.not_at(a);
    expect(p.accept(v, "b", null)).to.eql(true);
  });
});

describe("test at and not_at with actions", () => {
  let letter = P.range("a", "z");
  let keywords: string[] = ["auto", "char", "bool", "do", "double", "int"];

  let g = new P.Grammar<string[]>();
  g.rules.identifier = P.plus(letter);
  g.rules.keyword = P.sor(
    keywords.map((kw: string) => {
      return P.seq([P.str(kw), P.not_at(g.rules.identifier)]);
    })
  );
  g.with(g.rules.identifier, (input: P.Input, state: string[]) => {
    state.push(input.string());
  });
  g.with(g.rules.keyword, (input: P.Input, state: string[]) => {
    state.push(input.string());
  });
  let p = new P.Parser(g);
  for (let kw of keywords) {
      it(`test '${kw}`, () => {
          let stk : string[] = [];
          expect(p.accept(g.rules.keyword, kw, stk)).to.eql(true);
          expect(stk.length).to.eql(1);
          expect(stk[0]).to.eql(kw);
      });
  }
});

type Item = { kind: "num"; value: number };

describe("test simple grammar", () => {
  let g = new P.Grammar<number[]>();
  g.rules.num = P.plus(P.one("0123456789"));
  g.rules.plusNum = P.seq([P.one("+"), g.rules.num]);
  g.rules.plus = P.seq([g.rules.num, P.star(g.rules.plusNum)]);
  g.with(g.rules.num, (input: P.Input, state: number[]) => {
    let n = Number(input.string());
    state.push(n);
  });
  g.with(g.rules.plusNum, (input: P.Input, state: number[]) => {
    let x2 = state.pop() || 0;
    let x1 = state.pop() || 0;
    state.push(x1 + x2);
  });
  let p = new P.Parser(g);
  it("just a number", () => {
    let stk: number[] = [];
    expect(p.accept(g.rules.plus, "123", stk)).to.eql(true);
    expect(stk.length).to.eql(1);
    expect(stk[0]).to.eql(123);
  });
  it("just two numbers", () => {
    let stk: number[] = [];
    expect(p.accept(g.rules.plus, "123+456", stk)).to.eql(true);
    expect(stk.length).to.eql(1);
    expect(stk[0]).to.eql(579);
  });
});

describe("recursive grammar", () => {
  let g = new P.Grammar<number[]>();
  g.rules.exprn = P.fwd();
  g.rules.num = P.plus(P.one("0123456789"));
  g.rules.factor = P.sor([g.rules.num, P.seq([P.one("("), g.rules.exprn, P.one(")")])]);
  g.rules.timesFactor = P.seq([P.one("*"), g.rules.factor]);
  g.rules.term = P.seq([g.rules.factor, P.star(g.rules.timesFactor)]);
  g.rules.plusTerm = P.seq([P.one("+"), g.rules.term]);
  g.update(g.rules.exprn, P.seq([g.rules.term, P.star(g.rules.plusTerm)]));

  g.with(g.rules.num, (input: P.Input, state: number[]) => {
    state.push(Number(input.string()));
  });
  g.with(g.rules.timesFactor, (input: P.Input, state: number[]) => {
    let x2 = state.pop() || 0;
    let x1 = state.pop() || 0;
    state.push(x1 * x2);
  });
  g.with(g.rules.plusTerm, (input: P.Input, state: number[]) => {
    let x2 = state.pop() || 0;
    let x1 = state.pop() || 0;
    state.push(x1 + x2);
  });

  let p = new P.Parser(g);
  it("just a number", () => {
    let stk: number[] = [];
    expect(p.accept(g.rules.exprn, "123", stk)).to.eql(true);
    expect(stk.length).to.eql(1);
    expect(stk[0]).to.eql(123);
  });
  it("just two numbers + ", () => {
    let stk: number[] = [];
    expect(p.accept(g.rules.exprn, "123+456", stk)).to.eql(true);
    expect(stk.length).to.eql(1);
    expect(stk[0]).to.eql(579);
  });
  it("just two numbers *", () => {
    let stk: number[] = [];
    expect(p.accept(g.rules.exprn, "123*456", stk)).to.eql(true);
    expect(stk.length).to.eql(1);
    expect(stk[0]).to.eql(56088);
  });
  it("a more complex expression", () => {
    let stk: number[] = [];
    expect(p.accept(g.rules.exprn, "(1+2)*(3+4)+5*6", stk)).to.eql(true);
    expect(stk.length).to.eql(1);
    expect(stk[0]).to.eql(51);
  });
});

describe("test expression actions", () => {
  describe("one", () => {
    let g = new P.Grammar<Set<string>>();
    let e = g.with(P.one('a'), (input: P.Input, state: Set<string>) => {
        state.add("a");
      });
    let p = new P.Parser(g);
    it("with this one", () => {
      let s = new Set<string>();
      expect(p.accept(e, "a", s)).to.eql(true);
      expect(s.size).to.eql(1);
      expect(s.has("a")).to.eql(true);
    });
    it("without this one", () => {
      let s = new Set<string>();
      expect(p.accept(P.one("a"), "a", s)).to.eql(true);
      expect(s.size).to.eql(0);
    });
  });

  describe("str", () => {
    let g = new P.Grammar<Set<string>>();
    let e = g.with(P.str("a"), (input: P.Input, state: Set<string>) => {
      state.add("a");
    });
    let p = new P.Parser(g);
    it("with this str", () => {
      let s = new Set<string>();
      expect(p.accept(e, "a", s)).to.eql(true);
      expect(s.size).to.eql(1);
      expect(s.has("a")).to.eql(true);
    });
    it("without this str", () => {
      let s = new Set<string>();
      expect(p.accept(P.str("a"), "a", s)).to.eql(true);
      expect(s.size).to.eql(0);
    });
  });

  describe("range", () => {
    let g = new P.Grammar<Set<string>>();
    let e = g.with(P.range("a", "z"), (input: P.Input, state: Set<string>) => {
      state.add(input.string());
    });
    let p = new P.Parser(g);
    it("with this range", () => {
      let s = new Set<string>();
      expect(p.accept(e, "a", s)).to.eql(true);
      expect(s.size).to.eql(1);
      expect(s.has("a")).to.eql(true);
    });
    it("without this range", () => {
      let s = new Set<string>();
      expect(p.accept(P.range("a", "z"), "a", s)).to.eql(true);
      expect(s.size).to.eql(0);
    });
  });

  describe("opt", () => {
    let g = new P.Grammar<Set<string>>();
    let e = g.with(P.opt(P.one("a")), (input: P.Input, state: Set<string>) => {
      state.add(input.string());
    });
    let p = new P.Parser(g);
    it("with this opt (1)", () => {
      let s = new Set<string>();
      expect(p.accept(e, "a", s)).to.eql(true);
      expect(s.size).to.eql(1);
      expect(s.has("a")).to.eql(true);
    });
    it("with this opt (2)", () => {
      let s = new Set<string>();
      expect(p.accept(e, "b", s)).to.eql(true);
      expect(s.size).to.eql(1);
      expect(s.has("")).to.eql(true);
    });
    it("without this opt (1)", () => {
      let s = new Set<string>();
      expect(p.accept(P.opt(P.one("a")), "a", s)).to.eql(true);
      expect(s.size).to.eql(0);
    });
  });

  describe("star", () => {
    let g = new P.Grammar<Set<string>>();
    let e = g.with(P.star(P.one("a")), (input: P.Input, state: Set<string>) => {
      state.add(input.string());
    });
    let p = new P.Parser(g);
    it("with this star (1)", () => {
      let s = new Set<string>();
      expect(p.accept(e, "aaa", s)).to.eql(true);
      expect(s.size).to.eql(1);
      expect(s.has("aaa")).to.eql(true);
    });
    it("with this star (2)", () => {
      let s = new Set<string>();
      expect(p.accept(e, "b", s)).to.eql(true);
      expect(s.size).to.eql(1);
      expect(s.has("")).to.eql(true);
    });
    it("without this star (1)", () => {
      let s = new Set<string>();
      expect(p.accept(P.star(P.one("a")), "aaa", s)).to.eql(true);
      expect(s.size).to.eql(0);
    });
  });

  describe("plus", () => {
    let g = new P.Grammar<Set<string>>();
    let e = g.with(P.plus(P.one("a")), (input: P.Input, state: Set<string>) => {
      state.add(input.string());
    });
    let p = new P.Parser(g);
    it("with this plus (1)", () => {
      let s = new Set<string>();
      expect(p.accept(e, "aaa", s)).to.eql(true);
      expect(s.size).to.eql(1);
      expect(s.has("aaa")).to.eql(true);
    });
    it("with this plus (2)", () => {
      let s = new Set<string>();
      expect(p.accept(e, "b", s)).to.eql(false);
      expect(s.size).to.eql(0);
    });
    it("without this plus (1)", () => {
      let s = new Set<string>();
      expect(p.accept(P.plus(P.one("a")), "aaa", s)).to.eql(true);
      expect(s.size).to.eql(0);
    });
  });

  describe("seq", () => {
    let g = new P.Grammar<Set<string>>();
    let e = g.with(P.seq(
      [P.one("a"), P.one("b")]),
      (input: P.Input, state: Set<string>) => {
        state.add(input.string());
      }
    );
    let p = new P.Parser(g);
    it("with this seq (1)", () => {
      let s = new Set<string>();
      expect(p.accept(e, "ab", s)).to.eql(true);
      expect(s.size).to.eql(1);
      expect(s.has("ab")).to.eql(true);
    });
    it("without this seq (1)", () => {
      let s = new Set<string>();
      expect(p.accept(P.seq([P.one("a"), P.one("b")]), "ab", s)).to.eql(true);
      expect(s.size).to.eql(0);
    });
  });

  describe("sor", () => {
    let g = new P.Grammar<Set<string>>();
    let e = g.with(P.sor(
      [P.one("a"), P.one("b")]),
      (input: P.Input, state: Set<string>) => {
        state.add(input.string());
      }
    );
    let p = new P.Parser(g);
    it("with this sor (1)", () => {
      let s = new Set<string>();
      expect(p.accept(e, "a", s)).to.eql(true);
      expect(s.size).to.eql(1);
      expect(s.has("a")).to.eql(true);
    });
    it("with this sor (2)", () => {
      let s = new Set<string>();
      expect(p.accept(e, "b", s)).to.eql(true);
      expect(s.size).to.eql(1);
      expect(s.has("b")).to.eql(true);
    });
    it("with this sor (3)", () => {
      let s = new Set<string>();
      expect(p.accept(e, "c", s)).to.eql(false);
      expect(s.size).to.eql(0);
    });
    it("without this sor (1)", () => {
      let s = new Set<string>();
      expect(p.accept(P.sor([P.one("a"), P.one("b")]), "a", s)).to.eql(true);
      expect(s.size).to.eql(0);
    });
  });

  describe("named", () => {
    let g = new P.Grammar<Set<string>>();
    g.rules.qux = P.one("a");
    let e = g.with(g.rules.qux, (input: P.Input, state: Set<string>) => {
      state.add(input.string());
    });
    let p = new P.Parser(g);
    it("with this named (1)", () => {
      let s = new Set<string>();
      expect(p.accept(e, "a", s)).to.eql(true);
      expect(s.size).to.eql(1);
      expect(s.has("a")).to.eql(true);
    });
    it("with this named (2)", () => {
      let s = new Set<string>();
      expect(p.accept(e, "c", s)).to.eql(false);
      expect(s.size).to.eql(0);
    });
    it("without this named (1)", () => {
      let s = new Set<string>();
      expect(p.accept(P.one("a"), "a", s)).to.eql(true);
      expect(s.size).to.eql(0);
    });
  });
});
