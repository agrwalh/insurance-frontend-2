import api from "./axiosInstance";

export const paymentApi = {
  recordPayment: (data) => api.post("/payments", data),
  recordByAdmin: (data) => api.post("/payments/admin", data),
  getMyPayments: (policyId, params) => api.get(`/payments/my/${policyId}`, { params }),
  getAll: (params) => api.get("/payments", { params }),
  getByPolicy: (policyId, params) => api.get(`/payments/policy/${policyId}`, { params }),
};
