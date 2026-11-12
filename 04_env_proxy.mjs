// Use HTTP_PROXY / HTTPS_PROXY / NO_PROXY for every fetch in the process.
//   export HTTPS_PROXY="http://USERNAME:PASSWORD@resi.fusionproxy.net:12286"
//   node 04_env_proxy.mjs
import { EnvHttpProxyAgent, fetch, setGlobalDispatcher } from 'undici';

if (!process.env.HTTPS_PROXY && !process.env.https_proxy) {
  console.error('set HTTPS_PROXY first, for example http://USERNAME:PASSWORD@resi.fusionproxy.net:12286');
  process.exit(1);
}

// reads the variables once and honours NO_PROXY
setGlobalDispatcher(new EnvHttpProxyAgent());

const data = await (await fetch('https://ipinfo.io/json')).json();
console.log(`${data.ip} (${data.country}, ${data.city})`);
