// fetch through an authenticated proxy with undici's ProxyAgent.
//   export FUSION_USER=... FUSION_PASS=...   then: node 01_fetch_proxy.mjs
import { fetch, ProxyAgent } from 'undici';

const { FUSION_USER, FUSION_PASS, FUSION_COUNTRY = 'us' } = process.env;

const dispatcher = new ProxyAgent({
  uri: 'http://resi.fusionproxy.net:12286',
  // the credentials go to the proxy, not to the website
  token: 'Basic ' + Buffer.from(`${FUSION_USER}-country-${FUSION_COUNTRY}:${FUSION_PASS}`).toString('base64'),
});

const res = await fetch('https://ipinfo.io/json', { dispatcher, signal: AbortSignal.timeout(30000) });
const data = await res.json();
console.log(`${data.ip} (${data.country}, ${data.city})`);
