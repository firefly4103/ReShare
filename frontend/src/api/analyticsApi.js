import api from './client';

export const analyticsApi = {
  platformSummary: () => api.get('/analytics/platform-summary'),
  userImpact: (userId) => api.get(`/analytics/user-impact/${userId}`),
};
