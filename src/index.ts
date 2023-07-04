/* eslint-disable no-empty-function */

/* eslint-disable no-inner-declarations */

/* eslint-disable @typescript-eslint/no-unused-vars */
import Session from './session';
import type { Url, Query, Options } from './types';

const requests = {
    get<TResolve = any, TContext = object>(
        url: Url,
        query?: Query,
        options?: Options<TContext>
    ) {
        return new Session().get<TResolve, TContext>(url, {
            query,
            ...options,
        });
    },

    post<TResolve = any, TContext = object>(
        url: Url,
        options?: Options<TContext>
    ) {
        return new Session().post<TResolve, TContext>(url, {
            ...options,
        });
    },

    session() {
        return new Session();
    },
};

export default requests;

export { Session };
