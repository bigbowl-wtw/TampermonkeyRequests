/* eslint-disable no-empty-function */

/* eslint-disable no-inner-declarations */

/* eslint-disable @typescript-eslint/no-unused-vars */
import Session from './session';

export function get<TResolve = any, TContext = object>(
    url: Url,
    query?: Query,
    options?: Options<TContext>
) {
    return new Session().get<TResolve, TContext>(url, {
        query,
        ...options,
    });
}

export function post<TResolve = any, TContext = object>(
    url: Url,
    options?: Options<TContext>
) {
    return new Session().post<TResolve, TContext>(url, {
        ...options,
    });
}

export function session() {
    return new Session();
}

export { Session };
