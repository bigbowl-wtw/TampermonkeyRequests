/* eslint-disable no-plusplus */
/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */

export function assign<T extends {}>(target: T, ...rest: any[]): T {
    const __assign =
        Object.assign ||
        function (t, ...others) {
            for (let s, i = 0, n = others.length; i < n; i++) {
                s = others[i];
                for (const p in s)
                    if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
    return __assign.call(this, target, ...rest);
}

export function assignDeepCopy<T>(target: T, ...rest: T[]): T {
    // for methods in sources
    rest = rest.filter(r => r !== undefined);
    assign(target, ...rest);
    return assign.call(this, target, ...JSON.parse(JSON.stringify(rest)));
}

export function bodyToString(data: any) {
    if (Object.values(data).some(v => typeof v.toString !== 'function'))
        throw new TypeError('value must has `.toString`');
    return Object.entries(data)
        .map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`)
        .join('&');
}
