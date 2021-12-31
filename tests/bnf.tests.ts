import * as B from "../examples/bnf";
import * as P from "../src/index";

import * as mocha from "mocha";
import * as chai from "chai";
import { G } from "../examples/sql";
const expect = chai.expect;

import path from "path";
import fs from "fs";

describe("elementry rules", () => {
  let p = new P.Parser(B.grammar);
  it("simple rule 1", () => {
    const s = "<foo> ::= A";
    let stk: B.Node[] = [];
    expect(p.accept(B.grammar.rules.declaration, s, stk)).to.eql(true);
    let exp =
      '[{"kind":"definition","name":"foo","body":{"kind":"literal","value":"A"},"mode":"loose"}]';
    expect(JSON.stringify(stk)).to.eql(exp);
  });
  it("simple rule 2", () => {
    const s = "<foo> ::= <bar baz>";
    let stk: B.Node[] = [];
    expect(p.accept(B.grammar.rules.declaration, s, stk)).to.eql(true);
    let exp =
      '[{"kind":"definition","name":"foo","body":{"kind":"name","value":"bar baz"},"mode":"loose"}]';
    expect(JSON.stringify(stk)).to.eql(exp);
  });
  it("simple rule 3", () => {
    const s = "<foo> ::= <bar baz>...";
    let stk: B.Node[] = [];
    expect(p.accept(B.grammar.rules.declaration, s, stk)).to.eql(true);
    let exp =
      '[{"kind":"definition","name":"foo","body":{"kind":"plus","value":{"kind":"name","value":"bar baz"}},"mode":"loose"}]';
    expect(JSON.stringify(stk)).to.eql(exp);
  });
  it("simple rule 4", () => {
    const s = "<foo> ::= <bar> <baz>";
    let stk: B.Node[] = [];
    expect(p.accept(B.grammar.rules.declaration, s, stk)).to.eql(true);
    let exp =
      '[{"kind":"definition","name":"foo","body":{"kind":"conj","value":[{"kind":"name","value":"bar"},{"kind":"name","value":"baz"}]},"mode":"loose"}]';
    expect(JSON.stringify(stk)).to.eql(exp);
  });
  it("simple rule 5", () => {
    const s = "<foo> ::= <bar> <baz> | <qux>";
    let stk: B.Node[] = [];
    expect(p.accept(B.grammar.rules.declaration, s, stk)).to.eql(true);
    let exp =
      '[{"kind":"definition","name":"foo","body":{"kind":"disj","value":[{"kind":"conj","value":[{"kind":"name","value":"bar"},{"kind":"name","value":"baz"}]},{"kind":"name","value":"qux"}]},"mode":"loose"}]';
    expect(JSON.stringify(stk)).to.eql(exp);
  });
  it("simple rule 6", () => {
    const s = "<foo> ::= <bar> | <baz> <qux>";
    let stk: B.Node[] = [];
    expect(p.accept(B.grammar.rules.declaration, s, stk)).to.eql(true);
    let exp =
      '[{"kind":"definition","name":"foo","body":{"kind":"disj","value":[{"kind":"name","value":"bar"},{"kind":"conj","value":[{"kind":"name","value":"baz"},{"kind":"name","value":"qux"}]}]},"mode":"loose"}]';
    expect(JSON.stringify(stk)).to.eql(exp);
  });
  it("simple rule 7", () => {
    const s = "<foo> ::= [ <baz> <qux> ]";
    let stk: B.Node[] = [];
    expect(p.accept(B.grammar.rules.declaration, s, stk)).to.eql(true);
    let exp =
      '[{"kind":"definition","name":"foo","body":{"kind":"opt","value":{"kind":"conj","value":[{"kind":"name","value":"baz"},{"kind":"name","value":"qux"}]}},"mode":"loose"}]';
    expect(JSON.stringify(stk)).to.eql(exp);
  });
  it("simple rule 8", () => {
    const s = "<foo> ::= [ <baz> <qux> ] <bar> <foo>";
    let stk: B.Node[] = [];
    expect(p.accept(B.grammar.rules.declaration, s, stk)).to.eql(true);
    let exp =
      '[{"kind":"definition","name":"foo","body":{"kind":"conj","value":[{"kind":"opt","value":{"kind":"conj","value":[{"kind":"name","value":"baz"},{"kind":"name","value":"qux"}]}},{"kind":"name","value":"bar"},{"kind":"name","value":"foo"}]},"mode":"loose"}]';
    expect(JSON.stringify(stk)).to.eql(exp);
  });
});

