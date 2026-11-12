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


