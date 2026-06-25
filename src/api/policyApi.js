import api from "./axiosInstance";

export const policyApi = {
  purchase: (data) => api.post("/policies/purchase", data),
  issue: (data) => api.post("/policies/issue", data),
  getMyPolicies: (params) => api.get("/policies/my", { params }),
  getAll: (params) => api.get("/policies", { params }),
  getByCustomer: (customerId, params) => api.get(`/policies/customer/${customerId}`, { params }),
  getById: (policyId) => api.get(`/policies/${policyId}`),
  cancel: (policyId) => api.patch(`/policies/${policyId}/cancel`),
};
