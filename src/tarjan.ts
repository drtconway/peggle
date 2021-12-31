/* istanbul ignore next */
function error(msg: string) : string {
    throw new Error(msg);
}

export class Tarjan {
    V: string[];
    E: {[key: string]: string[]};
    O: string[][];
    idx: number;
    stk: string[];
    stkIdx: Set<string>;
    VIdx: {[key: string]: number};
    VLow: {[key: string]: number};

    constructor(V: string[], E: {[key: string]: string[]}) {
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
        for (let w of (this.E[v] || [])) {
            if (!(w in this.VIdx)) {
                this.strongconnect(w);
                this.VLow[v] = Math.min(this.VLow[v], this.VLow[w]);
            }
            else if (this.stkIdx.has(w)) {
                this.VLow[v] = Math.min(this.VLow[v], this.VIdx[w]);
            }
        }

        if (this.VLow[v] == this.VIdx[v]) {
            let scc : string[] = [];
            while (true) {
                let w = this.stk.pop() || error('bad pop');
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