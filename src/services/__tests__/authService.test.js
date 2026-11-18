import api from "../api";

jest.mock("../api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import {
  loginStore,
  loginAdmin,
  getCurrentUser,
  changePassword,
} from "../authService";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("services/authService", () => {
  describe("loginStore", () => {
    test("store_code/password를 POST /auth/login 으로 전송하고 data.data를 언래핑한다", async () => {
      api.post.mockResolvedValue({ data: { data: { token: "t1" } } });

      const result = await loginStore({
        store_code: "S001",
        password: "pw",
      });

      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        store_code: "S001",
        password: "pw",
      });
      expect(result).toEqual({ token: "t1" });
    });

    test("storeCode 카멜케이스를 snake_case로 변환한다", async () => {
      api.post.mockResolvedValue({ data: {} });

      await loginStore({ storeCode: "S002", password: "pw" });

      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        store_code: "S002",
        password: "pw",
      });
    });

    test("data.data가 없으면 data 전체를 반환한다", async () => {
      api.post.mockResolvedValue({ data: { token: "t2" } });

      const result = await loginStore({ store_code: "S", password: "p" });
      expect(result).toEqual({ token: "t2" });
    });
  });

  describe("loginAdmin", () => {
    test("payload 그대로 POST /admin/auth/login 을 호출한다", async () => {
      api.post.mockResolvedValue({
        data: { data: { token: "a1", role: "ADMIN" } },
      });

      const result = await loginAdmin({
        admin_username: "root",
        password: "pw",
      });

      expect(api.post).toHaveBeenCalledWith("/admin/auth/login", {
        admin_username: "root",
        password: "pw",
      });
      expect(result).toEqual({ token: "a1", role: "ADMIN" });
    });
  });

  test("getCurrentUser는 GET /auth/me 결과를 언래핑한다", async () => {
    api.get.mockResolvedValue({ data: { data: { id: 1, role: "STORE" } } });

    const result = await getCurrentUser();

    expect(api.get).toHaveBeenCalledWith("/auth/me");
    expect(result).toEqual({ id: 1, role: "STORE" });
  });

  test("changePassword는 PATCH /auth/password 를 호출한다", async () => {
    api.patch.mockResolvedValue({ data: { data: { ok: true } } });

    const result = await changePassword({
      current_password: "old",
      new_password: "new",
    });

    expect(api.patch).toHaveBeenCalledWith("/auth/password", {
      current_password: "old",
      new_password: "new",
    });
    expect(result).toEqual({ ok: true });
  });

  test("API 에러를 그대로 전파한다", async () => {
    api.get.mockRejectedValue(new Error("network down"));

    await expect(getCurrentUser()).rejects.toThrow("network down");
  });
});
