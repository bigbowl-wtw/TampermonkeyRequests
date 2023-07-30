import { ErrorStatus } from './errorStatus';
import { Header } from './header';
import type {
    IDetails,
    Url,
    Method,
    Query,
    PostData,
    ICookieSet,
    IAuth,
    IRequestHeaders,
    Options,
    IHeader,
    ISession,
    ICookieJar,
    BuildHook,
} from './types';
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

    private pendings: (any | Promise<any>)[] = [];

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

    async build(session: ISession): Promise<Tampermonkey.Request<TContext>> {
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
    buildHeaderAndCookie(session: ISession): this {
        const finalCookie = this.finalHeader.cookie;
        // 处理 cookie
        if (!session.cookie.empty) finalCookie.update(session.cookie);
        if (this.cookie) finalCookie.update(this.cookie);
        // 处理 header
        this.finalHeader.update(session.headers);
        // 包含了 this.header.cookie
        if (this.headers) this.finalHeader.update(this.headers);

        return this;
    }

    buildAuth(session: ISession): this {
        this.pendings.push(session.auth?.build(this.finalHeader));
        this.pendings.push(this.auth?.build(this.finalHeader));
        return this;
    }

    buildBody(): this {
        if (this.json) {
            const contentType = 'application/json';
            this.finalHeader.update({ 'Content-Type': contentType });
            const data = JSON.stringify(this.json);
            this.finalData = data;
            return this;
        }
        if (this.data) {
            if (typeof this.data === 'string') {
                this.finalData = this.data;
                return this;
            }
            if (this.data instanceof FormData) return this;
            const contentType = 'application/x-www-form-urlencoded';
            this.finalHeader.update({ 'Content-Type': contentType });
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

export default class Session<TContext = object> implements ISession {
    headers: IHeader;
    cookie: ICookieJar;

    auth?: IAuth;

    /** hook functions of build request details */
    buildHooks: BuildHook[] = [];

    constructor() {
        // define this.headers
        const headers = new Header();
        Object.defineProperty(this, 'headers', {
            get: () => headers,
            set(value: ICookieSet) {
                headers.update(value);
            },
        });

        // define this.cookie
        Object.defineProperty(this, 'cookie', {
            get: () => headers.cookie,
            set(value: ICookieSet) {
                headers.cookie.setCookies(value);
            },
        });
    }

    async get<TResolve = undefined>(url: Url, options?: Options<TContext>) {
        return this.request<TResolve>('GET', url, options);
    }

    async post<TResolve = undefined>(url: Url, options?: Options<TContext>) {
        return this.request<TResolve>('POST', url, options);
    }

    async request<TResolve>(
        method: Method,
        url: Url,
        options?: Options<TContext>
    ) {
        const details = new Details<TContext>(url, method, options);
        return new Promise<Response<TResolve, TContext>>((resolve, reject) => {
            if (!options.onload) {
                details.others.onload = resp => {
                    // update cookie from response
                    if (!this.cookie.empty) {
                        const respHeaders = new Header().setFromString(
                            resp.responseHeaders
                        );
                        this.cookie.deleteFromString(respHeaders['set-cookie']);
                    }

                    if (resp.status === 200 && !(resp.status in ErrorStatus))
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

type Response<TResolve, TContext> = TResolve extends undefined
    ? Tampermonkey.Response<TContext>
    : TResolve;
