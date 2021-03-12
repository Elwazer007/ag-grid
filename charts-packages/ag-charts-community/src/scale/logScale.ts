import ContinuousScale, { identity } from "./continuousScale";
import ticks from "../util/ticks";

export class LogScale extends ContinuousScale {
    _domain = [1, 10];

    baseLog = identity; // takes a log with base `base` of `x`
    basePow = identity; // raises `base` to the power of `x`

    protected setDomain(values: any[]) {
        const df = values[0];
        const dl = values[values.length - 1];

        if (df === 0 || dl === 0 || df < 0 && dl > 0 || df > 0 && dl < 0) {
            throw 'Log scale domain should not start at, end at or cross zero.';
        }

        super.setDomain(values);
    }
    protected getDomain(): any[] {
        return super.getDomain();
    }

    _base = 10;
    set base(value) {
        if (this._base !== value) {
            this._base = value;
            this.rescale();
        }
    }
    get base() {
        return this._base;
    }

    rescale() {
        let baseLog = this.makeLogFn(this.base);
        let basePow = this.makePowFn(this.base);

        if (this.domain[0] < 0) {
            baseLog = this.reflect(baseLog);
            basePow = this.reflect(basePow);
            this.transform = (x) => -Math.log(-x);
            this.untransform = (x) => -Math.exp(-x);
        } else {
            this.transform = (x) => Math.log(x);
            this.untransform = (x) => Math.exp(x);
        }

        this.baseLog = baseLog;
        this.basePow = basePow;

        super.rescale();
    }

    /**
     * For example, if `f` is `Math.log10`, we have
     *
     *     f(100) == 2
     *     f(-100) == NaN
     *     rf = reflect(f)
     *     rf(-100) == -2
     *
     * @param f
     */
    reflect(f: (x: number) => number): (x: number) => number {
        return (x: number) => -f(-x);
    }

    nice() {
        const domain = this.domain;
        let i0 = 0;
        let i1 = domain.length - 1;
        let x0 = domain[i0];
        let x1 = domain[i1];

        if (x1 < x0) {
            [i0, i1] = [i1, i0];
            [x0, x1] = [x1, x0];
        }

        // For example, for base == 10:
        // [ 50, 900] becomes [ 10, 1000 ]
        domain[i0] = this.basePow(Math.floor(this.baseLog(x0)));
        domain[i1] = this.basePow(Math.ceil(this.baseLog(x1)));

        this.domain = domain;
    }

    pow10(x: number): number {
        return isFinite(x)
            ? +('1e' + x) // to avoid precision issues, e.g. Math.pow(10, -4) is not 0.0001
            : x < 0
                ? 0
                : x;
    }

    makePowFn(base: number): (x: number) => number {
        if (base === 10) {
            return this.pow10;
        }
        if (base === Math.E) {
            return Math.exp;
        }
        return (x: number) => Math.pow(base, x);
    }

    makeLogFn(base: number) {
        if (base === Math.E) {
            return Math.log;
        }
        if (base === 10 && Math.log10) {
            return Math.log10;
        }
        if (base === 2 && Math.log2) {
            return Math.log2;
        }
        base = Math.log(base);
        return (x: number) => Math.log(x) / base;
    }

    ticks(count = 10) {
        const n = count == null ? 10 : +count;
        const base = this.base;
        const domain = this.domain;
        let d0 = domain[0];
        let d1 = domain[domain.length - 1];
        const isReversed = d1 < d0;

        if (isReversed) {
            [d0, d1] = [d1, d0];
        }

        let p0 = this.baseLog(d0);
        let p1 = this.baseLog(d1);
        let z = [];

        // if `base` is an integer and delta in order of magnitudes is less than n
        if (!(base % 1) && p1 - p0 < n) {
            // For example, if n == 10, base == 10 and domain == [10^2, 10^6]
            // then p1 - p0 < n == true.
            p0 = Math.round(p0) - 1;
            p1 = Math.round(p1) + 1;
            if (d0 > 0) {
                for (; p0 < p1; ++p0) {
                    for (let k = 1, p = this.basePow(p0); k < base; ++k) {
                        let t = p * k;
                        // The `t` checks are needed because we expanded the [p0, p1] by 1 in each direction.
                        if (t < d0)
                            continue;
                        if (t > d1)
                            break;
                        z.push(t);
                    }
                }
            } else {
                for (; p0 < p1; ++p0) {
                    for (let k = base - 1, p = this.basePow(p0); k >= 1; --k) {
                        let t = p * k;
                        if (t < d0)
                            continue;
                        if (t > d1)
                            break;
                        z.push(t);
                    }
                }
            }
            if (z.length * 2 < n) {
                z = ticks(d0, d1, n);
            }
        } else {
            // For example, if n == 4, base == 10 and domain == [10^2, 10^6]
            // then p1 - p0 < n == false.
            // `ticks` return [2, 3, 4, 5, 6], then mapped to [10^2, 10^3, 10^4, 10^5, 10^6].
            z = ticks(p0, p1, Math.min(p1 - p0, n)).map(this.basePow);
        }

        return isReversed ? z.reverse() : z;
    }

    tickFormat(count: any, specifier?: (x: number) => string): (x: number) => string {
        const { base } = this;

        if (specifier == null) {
            specifier = (base === 10 ? '.0e' : ',') as any;
        }

        if (typeof specifier !== 'function') {
            specifier = (x: number) => String(x); // TODO: implement number formatting
        }

        if (count === Infinity) {
            return specifier;
        }

        if (count == null) {
            count = 10;
        }

        const k = Math.max(1, base * count / this.ticks().length);

        return function (d) {
            var i = d / this.makePowFn(Math.round(this.makeLogFn(d)));
            if (i * base < base - 0.5) {
                i *= base;
            }
            return i <= k ? specifier!(d) : '';
        };
    }
}
