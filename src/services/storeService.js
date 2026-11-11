import api from "./api";
const unwrap = (response) => response.data?.data || response.data;

const normalizeStore = (store) =>
  store
    ? {
        ...store,
        id: store.id ?? store.store_id ?? store.storeId,
        code: store.code ?? store.store_code ?? store.storeCode,
        name: store.name ?? store.store_name ?? store.storeName,
        createdAt: store.createdAt ?? store.created_at,
      }
    : store;

export const getStoreId = (store) => store?.id ?? store?.store_id ?? store?.storeId;

const normalizeStores = (data) => {
  const stores = Array.isArray(data) ? data : data?.stores || [];
  return stores.map(normalizeStore);
};

export const getStores = async () =>
  normalizeStores(unwrap(await api.get("/admin/stores")));
export const getStore = async (storeId) =>
  normalizeStore(unwrap(await api.get(`/admin/stores/${storeId}`)));
export const createStore = async (payload) =>
  normalizeStore(unwrap(await api.post("/admin/stores", payload)));
export const updateStore = async (storeId, payload) =>
  normalizeStore(unwrap(await api.patch(`/admin/stores/${storeId}`, payload)));
export const updateStoreStatus = async (storeId, status) =>
  normalizeStore(
    unwrap(await api.patch(`/admin/stores/${storeId}/status`, { status })),
  );
export const deleteStore = async (storeId) =>
  api.delete(`/admin/stores/${storeId}`);
