import { Random } from "../src/random";

import * as mocha from "mocha";
import * as chai from "chai";
import { defaultMaxListeners } from "events";
import { expect } from "chai";

describe("uniform randoms between 0 and 1", () => {
    it("check uniformity of bits seed=20", () => {
        let N = 1000;
        let J = 31;
        let bins = new Uint32Array(J);
        let R = new Random(20);
        for (let i = 0; i < N; ++i) {
            let u = R.bits();
            for (let j = 0; j < J; ++j) {
                bins[j] += u & 1;
                u >>= 1;
            }
        }
        let E = N / 2;
        let chi2 = 0;
        for (let j = 0; j < J; ++j) {
            chi2 += (bins[j] - E)**2 / E;
        }
        let P = 18.49266; // @ 0.05
        expect(chi2).to.be.lessThan(P);
    });
    it("check uniformity of bits seed=21", () => {
        let N = 1000;
        let J = 31;
        let bins = new Uint32Array(J);
        let R = new Random(21);
        for (let i = 0; i < N; ++i) {
            let u = R.bits();
            for (let j = 0; j < J; ++j) {
                bins[j] += u & 1;
                u >>= 1;
            }
        }
        let E = N / 2;
        let chi2 = 0;
        for (let j = 0; j < J; ++j) {
            chi2 += (bins[j] - E)**2 / E;
        }
        let P = 18.49266; // @ 0.05
        expect(chi2).to.be.lessThan(P);
    });
    it("uniformity of reals, seed=19", () => {
        let N = 100;
        let xs : number[] = [];
        let R = new Random(19);
        for (let i = 0; i < N; ++i) {
            let x = R.random();
            expect(x).to.be.greaterThanOrEqual(0);
            expect(x).to.be.lessThanOrEqual(1);
            xs.push(x);
        }
        xs.sort();
        let D = 0;
        for (let i = 0; i < N; ++i) {
            let d = Math.abs(xs[i] - i/N);
            D = Math.max(D, d);
        }
        let K = 1.36/Math.sqrt(N);
        expect(D).to.be.lessThan(K);
    });
    it("shuffling, seed=18", () => {
        let N = 1000;
        let xs = [];
        let R = new Random(18);
        for (let i = 0; i < N; ++i) {
            xs.push(R.random());
        }
        xs.sort();
        let ys = [...xs];
        R.shuffle<number>(ys);
        let sx = 0;
        let sx2 = 0;
        let sy = 0;
        let sy2 = 0;
        let sxy = 0;
        for (let i = 0; i < N; ++i) {
            sx += xs[i];
            sx2 += xs[i]**2;
            sy += ys[i];
            sy2 += ys[i]**2;
            sxy += xs[i]*ys[i];
        }
        let r = (N*sxy - sx*sy) / (Math.sqrt(N*sx2 - sx**2)*Math.sqrt(N*sy2 - sy**2));
        expect(r).to.be.lessThan(0.1);
    });
});