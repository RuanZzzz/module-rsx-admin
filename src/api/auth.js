import { clearToken, postJson, request, setToken } from './http';

export async function login(payload) {
  const data = await postJson('/api/auth/login', payload);
  setToken(data.token);
  return data;
}

export function currentUser() {
  return request('/api/auth/me');
}

export async function logout() {
  try {
    await postJson('/api/auth/logout', {});
  } finally {
    clearToken();
  }
}
