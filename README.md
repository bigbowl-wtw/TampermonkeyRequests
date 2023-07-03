# Tampermonkey Requests

[中文](./README.zh_CN.md)

Tampermonkey Requests is a JavaScript library that provides a simplified interface for making HTTP requests from Tampermonkey scripts. It is inspired by the popular Python library, [requests](https://requests.readthedocs.io/en/latest/), and aims to make sending requests from Tampermonkey scripts easier and more intuitive.

## How to Import
The package name is `gm-requests`:)

### Using `@require` tag in a script

```javascript
// ==UserScript==
// @name         My Tampermonkey Script
// @description  Example script using the library
// @require      https://greasyfork.org/scripts/470000/code/GM%20Requests.js
// ==/UserScript==

requests.get('https://github.com');

```

If you want to reference a specific version, you can find the exact value of the corresponding version [here](https://greasyfork.org/zh-CN/scripts/470000-gm-requests/versions).

### Using `import` in local code

First, install GM Requests:

```base
npm install https://github.com/bigbowl-wtw/TampermonkeyRequests.git
```

Import in your code:

```javascript
import requests from 'gm-requests';

requests.get('https://github.com');
```

## Usage

### `requests.get`

```typescript
let ret = await requests.get(
    'https://httpbin.org/get',
    { foo: 'bar' },
    { responseType: 'json' }
);
```

#### Function signature:

```typescript
requests.get<TResolve = any, TContext = object>(
    url: string | URL,
    query?: Query,
    options?: Options<TContext>
): Promise<TResolve>
```

`url`: The URL of the request.

`query`: Query parameters to be sent.

`options`: Parameters passed to [`GM_xmlHttpRequest`](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_xmlhttpRequest), excluding `url`, `method`, `headers`, and `cookie`.

### `requests.post`

```typescript
let ret = await requests.post(
    'https://httpbin.org/post',
    {
        data: { foo: 'bar' },
        responseType: 'json'
    }
);
```

#### Function signature:

```typescript
requests.post<TResolve = any, TContext = object>(
    url: string | URL,
    options?: Options<TContext>
): Promise<TResolve>
```

`url`: The URL of the request.

`options`:
- `json?: any`: An object that can be converted to a JSON string.
- `data: { [key: string]: string }`: Data sent with `'application/x-www-form-urlencoded'` encoding.
- Other parameters that can be passed to [`GM_xmlHttpRequest`](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_xmlhttpRequest), excluding `url`, `method`, `headers`, and `cookie`.

`json` and `data` only have an effect in `post` requests.

### How to Use Headers and Cookie

Similar to requests, `requests.get` and `requests.post` can send requests with specified `headers` or `cookie` by including them in the `options`.

Note: Unlike the interface of requests, in all passed `options` and internal interfaces, the `headers` parameter is used to represent headers, and `cookie` is used to represent cookies (including `headers.cookie`). This is to prevent users accustomed to `GM_xmlHttpRequest` from encountering issues where the passed `cookie` parameter doesn't work. if the cookie parameter is defined as `cookies` to match requests, such errors would occur.

#### 1. `cookie`:

```typescript
requests.get('https://httpbin/get', { cookie: { foo: 'bar' } });
```

The above usage will generate the following cookie:

```text/plain
Cookie: foo=bar;
```

`cookie` is an object with string values, where the keys are the cookie names and the values are the cookie values:

```typescript
type ICookieSet = {
    [name: string]: string;
};

cookie: ICookieSet
```

The same cookie cannot have multiple values.

All cookies set via `cookie` will be appended after the cookies managed by the browser, as determined by [`GM_xmlHttpRequest`](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_xmlhttpRequest).

#### 2. `headers`:

```typescript
requests.get('https://httpbin/get', { headers: { foo: 'bar' } });
```

The above usage will generate the following header:

```text/plain
foo: bar
```

`headers` is an object with string or string[] values, where the keys are the header names and the values are the header values. When the value is a string[], it represents multiple values for the header, and they will be separated by commas when sending the request:

```typescript
headers: {
    [header: string]: string | string[];
} & {
    cookie?: {
        [name: string]: string;
    };
}
```

#### 3. Priority of `headers.cookie` and `cookie`

According to the behavior of [`GM_xmlHttpRequest`](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_xmlhttpRequest), the priority is `headers.cookie` `>` `cookie`, and this library follows the same behavior.

## Using `Session`
`Session` is currently not fully implemented, please use it with caution.

For the current implementation, it is recommended to use different `Session` instances for requests to different domains. Avoid using an instance from domain A to make requests to domain B, as this may result in errors such as sending incorrect headers and cookies.

Similar to requests, `Session` is used to maintain custom cookies across requests. However, cookies set in the server response via the `Set-Cookie` header will be managed by the browser, and `Session` will not handle them. It will mark and delete them, and if the same named cookie is passed again in future requests, `Session` will ignore them.

`Session.cookie` and `Session.headers.cookie` mimic the behavior of the corresponding interfaces in requests. You can assign them values using an object or update them using `.update`.

```typescript
let session = new requests.Session();

session.headers = { foo: 'bar' };
// header will be overwritten as { foo: 'com.github.bigbowl-wtw/gm-requests' }
session.headers.update({ foo: 'com.github.bigbowl-wtw/gm-requests' });
// header will be updated to { foo: [ 'com.github.bigbowl-wtw/gm-requests', 'bar' ]}
session.headers.append('foo', 'bar');

session.cookie = { test: 'A' };
// cookie will be updated to { test: 'B' }
session.cookie.update({ test: 'B' });
```

When a header containing a cookie is passed, `Session.cookie` and `Session.headers.cookie` will be updated together. In fact, `Session.cookie` is a reference to `Session.headers.cookie`.

### `.update`
Both the `headers` and `cookie` objects have an `.update` method, which updates the internal data with the provided values. Existing values will be overwritten by the new values.

### `headers.append(header: string, value: string | string[])`
Since HTTP headers allow multiple values for the same key, `headers` provides the `append` method to add new values to a single header.  If the passed header is a cookie, the cookie will be updated accordingly.

### `requests.session`

`requests.session` returns a `Session` instance (equivalent to requests).

```typescript
let session: requests.Session = requests.session();
```
