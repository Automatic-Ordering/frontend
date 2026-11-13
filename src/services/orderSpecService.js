import api from "./api";

const unwrap = (response) => response.data?.data || response.data;

/**
 * 발주 명세서 목록 조회 (점포)
 * GET /api/store/orders/specs?status=&page=&limit=
 * 응답: { items, total, page, limit, total_pages }
 */
export const getOrderSpecs = async ({ status, page, limit } = {}) => {
  const params = {};
  if (status) params.status = status;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  return unwrap(await api.get("/store/orders/specs", { params }));
};

/**
 * 입고 대기 발주 목록 조회 (점포, ORDERED 상태)
 * GET /api/store/orders/specs/pending-receipts?page=&limit=
 */
export const getPendingReceipts = async ({ page, limit } = {}) => {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  return unwrap(await api.get("/store/orders/specs/pending-receipts", { params }));
};

/**
 * 발주 명세서 상세 조회 (점포)
 * GET /api/store/orders/specs/:specId
 */
export const getOrderSpecDetail = async (specId) => {
  return unwrap(await api.get(`/store/orders/specs/${specId}`));
};

/**
 * 발주 명세서 생성 (DRAFT)
 * POST /api/store/orders/specs  body: { items: [{ product_id, quantity }] }
 * items 생략 시 자동 발주 추천(needs_order) 결과가 사용됩니다.
 */
export const createOrderSpec = async (items) => {
  const body = items ? { items } : {};
  return unwrap(await api.post("/store/orders/specs", body));
};

/**
 * 발주 수량 수정 (DRAFT 전용, 전체 교체)
 * PATCH /api/store/orders/specs/:specId/items  body: { items }
 */
export const updateOrderSpecItems = async (specId, items) => {
  return unwrap(await api.patch(`/store/orders/specs/${specId}/items`, { items }));
};

/**
 * 발주 명세서 제출 (DRAFT → REQUESTED)
 * POST /api/store/orders/specs/:specId/submit
 */
export const submitOrderSpec = async (specId) => {
  return unwrap(await api.post(`/store/orders/specs/${specId}/submit`));
};

/**
 * 발주 명세서 취소 (DRAFT/REQUESTED → CANCELLED)
 * POST /api/store/orders/specs/:specId/cancel
 */
export const cancelOrderSpec = async (specId) => {
  return unwrap(await api.post(`/store/orders/specs/${specId}/cancel`));
};

/**
 * 입고 처리 (ORDERED → RECEIVED, 재고 증가)
 * POST /api/store/orders/specs/:specId/receipt
 * body: { items: [{ product_id, received_quantity }] }
 * 응답: 명세서 + comparison [{ product_id, product_name, order_quantity, received_quantity, difference }]
 */
export const receiveOrderSpec = async (specId, items) => {
  return unwrap(await api.post(`/store/orders/specs/${specId}/receipt`, { items }));
};

/**
 * 전체 점포 발주 명세서 목록 조회 (본사)
 * GET /api/admin/orders/specs?store_id=&status=&page=&limit=
 */
export const getAdminOrderSpecs = async ({ storeId, status, page, limit } = {}) => {
  const params = {};
  if (storeId) params.store_id = storeId;
  if (status) params.status = status;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  return unwrap(await api.get("/admin/orders/specs", { params }));
};

/**
 * 발주 명세서 상세 조회 (본사)
 * GET /api/admin/orders/specs/:specId
 */
export const getAdminOrderSpecDetail = async (specId) => {
  return unwrap(await api.get(`/admin/orders/specs/${specId}`));
};

/**
 * 발주 승인 (REQUESTED → APPROVED)
 * POST /api/admin/orders/specs/:specId/approve
 */
export const approveOrderSpec = async (specId) => {
  return unwrap(await api.post(`/admin/orders/specs/${specId}/approve`));
};

/**
 * 발주 반려 (REQUESTED → REJECTED)
 * POST /api/admin/orders/specs/:specId/reject  body: { reason }
 */
export const rejectOrderSpec = async (specId, reason) => {
  return unwrap(await api.post(`/admin/orders/specs/${specId}/reject`, { reason }));
};

/**
 * 발주서 발행 (APPROVED → ORDERED)
 * POST /api/admin/orders/specs/:specId/issue
 */
export const issueOrderSpec = async (specId) => {
  return unwrap(await api.post(`/admin/orders/specs/${specId}/issue`));
};
