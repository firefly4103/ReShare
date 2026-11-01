import api from './client';

export const listingsApi = {
  getAll: (params) => api.get('/listings', { params }),
  getById: (id) => api.get(`/listings/${id}`),
  getMyListings: (params) => api.get('/listings/my-listings', { params }),
  create: (formData) =>
    api.post('/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, data) => api.put(`/listings/${id}`, data),
  remove: (id) => api.delete(`/listings/${id}`),
};
