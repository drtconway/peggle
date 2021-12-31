export class Random {
    J: number;
    j: number;
    state: Uint32Array;

    readonly c1: number = 0xcc9e2d51;
    readonly c2: number = 0x1b873593;
    readonly r1: number = 15;
    readonly r2: number = 13;
    readonly m: number = 5;
    readonly n: number = 0xe6546b64;

    constructor(seed: number) {
        this.J = 8;
        this.j = 0;
        this.state = new Uint32Array(this.J);
        for (let i = 0; i < this.J; ++i) {
            this.state[i] = seed + i;
        }
        for (let i = 0; i < 4*this.J; ++i) {
            this.hash();
        }
    }

    bits() : number {
        return this.hash();
    }

    random() : number {
        let k = this.hash();
        let x = 0;
        for (let i = 0; i < 31; ++i) {
            x += (k & 1);
            x = x / 2.0;
            k >>= 1;
        }
        return x;
    }

    between(lo: number, hi: number) : number {
        let r = hi - lo;
        let u = this.random();
        return Math.floor(lo + r * u);
    }

    choose<T>(items: T[]) : T {
        let i = this.between(0, items.length);
        return items[i];
    }
    
    shuffle<T>(items: T[]) : T[] {
        const N = items.length;
        for (let i = 0; i < N; ++i) {
            let j = this.between(0, N);
            if (i != j) {
                let t = items[i];
                items[i] = items[j];
                items[j] = t;
            }
        }
        return items;
    }

    private hash() {
        this.state[this.j] *= 0xcc9e2d51;
        this.state[this.j] = (this.state[this.j] << 15) | (this.state[this.j] >> 17);
        this.state[this.j] *= 0x1b873593;
        let k = this.state[this.j];
        this.j = (this.j + 1) % this.J;
        this.state[this.j] ^= k;
        this.state[this.j] ^= this.state[this.j] >> 16;
        this.state[this.j] *= 0x85ebca6b;
        this.state[this.j] ^= this.state[this.j] >> 13;
        this.state[this.j] *= 0xc2b2ae35;
        this.state[this.j] ^= this.state[this.j] >> 16;
        return this.state[this.j];
    }
}