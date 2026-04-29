// steady-fetch Copyright (C) 2026 rp7-cpu
// This program comes with ABSOLUTELY NO WARRANTY.
// This is free software, and you are welcome to redistribute it
// under the terms of the GNU Affero General Public License v3.0.
// You should have received a copy of the license with this program.
// If not, see <https://www.gnu.org/licenses/>.
export function injectKey(url: string, init: RequestInit | undefined, keyMap: Record<string, string>): RequestInit | undefined {
  if (!keyMap || Object.keys(keyMap).length === 0) return init;
  const host = new URL(url).host;
  const key = keyMap[host];
  if (!key) return init;
  const headers = new Headers(init?.headers);
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${key}`);
  }
  return { ...init, headers };
}

