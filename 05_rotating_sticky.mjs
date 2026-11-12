// Rotating (new IP per request) versus sticky (one IP for the session) on a residential gateway.
//   export FUSION_USER=... FUSION_PASS=...   then: node 05_rotating_sticky.mjs
import { fetch, ProxyAgent } from 'undici';

const { FUSION_USER, FUSION_PASS, FUSION_COUNTRY = 'us' } = process.env;

async function ipThrough(username, attempts = 3) {
  for (let i = 1; ; i++) {
    // a new agent means a new connection, so the gateway picks the IP again
    const dispatcher = new ProxyAgent({
      uri: 'http://resi.fusionproxy.net:12286',
      token: 'Basic ' + Buffer.from(`${username}:${FUSION_PASS}`).toString('base64'),
    });
    try {
      return (await (await fetch('https://ipinfo.io/ip', { dispatcher, signal: AbortSignal.timeout(30000) })).text()).trim();
    } catch (err) {
      if (i === attempts) throw err; // residential devices can drop a connection; retry the same username
    } finally {
      await dispatcher.close();
    }
  }
}

const rotating = [];
for (let i = 0; i < 3; i++) rotating.push(await ipThrough(`${FUSION_USER}-country-${FUSION_COUNTRY}`));
console.log('rotating:', rotating);

const sticky = `${FUSION_USER}-country-${FUSION_COUNTRY}-sessid-${Math.floor(Math.random() * 9e6) + 1e6}-sessTime-600s`;
const same = [];
for (let i = 0; i < 3; i++) same.push(await ipThrough(sticky));
console.log('sticky:  ', same);
