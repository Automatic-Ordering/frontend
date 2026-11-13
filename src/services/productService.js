import api from "./api";

const unwrap = (response) => response.data?.data || response.data;

/**
 * 관리자 및 공용 상품 목록 조회
 * GET /api/products
 */
export const getProducts = async () => {
  const data = unwrap(await api.get("/products"));
  return Array.isArray(data) ? data : data?.products || [];
};

/**
 * 단일 상품 상세 조회
 * GET /api/products/:productId
 */
export const getProduct = async (productId) => {
  return unwrap(await api.get(`/products/${productId}`));
};

/**
 * 로그인한 점포의 상품 및 재고 현황 조회 (전체 목록 - 판매 등록 드롭다운 등)
 * GET /api/store/products
 */
export const getStoreProducts = async () => {
  const data = unwrap(await api.get("/store/products"));
  return Array.isArray(data) ? data : data?.products || [];
};

/**
 * 로그인한 점포의 등록 상품 재고 목록 조회 (페이지네이션 + 검색)
 * GET /api/store/products?search=도시락&page=1&limit=20
 * 응답: { items, total, page, limit, total_pages }
 */
export const getStoreProductsPage = async ({ page, limit, search } = {}) => {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (search) params.search = search;
  return unwrap(await api.get("/store/products", { params }));
};