describe("some examples from the SQL grammar", () => {
  let p = new P.Parser(B.grammar);
  it("character string literal (1)", () => {
    const s =
      "<character string literal> ::= [ <introducer><character set specification> ] <quote> [ <character representation>... ] <quote> [ { <separator> <quote> [ <character representation>... ] <quote> }... ]";
    let stk: B.Node[] = [];
    expect(p.accept(B.grammar.rules.declaration, s, stk)).to.eql(true);
    let exp =
      '[{"kind":"definition","name":"character string literal","body":{"kind":"conj","value":[{"kind":"opt","value":{"kind":"conj","value":[{"kind":"name","value":"introducer"},{"kind":"name","value":"character set specification"}]}},{"kind":"name","value":"quote"},{"kind":"opt","value":{"kind":"plus","value":{"kind":"name","value":"character representation"}}},{"kind":"name","value":"quote"},{"kind":"opt","value":{"kind":"plus","value":{"kind":"conj","value":[{"kind":"name","value":"separator"},{"kind":"name","value":"quote"},{"kind":"opt","value":{"kind":"plus","value":{"kind":"name","value":"character representation"}}},{"kind":"name","value":"quote"}]}}}]},"mode":"loose"}]';
    expect(JSON.stringify(stk)).to.eql(exp);
  });
  it("character string literal (2)", () => {
    const s =
      "<character string literal> ::=\n    [ <introducer><character set specification> ]\n    <quote> [ <character representation>... ] <quote>\n    [ { <separator> <quote> [ <character representation>... ] <quote> }... ]\n\n";
    let stk: B.Node[] = [];
    expect(p.accept(B.grammar.rules.declaration, s, stk)).to.eql(true);
    let exp =
      '[{"kind":"definition","name":"character string literal","body":{"kind":"conj","value":[{"kind":"opt","value":{"kind":"conj","value":[{"kind":"name","value":"introducer"},{"kind":"name","value":"character set specification"}]}},{"kind":"name","value":"quote"},{"kind":"opt","value":{"kind":"plus","value":{"kind":"name","value":"character representation"}}},{"kind":"name","value":"quote"},{"kind":"opt","value":{"kind":"plus","value":{"kind":"conj","value":[{"kind":"name","value":"separator"},{"kind":"name","value":"quote"},{"kind":"opt","value":{"kind":"plus","value":{"kind":"name","value":"character representation"}}},{"kind":"name","value":"quote"}]}}}]},"mode":"loose"}]';
    expect(JSON.stringify(stk)).to.eql(exp);
  });
});

type Deps = { [name: string]: string[] };
function scanDeps(name: string, exprn: B.Node, deps: Deps) {
  switch (exprn.kind) {
    case "name": {
      if (!(name in deps)) {
        deps[name] = [];
      }
      deps[name].push(exprn.value);
      return;
    }
    case "opt": {
      scanDeps(name, exprn.value, deps);
      return;
    }
    case "conj": {
      for (let kid of exprn.value) {
        scanDeps(name, kid, deps);
      }
      return;
    }
    case "disj": {
      for (let kid of exprn.value) {
        scanDeps(name, kid, deps);
      }
      return;
    }
  }
}

function transitiveDeps(name: string, deps: Deps, tx: Set<string>) {
  if (tx.has(name)) {
    return;
  }
  if (!(name in deps)) {
    return;
  }
  tx.add(name);
  for (let dep of deps[name]) {
    transitiveDeps(dep, deps, tx);
  }
}

function unique(xs: string[]) {
  let i = 1;
  for (let j = 1; j < xs.length; ++j) {
    if (xs[j] != xs[j - 1]) {
      if (i != j) {
        xs[i] = xs[j];
      }
      i += 1;
    }
  }
  xs.splice(i);
}

function error(msg: string): string {
  throw new Error(msg);
}

class tarjan {
  V: string[];
  E: { [key: string]: string[] };
  O: string[][];
  idx: number;
  stk: string[];
  stkIdx: Set<string>;
  VIdx: { [key: string]: number };
  VLow: { [key: string]: number };

