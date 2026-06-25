import api from "./axiosInstance";

export const claimApi = {
  submit: (data) => api.post("/claims", data),
  getMyClaims: (params) => api.get("/claims/my", { params }),
  getAll: (params) => api.get("/claims", { params }),
  getAssignedToMe: (params) => api.get("/claims/assigned-to-me", { params }),
  getById: (claimId) => api.get(`/claims/${claimId}`),
  assign: (claimId, agentId) => api.patch(`/claims/${claimId}/assign/${agentId}`),
  riskAssessment: (claimId) => api.get(`/claims/${claimId}/risk-assessment`),
  review: (claimId, data) => api.patch(`/claims/${claimId}/review`, data),
  decide: (claimId, data) => api.patch(`/claims/${claimId}/decide`, data),
  getHistory: (claimId, params) => api.get(`/claims/${claimId}/history`, { params }),
};
