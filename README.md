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