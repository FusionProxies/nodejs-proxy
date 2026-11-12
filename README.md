<p align="center">
  <a href="https://fusionproxy.net/?utm_source=github&utm_medium=nodejs-proxy">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/FusionProxies/.github/main/assets/logo-on-dark.png">
      <img src="https://raw.githubusercontent.com/FusionProxies/.github/main/assets/logo-on-light.png" alt="Fusion Proxy" height="52">
    </picture>
  </a>
</p>

# How to use a proxy in Node.js (fetch, axios, SOCKS5)

Node.js has no proxy setting you can just switch on: `fetch` and `http` ignore `HTTP_PROXY` unless you tell them otherwise. This guide shows the reliable way for each client: `fetch` with undici's `ProxyAgent`, axios with `https-proxy-agent`, SOCKS5 with `socks-proxy-agent`, proxies from environment variables, rotating and sticky IPs, and the errors you will see. Every script runs as is.

```bash
npm install
export FUSION_USER="your_username"
export FUSION_PASS="your_password"
```

## Contents

1. [fetch with a proxy](#1-fetch-with-a-proxy)
2. [axios with a proxy](#2-axios-with-a-proxy)
3. [SOCKS5 proxy](#3-socks5-proxy)
4. [Proxy from environment variables](#4-proxy-from-environment-variables)
5. [Rotating and sticky IPs](#5-rotating-and-sticky-ips)
6. [Errors and fixes](#6-errors-and-fixes)

## 1. fetch with a proxy

Node's built-in `fetch` runs on undici. Pass a `ProxyAgent` as the `dispatcher`:

```js
import { fetch, ProxyAgent } from 'undici';

const dispatcher = new ProxyAgent({
  uri: 'http://resi.fusionproxy.net:12286',
  token: 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64'),
});

const res = await fetch('https://ipinfo.io/json', { dispatcher, signal: AbortSignal.timeout(30000) });
console.log(await res.json());
```

- The `token` is the `Proxy-Authorization` header, so the credentials go to the proxy and never to the website.
- Import `fetch` from the `undici` package together with `ProxyAgent`. Mixing the global `fetch` with a `ProxyAgent` from a different undici version can fail with confusing errors.
- `AbortSignal.timeout()` stops a request through a dead proxy instead of waiting forever.

Script: [`01_fetch_proxy.mjs`](01_fetch_proxy.mjs)

## 2. axios with a proxy

axios has a `proxy` option, but it does not open a `CONNECT` tunnel for HTTPS websites. Use an agent and set `proxy: false`:

```js
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const agent = new HttpsProxyAgent(`http://${encodeURIComponent(USERNAME)}:${encodeURIComponent(PASSWORD)}@resi.fusionproxy.net:12286`);
const client = axios.create({ httpsAgent: agent, httpAgent: agent, proxy: false, timeout: 30000 });

const { data } = await client.get('https://ipinfo.io/json');
```

`encodeURIComponent` keeps `@`, `:` or `/` in a password from breaking the URL. The same agent works with `node:https`, `got` and most libraries that accept an `agent`.

Script: [`02_axios_proxy.mjs`](02_axios_proxy.mjs)

## 3. SOCKS5 proxy

```js
import { SocksProxyAgent } from 'socks-proxy-agent';

const agent = new SocksProxyAgent(`socks5h://${encodeURIComponent(USERNAME)}:${encodeURIComponent(PASSWORD)}@resi.fusionproxy.net:5390`);
const { data } = await axios.get('https://ipinfo.io/json', { httpsAgent: agent, httpAgent: agent, proxy: false });
```

Use `socks5h://` so the proxy resolves the host name and the DNS lookup does not leak from your machine.

Script: [`03_socks5_proxy.mjs`](03_socks5_proxy.mjs)

## 4. Proxy from environment variables

undici's `EnvHttpProxyAgent` reads `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` (upper or lower case). Make it the global dispatcher and every `fetch` uses it:

```js
import { EnvHttpProxyAgent, fetch, setGlobalDispatcher } from 'undici';

setGlobalDispatcher(new EnvHttpProxyAgent());
await fetch('https://ipinfo.io/json'); // goes through HTTPS_PROXY
```

```bash
export HTTPS_PROXY="http://USERNAME:PASSWORD@resi.fusionproxy.net:12286"
export NO_PROXY="localhost,127.0.0.1"
node 04_env_proxy.mjs
```

undici 6 prints a warning that `EnvHttpProxyAgent` is experimental; it works, but pin your undici version.

Script: [`04_env_proxy.mjs`](04_env_proxy.mjs)

## 5. Rotating and sticky IPs

A rotating residential gateway gives each new connection a new IP. Options in the username pick the country or keep one IP for a while:

```js
const rotating = `${USERNAME}-country-us`;                                   // new US IP per connection
const sticky = `${USERNAME}-country-us-sessid-4821937-sessTime-600s`;        // one US IP for 10 minutes
```

Agents keep connections open and reuse them, and a reused connection keeps its IP. Create a new agent when you want a new IP, and reuse one agent with a sticky username when you want to keep it. [`05_rotating_sticky.mjs`](05_rotating_sticky.mjs) prints three rotating IPs and three identical sticky ones. The username format is in the [endpoint generator guide](https://fusionproxy.net/guides/endpoint-generator?utm_source=github&utm_medium=nodejs-proxy).

## 6. Errors and fixes

| Error | Meaning | Fix |
|---|---|---|
| `Proxy response (407) !== 200 when HTTP Tunneling` | The proxy rejected the credentials | Check the username and password; encode special characters |
| `ECONNREFUSED` / `UND_ERR_CONNECT_TIMEOUT` | The proxy does not answer on that host and port | Wrong port, proxy down or blocked by a firewall |
| `timeout of 30000ms exceeded` (axios) / `TimeoutError` (fetch) | No answer in time | Retry with a new connection; on a rotating gateway that is a new IP |
| `self-signed certificate` / `unable to verify the first certificate` | Something in the path replaced the website's certificate | Do not set `rejectUnauthorized: false`; a proxy that does this reads your traffic |
| `403` or `429` from the website | The site blocks or rate-limits the IP | Slow down, use normal headers, use a residential IP in the right country |

To test proxies without code, use the [online proxy checker](https://fusionproxy.net/tools/proxy-checker?utm_source=github&utm_medium=nodejs-proxy) or the [proxy-checker](https://github.com/FusionProxies/proxy-checker) CLI.

No proxy yet? [Fusion Proxy residential proxies](https://fusionproxy.net/proxies/residential?utm_source=github&utm_medium=nodejs-proxy) start at $2.95/GB, with a [free trial](https://fusionproxy.net/free-trial?utm_source=github&utm_medium=nodejs-proxy).

## Related

- [puppeteer-proxy](https://github.com/FusionProxies/puppeteer-proxy) and [playwright-proxy](https://github.com/FusionProxies/playwright-proxy): proxies in headless browsers
- [python-requests-proxy](https://github.com/FusionProxies/python-requests-proxy): the same in Python
- [curl-proxy](https://github.com/FusionProxies/curl-proxy): proxies with cURL

## License

MIT, see [LICENSE](LICENSE).
