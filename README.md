# steady

**Your fetch calls, production-ready in one line.**

## Install

pm install steady

## Quick Start
import { steady } from 'steady';
const fetch = steady({ keyMap: { 'api.openai.com': process.env.OPENAI_API_KEY } });

## Features
Retry, circuit breaker, cache, idempotency, API key injection, logging.

## Boundaries
No WebSocket, no parsing, no other clients, no token refresh, no ENOTFOUND retry, no cache for POST by default, no auto key detection.

## License
MIT
