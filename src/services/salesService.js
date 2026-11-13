import api from "./api";

const unwrap = (response) => response.data?.data || response.data;

/**
 * 로그인한 점포의 판매 내역 조회 (페이지네이션)
 * GET /api/store/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20
 * 응답: { items, total, page, limit, total_pages }
 */
export const getSales = async ({ from, to, page, limit } = {}) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  const data = unwrap(await api.get("/store/sales", { params }));
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      limit: data.length,
      total_pages: 1,
    };
  }
  return data;
};

/**
 * 판매 등록
 * POST /api/store/sales
 */
export const createSale = async (payload) => {
  return unwrap(await api.post("/store/sales", payload));
};
