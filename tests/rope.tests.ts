import { Rope } from '../src/rope';

import * as mocha from 'mocha';
import * as chai from 'chai';
const expect = chai.expect;

describe("simple rope tests", () => {
    it("atom", () => {
        let a = Rope.atom('qux');
        expect(a.length).to.eql(3);
        expect(a.peek(1)).to.eql('u');
        expect(a.toString()).to.eql("qux");
    });
    it("cat", () => {
        let a = Rope.atom('baz');
        let b = Rope.atom('qux');
        let c = Rope.cat(a, b);
        expect(c.length).to.eql(6);
        expect(c.peek(1)).to.eql('a');
        expect(c.peek(4)).to.eql('u');
        expect(c.toString()).to.eql('bazqux');
    });
    it("slice", () => {
        let a = Rope.atom('bazqux');
        let b = a.slice(2, 5);
        expect(b.length).to.eql(3);
        expect(b.peek(1)).to.eql('q');
        expect(b.toString()).to.eql('zqu');
    });
    it("compound", () => {
        let a = Rope.atom('baz');
        let b = Rope.atom('qux');
        let c = Rope.cat(a, b);
        let d0 = c.slice(0, 2);
        expect(d0.toString()).to.eql('ba');
        let d1 = c.slice(2, 5);
        expect(d1.toString()).to.eql('zqu');
        let d2 = c.slice(4, 6);
        expect(d2.toString()).to.eql('ux');
    });
});