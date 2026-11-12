// axios through an authenticated proxy with https-proxy-agent.
//   export FUSION_USER=... FUSION_PASS=...   then: node 02_axios_proxy.mjs
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const { FUSION_USER, FUSION_PASS, FUSION_COUNTRY = 'us' } = process.env;
const user = encodeURIComponent(`${FUSION_USER}-country-${FUSION_COUNTRY}`);
const agent = new HttpsProxyAgent(`http://${user}:${encodeURIComponent(FUSION_PASS)}@resi.fusionproxy.net:12286`);

// proxy: false turns off axios' own proxy handling, which does not tunnel HTTPS properly
const client = axios.create({ httpsAgent: agent, httpAgent: agent, proxy: false, timeout: 30000 });

const { data } = await client.get('https://ipinfo.io/json');
console.log(`${data.ip} (${data.country}, ${data.city})`);
