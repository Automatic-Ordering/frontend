import api from "./api";
const unwrap = (response) => response.data?.data || response.data;
export const loginStore = async (payload) =>
  unwrap(
    await api.post("/auth/login", {
      store_code: payload.store_code ?? payload.storeCode,
      password: payload.password,
    }),
  );
export const loginAdmin = async (payload) =>
  unwrap(await api.post("/admin/auth/login", payload));
export const getCurrentUser = async () => unwrap(await api.get("/auth/me"));
export const changePassword = async (payload) =>
  unwrap(await api.patch("/auth/password", payload));
