import api from './client';

export const requestsApi = {
  create: (data) => api.post('/requests', data),
  getIncoming: (params) => api.get('/requests/incoming', { params }),
  getOutgoing: (params) => api.get('/requests/outgoing', { params }),
  accept: (id) => api.patch(`/requests/${id}/accept`),
  reject: (id) => api.patch(`/requests/${id}/reject`),
  cancel: (id) => api.patch(`/requests/${id}/cancel`),
};
