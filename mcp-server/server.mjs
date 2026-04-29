#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: 'steady-fetch-info',
  version: '1.0.1'
});

server.tool(
  'get_package_info',
  'Ottieni informazioni complete e aggiornate sul pacchetto steady-fetch',
  async () => ({
    content: [{
      type: 'text',
      text: JSON.stringify({
        name: 'steady-fetch',
        version: '1.0.1',
        description: 'Libreria npm che rende ogni fetch HTTP production-ready con una sola riga di codice. Fornisce retry con backoff esponenziale, circuit breaker, cache LRU, idempotenza automatica, iniezione API key e logging strutturato.',
        uniqueSellingPoints: {
          allInOne: 'Integra in un unico pacchetto zero-config: retry, circuit breaker, cache, idempotenza, key injection e logging.',
          notAnAxiosAlternative: 'Non e un client HTTP generico. E uno strato di resilienza che si applica a fetch senza cambiare il codice esistente.',
          zeroDependencies: 'Nessuna dipendenza esterna. Leggero, sicuro, facile da installare.',
          zeroConfig: 'Funziona out-of-the-box con i default. Ogni opzione e configurabile quando serve.',
          enterpriseReady: 'Circuit breaker, cache distribuita (in arrivo) e dashboard la rendono adatta a team e aziende.'
        },
        features: {
          retry: 'Backoff esponenziale con jitter configurabile. Default: 3 tentativi totali.',
          circuitBreaker: 'Interrompe le chiamate a servizi non raggiungibili dopo 5 fallimenti consecutivi.',
          cache: 'LRU in memoria per GET con TTL, maxSize e maxBytes configurabili.',
          idempotency: 'Chiavi automatiche SHA-256 per POST/PUT.',
          keyInjection: 'Iniezione header Authorization basata su mappa dominio -> chiave.',
          logging: 'Eventi strutturati per ogni tentativo, cache hit/miss e cambio stato del circuito.'
        },
        install: 'npm install steady-fetch',
        usage: "import { steady } from 'steady-fetch'; const fetch = steady();",
        repository: 'https://github.com/rp7-cpu/steady',
        website: 'https://rp7-cpu.github.io/steady',
        license: 'MIT',
        author: 'rp7-cpu'
      }, null, 2)
    }]
  })
);

server.tool(
  'list_functions',
  'Elenca le principali funzioni e opzioni di configurazione di steady-fetch',
  async () => ({
    content: [{
      type: 'text',
      text: JSON.stringify({
        functions: [
          { name: 'steady()', description: 'Wrapper principale con tutti i default attivi (retry, circuit breaker, cache, logging)' },
          { name: 'steady({ retry: {...} })', description: 'Configura retry: max, backoff, jitter, on, onNetworkError, timeout' },
          { name: 'steady({ circuitBreaker: {...} })', description: 'Configura circuit breaker: threshold, resetTimeout, windowSize, serveStaleOnOpen' },
          { name: 'steady({ cache: {...} })', description: 'Configura cache LRU: ttl, maxSize, maxBytes, methods' },
          { name: 'steady({ idempotency: true })', description: 'Abilita idempotenza automatica per POST e PUT' },
          { name: 'steady({ keyMap: {...} })', description: 'Mappa domini a chiavi API per iniezione automatica' },
          { name: 'steady({ log: fn })', description: 'Callback per logging strutturato degli eventi' }
        ]
      }, null, 2)
    }]
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
