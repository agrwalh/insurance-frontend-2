import api from "./axiosInstance";

export const planApi = {
  create: (data) => api.post("/plans", data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  deactivate: (id) => api.patch(`/plans/${id}/deactivate`),
  getActive: (params) => api.get("/plans/active", { params }),
  getByProduct: (productId, params) => api.get(`/plans/product/${productId}`, { params }),
};
