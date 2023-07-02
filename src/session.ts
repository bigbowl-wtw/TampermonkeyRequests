import { ErrorStatus } from './errorStatus';
import { Header } from './header';
import { bodyToString } from './utils';

type Keys = 'query' | 'json' | 'data' | 'cookie' | 'auth' | 'headers';

class Details<TContext = object> implements IDetails<TContext> {
    url: Url;
    method: Method;
    query?: Query;
    json?: any;
    data?: PostData;
    cookie?: ICookieSet;
    auth?: IAuth;
    headers?: IRequestHeaders;
    others: Omit<Options<TContext>, Keys>;

    private finalHeader?: IHeader;
    private finalData?: string | FormData;

    private pendings: (any | Promise<any>)[];

    constructor(url: Url, method: Method, options?: Options<TContext>) {
        this.url = url;
        this.method = method;
        this.finalHeader = new Header();
        if (options) {
            // eslint-disable-next-line prettier/prettier
            const {
                query,
                json,
                data,
                cookie,
                auth,
                headers,
                ...others
                // eslint-disable-next-line prettier/prettier
            } = options;

            this.query = query;
            this.json = json;
            this.data = data;
            this.cookie = cookie;
            this.auth = auth;
            this.headers = headers;
            this.others = others;
        }
    }

    async build(session: Session): Promise<Tampermonkey.Request<TContext>> {
        // 在 toDetails 中调用 .buildBody，以等待 bulidHooks 完成
        // eslint-disable-next-line prettier/prettier
        this.buildURL()
            .buildHeaderAndCookie(session)
            .buildAuth(session)
        this.pendings.concat(
            session.buildHooks.map(hook => hook.call(this, session))
        );
        return this.toDetails();
    }

    buildURL(): this {
        this.parseQuery(this.query);
        return this;
    }

    /**
     * 处理请求 header（包括 cookie）
     *
     * 优先级：this.header > Session.header
     *
     * Cookie 优先级：this.header.cookie > this.cookie > session.cookie（与 GM_xhr 保持一致）
     */
    buildHeaderAndCookie(session: Session): this {
        const finalCookie = this.finalHeader.cookie;
        // 处理 cookie
        if (session.cookies) finalCookie.update(session.cookies);
        if (this.cookie) finalCookie.update(this.cookie);
        // 处理 header
        this.finalHeader.update(session.headers);
        // 包含了 this.header.cookie
        if (this.headers) this.finalHeader.update(this.headers);

        return this;
    }

    buildAuth(session: Session): this {
        this.pendings.push(session.auth?.build(this.finalHeader));
        return this;
    }

    buildBody(): this {
        if (this.json) {
            const contentType = 'application/json';
            this.headers['Content-Type'] = contentType;
            const data = JSON.stringify(this.json);
            this.finalData = data;
            return this;
        }
        if (this.data) {
            if (this.data instanceof FormData) return this;
            const contentType = 'application/x-www-form-urlencoded';
            this.headers['Content-Type'] = contentType;
            this.finalData = bodyToString(this.data);
            return this;
        }
        return this;
    }

    async toDetails(): Promise<Tampermonkey.Request<TContext>> {
        await Promise.all(this.pendings);

        const url = this.url.toString();
        this.buildBody();

        const details: Tampermonkey.Request<TContext> = {
            url,
            method: this.method,
            headers: this.finalHeader.getHeaders(),
            ...this.others,
        };

        // @ts-ignore details.data can be FormData
        if (this.finalData) details.data = this.finalData;

        return details;
    }

    parseQuery(query: Query | undefined) {
        let url: URL;
        if (typeof this.url === 'string') url = new URL(this.url);
        else url = this.url;
        if (query)
            Object.entries(query)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .filter(([_, v]) => typeof v === 'string')
                .forEach(([k, v]) => url.searchParams.append(k, v.toString()));
        this.url = url;
    }
}

export default class Session implements ISession {
    headers: IHeader;
    cookies: ICookieJar;

    auth?: IAuth;

    /** hook functions of build request details */
    buildHooks: BuildHook[] = [];

    constructor() {
        // define this.headers
        const headers = new Header();
        Object.defineProperty(this, 'headers', {
            get: () => headers,
            set(value: ICookieSet) {
                headers.cookie.setCookies(value);
            },
        });

        // define this.cookies
        Object.defineProperty(this, 'cookies', {
            get: () => this.headers.cookie,
            set(value: ICookieSet) {
                this.headers.cookie.setCookies(value);
            },
        });
    }

    async get<TResolve = any, TContext = object>(
        url: Url,
        options?: Options<TContext>
    ) {
        return this.request<TResolve, TContext>('GET', url, options);
    }

    async post<TResolve = any, TContext = object>(
        url: Url,
        options?: Options<TContext>
    ) {
        return this.request<TResolve, TContext>('POST', url, options);
    }

    async request<TResolve, TContext>(
        method: Method,
        url: Url,
        options?: Options<TContext>
    ) {
        const details = new Details<TContext>(url, method, options);
        return new Promise<TResolve>((resolve, reject) => {
            if (!options.onload) {
                details.others.onload = resp => {
                    // update cookie from response
                    if (!this.cookies.empty) {
                        const respHeaders = new Header().setFromString(
                            resp.responseHeaders
                        );
                        this.cookies.deleteFromString(
                            respHeaders['set-cookie']
                        );
                    }

                    if (resp.status === 200 && resp.status in ErrorStatus)
                        resolve(options?.responseType ? resp.response : resp);
                    else reject(resp);
                };
            }
            if (!options.onerror) details.others.onerror = resp => reject(resp);

            details.build(this).then(dtl => GM_xmlhttpRequest(dtl));
        });
    }

    registerBuildHook(hook: BuildHook) {
        this.buildHooks.push(hook);
    }
}