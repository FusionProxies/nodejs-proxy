// SOCKS5 proxy with socks-proxy-agent (works with axios, node:https and most clients).
// socks5h:// makes the proxy resolve host names, so DNS does not leak from your machine.
//   export FUSION_USER=... FUSION_PASS=...   then: node 03_socks5_proxy.mjs
import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';

const { FUSION_USER, FUSION_PASS, FUSION_COUNTRY = 'de' } = process.env;
const user = encodeURIComponent(`${FUSION_USER}-country-${FUSION_COUNTRY}`);
const agent = new SocksProxyAgent(`socks5h://${user}:${encodeURIComponent(FUSION_PASS)}@resi.fusionproxy.net:5390`);

const { data } = await axios.get('https://ipinfo.io/json', { httpsAgent: agent, httpAgent: agent, proxy: false, timeout: 30000 });
console.log(`${data.ip} (${data.country}, ${data.city})`);
