import api from "./axiosInstance";

export const customerApi = {
  createProfile: (data) => api.post("/customers/profile", data),
  updateProfile: (data) => api.put("/customers/profile", data),
  getMyProfile: () => api.get("/customers/profile"),
  getById: (customerId) => api.get(`/customers/${customerId}`),
  getAll: (params) => api.get("/customers", { params }),
};
