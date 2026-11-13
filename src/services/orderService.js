import api from "./api";

const unwrap = (response) => response.data?.data || response.data;

/**
 * 자동 발주 추천 목록 조회 (페이지네이션 + 검색)
 * GET /api/store/orders/recommendations?search=도시락&page=1&limit=20
 * 응답: { items, total, page, limit, total_pages }
 */
export const getRecommendations = async ({ page, limit, search } = {}) => {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (search) params.search = search;
  return unwrap(await api.get("/store/orders/recommendations", { params }));
};

/**
 * 자동 발주 추천 상세 조회 (계산 근거 포함)
 * GET /api/store/orders/recommendations/:productId
 */
export const getRecommendationDetail = async (productId) => {
  return unwrap(await api.get(`/store/orders/recommendations/${productId}`));
};

/**
 * 발주 확정
 * POST /api/store/orders/confirm  body: { items: [{ product_id, quantity }] }
 */
export const confirmOrders = async (items) => {
  return unwrap(await api.post("/store/orders/confirm", { items }));
};

/**
 * 발주 이력 조회 (페이지네이션)
 * GET /api/store/orders?status=PENDING&page=1&limit=20
 * 응답: { items, total, page, limit, total_pages }
 */
export const getOrders = async ({ status, page, limit } = {}) => {
  const params = {};
  if (status) params.status = status;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  return unwrap(await api.get("/store/orders", { params }));
};

/**
 * 발주 상세 조회
 * GET /api/store/orders/:orderId
 */
export const getOrder = async (orderId) => {
  return unwrap(await api.get(`/store/orders/${orderId}`));
};
