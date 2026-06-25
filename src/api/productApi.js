import api from "./axiosInstance";

export const productApi = {
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  deactivate: (id) => api.patch(`/products/${id}/deactivate`),
  getActive: (params) => api.get("/products/active", { params }),
  getAll: (params) => api.get("/products", { params }),
};
