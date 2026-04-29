const TOKEN_KEY = 'module-rsx-token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['X-Token'] = token;
  }

  console.info('[api] request', options.method || 'GET', path);

  const response = await fetch(path, {
    ...options,
    headers
  });

  const result = await response.json();
  if (result.code !== 200) {
    console.warn('[api] business error', path, result);
    throw new Error(result.message || 'request failed');
  }
  return result.data;
}

export function postJson(path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
