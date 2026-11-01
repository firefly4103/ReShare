import api from './client';

export const exchangesApi = {
  getById: (id) => api.get(`/exchanges/${id}`),
  getMyExchanges: (params) => api.get('/exchanges/my-exchanges', { params }),
  confirm: (id) => api.post(`/exchanges/${id}/confirm`),
  cancel: (id) => api.post(`/exchanges/${id}/cancel`),
  feedback: (id, data) => api.post(`/exchanges/${id}/feedback`, data),
};
