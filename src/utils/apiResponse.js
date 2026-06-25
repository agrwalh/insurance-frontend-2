export function normalizePageData(data) {
  if (!data || typeof data !== "object") return data;

  const isNewPagedResponse = Array.isArray(data.records);
  const isSpringPageResponse = Array.isArray(data.content);

  if (isNewPagedResponse) {
    const currentPage = data.currentPage ?? 0;
    const totalPages = data.totalPages ?? 0;
    return {
      ...data,
      content: data.records,
      number: currentPage,
      size: data.pageSize ?? data.records.length,
      totalElements: data.totalRecords ?? data.records.length,
      totalPages,
      first: currentPage === 0,
      last: data.lastPage ?? currentPage >= totalPages - 1,
    };
  }

  if (isSpringPageResponse) {
    return {
      ...data,
      records: data.content,
      currentPage: data.number ?? 0,
      pageSize: data.size ?? data.content.length,
      totalRecords: data.totalElements ?? data.content.length,
      lastPage: data.last ?? false,
    };
  }

  return data;
}

export function normalizeApiResponse(response) {
  if (response?.data?.data) {
    response.data.data = normalizePageData(response.data.data);
  }
  return response;
}

export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const payload = error?.response?.data;

  if (typeof payload === "string") return payload;
  if (payload?.message) return payload.message;
  if (payload?.error) return payload.error;
  if (error?.message) return error.message;

  return fallback;
}