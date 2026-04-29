// steady-fetch Copyright (C) 2026 rp7-cpu
// This program comes with ABSOLUTELY NO WARRANTY.
// This is free software, and you are welcome to redistribute it
// under the terms of the GNU Affero General Public License v3.0.
// You should have received a copy of the license with this program.
// If not, see <https://www.gnu.org/licenses/>.
export async function generateIdempotencyKey(input: RequestInfo, init?: RequestInit): Promise<string> {
  const url = typeof input === 'string' ? input : input.url;
  const method = init?.method || 'GET';
  const body = init?.body ? String(init.body) : '';
  const data = `${method}:${url}:${body}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

