import api from "./axiosInstance";

export const settlementApi = {
  initiate: (claimId, data) => api.post(`/settlements/claim/${claimId}`, data),
  markPaid: (settlementId, data) => api.patch(`/settlements/${settlementId}/paid`, data),
  getById: (settlementId) => api.get(`/settlements/${settlementId}`),
  getByClaim: (claimId) => api.get(`/settlements/claim/${claimId}`),
};