import { postJson, request } from './http';

export const moduleApi = {
  list: () => request('/api/modules'),
  create: (payload) => postJson('/api/modules/create', payload),
  update: (code, payload) => postJson(`/api/modules/update?code=${encodeURIComponent(code)}`, payload),
  remove: (code) => postJson(`/api/modules/delete?code=${encodeURIComponent(code)}`, {})
};

export const toolApi = {
  list: () => request('/api/tools'),
  create: (payload) => postJson('/api/tools/create', payload),
  update: (id, payload) => postJson(`/api/tools/update?id=${encodeURIComponent(id)}`, payload),
  remove: (id) => postJson(`/api/tools/delete?id=${encodeURIComponent(id)}`, {})
};

export const articleApi = {
  list: () => request('/api/articles'),
  create: (payload) => postJson('/api/articles/create', payload),
  update: (id, payload) => postJson(`/api/articles/update?id=${encodeURIComponent(id)}`, payload),
  remove: (id) => postJson(`/api/articles/delete?id=${encodeURIComponent(id)}`, {})
};

export const orderApi = {
  list: () => request('/api/orders'),
  create: (payload) => postJson('/api/orders/create', payload),
  update: (id, payload) => postJson(`/api/orders/update?id=${encodeURIComponent(id)}`, payload),
  changeStatus: (id, payload) => postJson(`/api/orders/status/change?id=${encodeURIComponent(id)}`, payload),
  bindExpress: (id, payload) => postJson(`/api/orders/express/bind?id=${encodeURIComponent(id)}`, payload),
  trace: (id) => request(`/api/orders/express/trace?id=${encodeURIComponent(id)}`)
};
