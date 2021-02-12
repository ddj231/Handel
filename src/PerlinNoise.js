// implementation from grinde 
export class Perlin {
    constructor() {
        // Quick and dirty permutation table
        this.perm = (() => {
            const tmp = Array.from({length: 256}, () => Math.floor(Math.random() * 256));
            return tmp.concat(tmp);
        })();
    }

    grad(i, x) {
        const h = i & 0xf;
        const grad = 1 + (h & 7);

        if ((h & 8) !== 0) {
            return -grad * x;
        }

        return grad * x;
    }

    getValue(x) {
        const i0 = Math.floor(x);
        const i1 = i0 + 1;

        const x0 = x - i0;
        const x1 = x0 - 1;

        let t0 = 1 - x0 * x0;
        t0 *= t0;

        let t1 = 1 - x1 * x1;
        t1 *= t1;

        const n0 = t0 * t0 * this.grad(this.perm[i0 & 0xff], x0);
        const n1 = t1 * t1 * this.grad(this.perm[i1 & 0xff], x1);

        return 0.395 * (n0 + n1); //Output is between -1 and 1.
    }
}