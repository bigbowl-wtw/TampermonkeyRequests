/* eslint-disable @typescript-eslint/no-unused-vars */
type Url = string | URL;

type Method = 'GET' | 'POST';

interface ToStringable {
    toString: () => string;
}

interface Query {
    [key: string]: string | number | string[];
}

interface Body {
    [key: string]: any;
    toString(): string;
}

type PostData = string | FormData | Body;

interface Data {
    query?: Query;
    body?: Body;
}

interface Options<TContext = object> {
    /** a object to be append into the send url query parameters */
    query?: Query;
    /**
     * i.e. user-agent, referer... (some special headers are not supported
     * by Safari and Android browsers)
     */
    headers?: IRequestHeaders;
    /** a Object to send as JSON */
    json?: any;
    /** String to send via a POST request */
    data?: PostData;
    /** A cookie to be patched into the sent cookie set */
    cookie?: ICookieSet;
    /** Authorizes objcet  */
    auth?: IAuth;
    /** Send the data string in binary mode */
    binary?: boolean | undefined;
    /** Don't cache the resource */
    nocache?: boolean | undefined;
    /** Revalidate maybe cached content */
    revalidate?: boolean | undefined;
    /** Timeout in ms */
    timeout?: number | undefined;
    /** Property which will be added to the response object */
    context?: TContext | undefined;
    responseType?: 'arraybuffer' | 'blob' | 'json' | undefined;
    /** MIME type for the request */
    overrideMimeType?: string | undefined;
    /** Don't send cookies with the requests (please see the fetch notes) */
    anonymous?: boolean | undefined;
    /**
     * (Beta) Use a fetch instead of a xhr request(at Chrome this causes
     * `xhr.abort`, `details.timeout` and `xhr.onprogress` to not work and
     * makes `xhr.onreadystatechange` receive only readyState 4 events)
     */
    fetch?: boolean | undefined;
    /** Username for authentication */
    user?: string | undefined;
    password?: string | undefined;

    // Events

    /** Callback to be executed if the request was aborted */
    onabort?(): void;
    /** Callback to be executed if the request ended up with an error */
    onerror?:
        | Tampermonkey.RequestEventListener<Tampermonkey.ErrorResponse>
        | undefined;
    /** Callback to be executed if the request started to load */
    onloadstart?:
        | Tampermonkey.RequestEventListener<Tampermonkey.Response<TContext>>
        | undefined;
    /** Callback to be executed if the request made some progress */
    onprogress?:
        | Tampermonkey.RequestEventListener<
              Tampermonkey.ProgressResponse<TContext>
          >
        | undefined;
    /** Callback to be executed if the request's ready state changed */
    onreadystatechange?:
        | Tampermonkey.RequestEventListener<Tampermonkey.Response<TContext>>
        | undefined;
    /** Callback to be executed if the request failed due to a timeout */
    ontimeout?(): void;
    /** Callback to be executed if the request was loaded */
    onload?:
        | Tampermonkey.RequestEventListener<Tampermonkey.Response<TContext>>
        | undefined;
}

type IRequestHeaders = {
    [header: string]: string | string[];
} & {
    cookie?: ICookieSet;
};

type ICookieSet = {
    [name: string]: string;
};

interface IAuth {
    build: (header: IHeader) => void;
}

interface ICookieJar {
    cookie: ICookieSet;
    get empty(): boolean;
    update(cookie: ICookieJar): void;
    update(cookie: ICookieSet): void;
    update(cookie: string[]): void;
    updateFromString(cookieStringArray: string | string[]): void;
    setCookies(cookieStringArray: string[]): void;
    setCookies(cookie: ICookieSet): void;
    setCookies(cookie: ICookieJar): void;
    differenceUpdate(cookie: ICookieJar): void;
    differenceUpdate(cookie: ICookieSet): void;
    differenceUpdate(cookie: string[]): void;
    deleteFromString(cookieStringArray: string | string[]): void;
    parseCookieString(cookieStrings: string[]): ICookieSet;
    toString(): string;
}

type IHeader = {
    headers: {
        [header: string]: string | string[];
    };
    cookie: ICookieJar;
    setFromString(headers: string): ThisType<IHeader>;
    update(headers: IHeader): void;
    update(headers: IRequestHeaders): void;
    getHeaders(): Tampermonkey.RequestHeaders;
    append(name: string, value: string | string[]): void;
    get(name: string): string | string[];
};

type BuildHook = (
    this: ThisType<IDetails>,
    session: ISession
) => ThisType<IDetails>;

interface IDetails<TContext = object> {
    build(session: ISession): Promise<Tampermonkey.Request<TContext>>;
}

interface ISession {
    headers: IHeader;
    cookie: ICookieJar;

    auth?: IAuth;

    buildHooks: BuildHook[];
}
