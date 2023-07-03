# Tampermonkey Requests

[English](./README.zh_CN.md)

Tampermonkey Requests 库为从 Tampermonkey 脚本中发出 HTTP 请求提供了简化的接口。它受到了流行的 Python 库 [requests](https://requests.readthedocs.io/en/latest/) 的启发，旨在使从 Tampermonkey 脚本发送请求变得更加简单和直观。

## 如何引入
注意：包名为 `gm-requests`。

### 在脚本中使用 `@require` 标签
```javascript
// ==UserScript==
// @name         My Tampermonkey Script
// @description  Example script using the library
// @require      https://greasyfork.org/scripts/470000/code/GM%20Requests.js
// ==/UserScript==

requests.get('https://github.com')

```

如果想引用某个固定版本，可以在 [这里](https://greasyfork.org/zh-CN/scripts/470000-gm-requests/versions) 找到对应版本的确切值。

### 在本地代码中使用 `import`
首先安装 GM Requests：
```base
npm install https://github.com/bigbowl-wtw/TampermonkeyRequests.git
```
在代码中导入：
```javascript
import requests from 'gm-requests'

requests.get('https://github.com')
```

## 用法
### `requests.get`
```typescript
let ret = await requests.get(
    'https://httpbin.org/get',
    { foo: 'bar' },
    { responseType: 'json' }
);
```

#### 函数签名：
```typescript
requests.get<TResolve = any, TContext = object>(
    url: string | URL,
    query?: Query,
    options?: Options<TContext>
): Promise<TResolve>
```

`url`：请求的 url。

`query`：要发出的查询参数。

`options`：透传到 [`GM_xmlHttpRequest`](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_xmlhttpRequest) 的参数，但不包括 `url`、`method`、`headers`、`cookie`。

### `requests.post`
```typescript
let ret = await requests.post(
    'https://httpbin.org/post',
    {
        data: { foo: 'bar' }
        responseType: 'json'
    }
);
```
#### 函数签名：
```typescript
requests.post<TResolve = any, TContext = object>(
    url: string | URL,
    options?: Options<TContext>
): Promise<TResolve>
```

`url`：请求的 url。

`options`：
- `json?: any`：任何可以被转换为 JSON 字符串的对象
- `data: { [key: string]: string }`：以 `'application/x-www-form-urlencoded'` 发出的数据，值将使用 urlencoded 编码。
- 其他可以透传到 [`GM_xmlHttpRequest`](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_xmlhttpRequest) 的参数，但不包括 `url`、`method`、`headers`、`cookie`。

`json` 和 `data` 只在 `post` 中才其作用。

### 如何使用 headers 和 cookie
与 requests 相似，`requests.get`、`requests.post` 可以通过在 `options` 中指定 `headers` 或 `cookie` 而发出带这些参数的请求。

注意：与 requests 的接口不同，所有传入的 `options` 和内部接口中均使用 `headers` 代表标头，使用 `cookie` 代表 cookie（包括 `headers.cookie`）。这是为了防止习惯 `GM_xmlHttpRequest` 的使用者传入 `cookie` 时不起作用。如果为了与 requests 相同，传入 cookie 的接口定为 `cookies`，就会发生这样的错误。

#### 1. `cookie`：
```typescript
requests.get('https://httpbin/get', { cookie: { foo: 'bar' } })
```
以上用法将会产生如下 cookie：
```text/plain
Cookie: foo=bar;
```
`cookies` 是一个值类型为 `string` 的对象，键为 cookie 名，值为 cookie 的值：
```typescript
type ICookieSet = {
    [name: string]: string;
};

Cookies: ICookieSet
```
同一个 cookie 不能设置多个值。

所有通过 cookies 设置的 cookie 将会附加在浏览器管理的 cookie 之后，这是 [`GM_xmlHttpRequest`](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_xmlhttpRequest) 的特性决定的。 

#### 2. `headers`
```typescript
requests.get('https://httpbin/get', { headers: { foo: 'bar' } })
```
以上用法将会产生如下标头：
```text/plain
foo: bar
```
`headers` 是一个值类型为 `string` 或 `string[]` 的对象，键为标头名，值为标头的值，当值为 `string[]` 时，表示该标头有多个值，发送请求时将会用逗号隔开：
```typescript
headers: {
    [header: string]: string | string[];
} & {
    cookie?: {
        [name: string]: string;
    };
}
```

#### 3. `headers.cookie` 和 `cookies` 的优先级
根据 [`GM_xmlHttpRequest`](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_xmlhttpRequest) 的特性，两者的优先级 `headers.cookie` `>` `cookies`，本库将与之保持一致。

## 使用 `Session`
与 requests 相似，`Session` 用来跨请求保持自定义 cookie。但服务器响应中通过 `Set-Cookie` 标头设定的 cookie 将交给浏览器管理，`Session` 不会管理它们，并且会将其标记和删除，在以后的请求中，如果又传入了同名的 cookie，`Session` 将忽略它们。
```typescript
let session = new requests.Session();

session.headers = { foo: 'bar'};
// header 将被覆盖成 { foo: 'com.github.bigbowl-wtw/gm-requests' }
session.headers.update({ foo: 'com.github.bigbowl-wtw/gm-requests' });
// header 被更新为 { foo: [ 'com.github.bigbowl-wtw/gm-requests', 'bar' ]}
session.headers.append('foo', 'bar');

session.cookies = { test: 'A' };
// cookie 将被更新为 { test: 'B' }
session.cookie.update({ test: 'B' });
```

当传入的标头包含 cookie 时，`Session.cookie` 将被更新（而不是 `Session.headers.cookie`）。

### `requests.session`
`requests.session` 用来返回一个 `Session` 实例（与 requests 完全相同）。
```typescript
let session: requests.Session = requests.session()
```



