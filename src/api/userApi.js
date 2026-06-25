import api from "./axiosInstance";

export const userApi = {
  getAll: (params) => api.get("/users", { params }),
  getById: (userId) => api.get(`/users/${userId}`),
  createAgent: (data) => api.post("/users/agent", data),
  updateStatus: (userId, data) => api.patch(`/users/${userId}/status`, data),
};
