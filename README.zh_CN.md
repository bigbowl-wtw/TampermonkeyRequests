# GM Requests

[English](./README.zh_CN.md)

基于 [`GM_xmlHttpRequest`](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_xmlhttpRequest) 模仿 Python 的 [Requests](https://requests.readthedocs.io/en/latest/) 库.

## 如何引入
### 在脚本中使用 `@require` 标签
```javascript
// ==UserScript==
// @name         My Tampermonkey Script
// @description  Example script using the library
// @require      https://greasyfork.org/scripts/470000-gm-requests/code/GM%20Requests.js?version=1214468
// ==/UserScript==

requests.get('https://github.com')

```

确切值可以在 [这里](https://greasyfork.org/zh-CN/scripts/470000) 找到。

### 在本地代码中使用 `import`
首先安装 GM Requests：
```base
npm install https://github.com/bigbowl-wtw/GM-Requests.git
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

`options`：透传到 [`GM_xmlHttpRequest`](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_xmlhttpRequest) 的参数，但不包括 `url`、`method`、`headers`、`cookies`。

### `requests.post`
```typescript
let ret = await requests.post(
    'https://httpbin.org/get',
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
- `data: { [key: string]: string }`：以 `'application/x-www-form-urlencoded'` 发出的数据，值将使用 ureencoded 编码。
- 其他可以透传到 [`GM_xmlHttpRequest`](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_xmlhttpRequest) 的参数，但不包括 `url`、`method`、`headers`、`cookies`。

`json` 和 `data` 只在 `post` 中才其作用。

### 如何使用 headers 和 cookies
与 requests 相似，`requests.get`、`requests.post` 可以通过在 `options` 中指定 `headers` 或 `cookies` 而发出带这些参数的请求。

#### 1. `cookies`：
```typescript
requests.get('https://httpbin/get', { cookies: { foo: 'bar' } })
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
requests.get('https://httpbin/get', { cookies: { foo: 'bar' } })
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
session.cookie.update({ test: 'B' });
```

当传入的标头包含 cookie 时，`Session.cookies` 将被更新（而不是 `Session.headers.cookie`）。

### `requests.session`
`requests.session` 用来返回一个 `Session` 实例（与 requests 完全相同）。
```typescript
let session: requests.Session = requests.session()
```



