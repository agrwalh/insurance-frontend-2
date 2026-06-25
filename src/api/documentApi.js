import api from "./axiosInstance";

export const documentApi = {
  upload: (claimId, documentName, documentType, file) => {
    const formData = new FormData();
    formData.append("documentName", documentName);
    formData.append("documentType", documentType);
    formData.append("file", file);

    return api.post(`/claims/${claimId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getByClaim: (claimId) => api.get(`/claims/${claimId}/documents`),
  delete: (documentId) => api.delete(`/claims/documents/${documentId}`),
};
