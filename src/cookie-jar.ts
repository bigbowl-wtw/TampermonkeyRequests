import { ICookieJar, ICookieSet } from './types';
import { assign } from './utils';

type CookieTuple = [string, string];

export class SimpleCookieJar implements ICookieJar {
    get empty(): boolean {
        return !Object.keys(this.cookie).length;
    }

    cookie: ICookieSet;
    private never: Set<string> = new Set();

    constructor(cookies?: ICookieSet | ICookieJar) {
        this.setCookies((cookies as any) ?? {});
    }

    update(cookies: ICookieSet): void;
    update(cookies: string[]): void;
    update(cookies: ICookieJar): void;
    update(cookies: ICookieSet | string[] | ICookieJar): void {
        assign(this.cookie, this.normalizeCookie(cookies));
    }

    updateFromString(cookieStringArray: string | string[]) {
        if (typeof cookieStringArray === 'string')
            cookieStringArray = [cookieStringArray];
        this.update(cookieStringArray);
    }

    differenceUpdate(cookies: ICookieSet): void;
    differenceUpdate(cookies: ICookieJar): void;
    differenceUpdate(cookies: string[]): void;
    differenceUpdate(cookies: string[] | ICookieSet | ICookieJar) {
        let cookieEntries: CookieTuple[];
        if (Array.isArray(cookies))
            cookieEntries = cookies.map(this.stringToEntry);
        else
            cookieEntries = Object.entries(
                isCookieJar(cookies) ? cookies.cookie : cookies
            );
        const set = new Set(Object.keys(this.cookie));
        cookieEntries = cookieEntries.filter(([name]) => !set.has(name));
        this.update(Object.fromEntries(cookieEntries));
    }

    /**
     * 浏览器会自动管理来自服务器的 cookie，因此将这些 cookie 删去，并记录
     * 在以后的请求中都不再添加相关 cookie
     */
    deleteFromString(cookieStringArray: string | string[]) {
        if (typeof cookieStringArray === 'string')
            cookieStringArray = [cookieStringArray];
        const names = cookieStringArray
            .map(this.stringToEntry)
            .map(([name]) => name);

        names.forEach(name => {
            this.never.add(name);
            delete this.cookie[name];
        });
    }

    /**
     * GM_xhr 中 headers.cookie 优先级更高，因此将所有 cookie 合并到 header 中
     */
    // build(options: Options) {
    //     /* 优先级：options > Session */
    //     const cookies = assign({}, this.cookies, options.cookie);
    //     Object.defineProperty(cookies, 'toString', {
    //         value(this: ICookieSet) {
    //             return Object.entries(this)
    //                 .map(([name, value]) => `${name}=${value}`)
    //                 .join(';');
    //         },
    //     });
    //     if (!options.headers) {
    //         options.headers = {};
    //     }
    //     options.headers.cookie = cookies;
    //     delete options.cookie;
    // }

    setCookies(cookieStringArray: string[]): void;
    setCookies(cookies: ICookieSet): void;
    setCookies(cookies: ICookieJar): void;
    setCookies(cookies: string[] | ICookieSet | ICookieJar) {
        this.cookie = new Proxy(this.normalizeCookie(cookies), {
            set: (target, name: string, value: string) => {
                if (this.never.has(name)) return true;
                target[name] = value;
                return true;
            },
        });
    }

    toString(): string {
        return Object.entries(this.cookie)
            .map(([k, v]) => `${k}=${v}`)
            .join(';');
    }

    parseCookieString(cookieStrings: string[]): ICookieSet {
        return Object.fromEntries(cookieStrings.map(this.stringToEntry));
    }

    private normalizeCookie(
        cookies: ICookieSet | string[] | ICookieJar
    ): ICookieSet {
        if (Array.isArray(cookies)) return this.parseCookieString(cookies);
        if (isCookieJar(cookies)) return cookies.cookie;
        return cookies;
    }

    // eslint-disable-next-line class-methods-use-this
    private stringToEntry(cookieString: string): CookieTuple {
        return cookieString
            .slice(0, cookieString.indexOf(';'))
            .split('=') as CookieTuple;
    }
}

function isCookieJar(obj: any): obj is ICookieJar {
    return typeof obj.update === 'function';
}
