import api from "./axiosInstance";

export const auditApi = {
  getAll: (params) => api.get("/audit-logs", { params }),
};