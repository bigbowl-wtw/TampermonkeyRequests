/* eslint-disable no-empty-function */

/* eslint-disable no-inner-declarations */

/* eslint-disable @typescript-eslint/no-unused-vars */
import Session from './session';
import type { Url, Query, Options } from './types';

export function get<TResolve = undefined, TContext = object>(
    url: Url,
    query?: Query,
    options?: Options<TContext>
) {
    return new Session<TContext>().get<TResolve>(url, {
        query,
        ...options,
    });
}

export function post<TResolve = undefined, TContext = object>(
    url: Url,
    options?: Options<TContext>
) {
    return new Session<TContext>().post<TResolve>(url, {
        ...options,
    });
}

export function session<TContext = object>() {
    return new Session<TContext>();
}

export { Session };

export default {
    get,
    post,
    session,
};