  constructor(V: string[], E: { [key: string]: string[] }) {
    this.V = V;
    this.E = E;
    this.O = [];
    this.idx = 0;
    this.stk = [];
    this.stkIdx = new Set<string>();
    this.VIdx = {};
    this.VLow = {};

    for (let v of this.V) {
      if (!(v in this.VIdx)) {
        this.strongconnect(v);
      }
    }
  }

  strongconnect(v: string) {
    this.VIdx[v] = this.idx;
    this.VLow[v] = this.idx;
    this.idx += 1;
    this.stk.push(v);
    this.stkIdx.add(v);
    for (let w of this.E[v] || []) {
      if (!(w in this.VIdx)) {
        this.strongconnect(w);
        this.VLow[v] = Math.min(this.VLow[v], this.VLow[w]);
      } else if (this.stkIdx.has(w)) {
        this.VLow[v] = Math.min(this.VLow[v], this.VIdx[w]);
      }
    }

    if (this.VLow[v] == this.VIdx[v]) {
      let scc: string[] = [];
      while (this.stk.length > 0) {
        let w = this.stk.pop() || error("bad pop");
        this.stkIdx.delete(w);
        scc.push(w);
        if (v == w) {
          break;
        }
      }
      scc.sort();
      this.O.push(scc);
    }
  }
}

function generateExpression(exprn: B.Node, parts: string[], ctxt: string) {
  switch (exprn.kind) {
    case "literal": {
      if (ctxt == "star") {
        parts.push(exprn.value + "...");
        return;
      }
      parts.push(exprn.value);
      return;
    }
    case "name": {
      if (ctxt == "plus") {
        parts.push(`<${exprn.value}>...`);
        return;
      }
      parts.push(`<${exprn.value}>`);
      return;
    }
    case "disj": {
      if (ctxt == "conj") {
        parts.push("{");
        for (let i = 0; i < exprn.value.length; ++i) {
          if (i > 0) {
            parts.push("|");
          }
          generateExpression(exprn.value[i], parts, "disj");
        }
        parts.push("}");
        return;
      }
      if (ctxt == "star") {
        parts.push("{");
        for (let i = 0; i < exprn.value.length; ++i) {
          if (i > 0) {
            parts.push("|");
          }
          generateExpression(exprn.value[i], parts, "disj");
        }
        parts.push("}...");
        return;
      }
      for (let i = 0; i < exprn.value.length; ++i) {
        if (i > 0) {
          parts.push("|");
        }
        generateExpression(exprn.value[i], parts, "disj");
      }
      return;
    }
    case "conj": {
      for (let kid of exprn.value) {
        generateExpression(kid, parts, "conj");
      }
      return;
    }
    case "plus": {
      generateExpression(exprn.value, parts, "plus");
      return;
    }
    case "opt": {
      parts.push("[");
      generateExpression(exprn.value, parts, "opt");
      parts.push("]");
    }
  }
}

function generateRule(
  name: string,
  rules: { [name: string]: B.Node },
  lines: string[]
) {
  let body = rules[name];
  if (!body) {
    return;
  }
  let parts: string[] = [];
  parts.push(`<${name}> ::=`);
  generateExpression(body, parts, "top");
  lines.push(parts.join(" "));
}

it("parse all the regular productions from the SQL grammar", () => {
  const text = fs.readFileSync(
    path.join(__dirname, "data/sqlite.bnf"),
    "ascii"
  );
  const groups = text.split(/\r?\n\r?\n/);
  let p = new P.Parser(B.grammar);
  let defns: { [name: string]: B.Definition } = {};
  groups.forEach((txt, idx) => {
    let stk: B.Node[] = [];
    let res = p.accept(B.grammar.rules.declaration, txt, stk);
    if (!res || stk.length != 1) {
      console.log(txt);
      console.log(JSON.stringify(stk));
    }
    let node = stk[0];
    if (node.kind == "definition") {
      defns[node.name] = { body: node.body, mode: node.mode };
      return;
    }
  });
  let S = new B.Syntax(defns, 'whitespace');

  expect(JSON.stringify(S.missingRules())).to.eql('["any character except backslash or quote"]');

  console.log(JSON.stringify(S.sccs));

  let init : {[name: string]: P.Expression} = {};
  init["any character except backslash or quote"] = P.not_one("\\'");
  let rules = S.makeRules(init);
});
