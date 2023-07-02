import { SimpleCookieJar } from './cookie-jar';
import { assign } from './utils';

export class Header implements IHeader {
    headers: {
        [header: string]: string | string[];
    };

    cookie: ICookieJar;

    constructor(headers?: IRequestHeaders) {
        this.cookie = new SimpleCookieJar();
        if (!headers) return;
        const { cookie, ...others } = headers;
        this.headers = others;
        if (cookie) {
            this.cookie.update(cookie);
        }
    }

    setFromString(headerString: string): this {
        const entrise = headerString
            .split('\r\n')
            .map(kv => kv.split(':'))
            .map(([k, v]) => [k.toLowerCase(), v.trim()]);
        for (const [name, value] of entrise) {
            const header = this.headers[name];
            if (header) {
                if (typeof header === 'string') this.headers[name] = [header];
                (this.headers[name] as string[]).push(value);
            } else {
                this.headers[name] = value;
            }
        }
        return this;
    }

    update(headers: IHeader): void;
    update(headers: IRequestHeaders): void;
    update(headers: IRequestHeaders | IHeader): void {
        const { cookie, ...others } = headers;
        assign(this.headers, others);
        if (cookie) {
            this.cookie.update(cookie as any);
        }
    }

    getHeaders(): Tampermonkey.RequestHeaders {
        if (!Object.keys(this.headers).length) {
            if (this.cookie.empty) return {};
            return { cookie: this.cookie.toString() };
        }
        const headers: { [header: string]: string } = {};
        for (const [name, value] of Object.entries(this.headers))
            headers[name] = value.toString();
        return {
            ...headers,
            cookie: this.cookie.toString(),
        };
    }

    append(header: string, value: string | string[]): void {
        if (header === 'cookie') this.cookie.update([header]);
        else if (!this[header]) this[header] = value;
        else if (!Array.isArray(header))
            this[header] = [value].concat(this[header]);
        else this[header].concat(value);
    }

    get(name: string): string | string[] | undefined {
        return this.headers[name];
    }
}
