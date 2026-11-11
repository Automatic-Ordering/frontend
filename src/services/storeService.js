import api from "./api";
const unwrap = (response) => response.data?.data || response.data;
export const getStores = async () => unwrap(await api.get("/admin/stores"));
export const getStore = async (storeId) =>
  unwrap(await api.get(`/admin/stores/${storeId}`));
export const createStore = async (payload) =>
  unwrap(await api.post("/admin/stores", payload));
export const updateStore = async (storeId, payload) =>
  unwrap(await api.patch(`/admin/stores/${storeId}`, payload));
export const updateStoreStatus = async (storeId, status) =>
  unwrap(await api.patch(`/admin/stores/${storeId}/status`, { status }));
