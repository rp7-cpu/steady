# steady-fetch

**Production-ready HTTP fetch wrapper with retry, circuit breaker, cache, idempotency, key injection, and structured logging. One line, zero config.**

## Quick Start
`import { steady } from 'steady-fetch';`
`const fetch = steady();`
`const res = await fetch('https://api.example.com/data');`

## Features
- **Retry** with exponential backoff and jitter
- **Circuit breaker** to stop hammering dead services
- **LRU cache** for GET responses
- **Idempotency** for safe POST/PUT
- **API key injection** via domain map
- **Structured logging** for every request, retry, and cache event

---

## Installation
`npm install steady-fetch`

## Links
- GitHub: https://github.com/rp7-cpu/steady
- npm: https://www.npmjs.com/package/steady-fetch
- Website: https://rp7-cpu.github.io/steady

## License
MIT


## License
- **Version 1.0.1** remains under the MIT License.
- **Version 1.1.0 and later** are released under the GNU Affero General Public License v3 (AGPLv3). See [LICENSE-AGPL](./LICENSE-AGPL) for the full text.

## Enterprise & Cloud
The AGPL ensures that anyone using steady-fetch in a network context must share their source code. For organizations that cannot comply, a commercial license is available. Additionally, the upcoming **steady.cloud** service will provide distributed cache and centralized circuit breaking — features that are impossible to replicate locally and will be available exclusively to license holders.

## 🌐 Mesh Network (Experimental)

steady-fetch now supports decentralized operation via a peer-to-peer mesh network.
When enabled, instances automatically share cache and circuit breaker state,
making the library completely unstoppable.

### How to enable

const fetch = steady({ p2p: { enable: true } });

### Why this matters

- **No central server**: No single point of failure or control
- **Censorship resistant**: Cannot be shut down by any company or government
- **Community owned**: The network belongs to everyone who uses it

See MANIFESTO.md for our full vision.

