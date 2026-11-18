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
  getStoreId,
  getStores,
  getStore,
  createStore,
  updateStore,
  updateStoreStatus,
  deleteStore,
  resetStorePassword,
} from "../storeService";

beforeEach(() => {
  jest.clearAllMocks();
});

const ok = (data) => jest.fn(() => Promise.resolve({ data }));

describe("services/storeService", () => {
  describe("getStoreId", () => {
    test.each([
      ["id", { id: 1 }, 1],
      ["store_id", { store_id: 2 }, 2],
      ["storeId", { storeId: 3 }, 3],
      ["우선순위 id", { id: 1, store_id: 2, storeId: 3 }, 1],
      ["없는 경우", {}, undefined],
      ["null", null, undefined],
    ])("%s에서 store id를 찾는다", (_label, store, expected) => {
      expect(getStoreId(store)).toBe(expected);
    });
  });

  describe("정규화", () => {
    test("getStores는 snake_case 필드를 카멜케이스로 정규화한다", async () => {
      api.get.mockImplementation(
        ok({
          stores: [
            {
              store_id: 1,
              store_code: "S001",
              store_name: "강남점",
              created_at: "2024-01-01",
            },
          ],
        }),
      );

      const result = await getStores();

      expect(api.get).toHaveBeenCalledWith("/admin/stores");
      expect(result).toEqual([
        {
          store_id: 1,
          store_code: "S001",
          store_name: "강남점",
          created_at: "2024-01-01",
          id: 1,
          code: "S001",
          name: "강남점",
          createdAt: "2024-01-01",
        },
      ]);
    });

    test("getStores는 배열 응답도 처리한다", async () => {
      api.get.mockImplementation(ok({ data: [{ id: 5, code: "C", name: "N" }] }));

      const result = await getStores();

      expect(result).toEqual([{ id: 5, code: "C", name: "N" }]);
    });

    test("getStore는 단일 점포를 정규화한다", async () => {
      api.get.mockImplementation(ok({ store_id: 9, store_code: "S009" }));

      const result = await getStore(9);

      expect(api.get).toHaveBeenCalledWith("/admin/stores/9");
      expect(result.id).toBe(9);
      expect(result.code).toBe("S009");
    });

    test("createStore / updateStore도 정규화를 적용한다", async () => {
      api.post.mockImplementation(ok({ store_id: 1 }));
      api.patch.mockImplementation(ok({ store_id: 1 }));

      const created = await createStore({ store_name: "신규" });
      const updated = await updateStore(1, { store_name: "수정" });

      expect(api.post).toHaveBeenCalledWith("/admin/stores", {
        store_name: "신규",
      });
      expect(created.id).toBe(1);
      expect(updated.id).toBe(1);
    });
  });

  test("updateStoreStatus는 status를 body에 담아 PATCH 한다", async () => {
    api.patch.mockImplementation(ok({ store_id: 1, status: "ACTIVE" }));

    const result = await updateStoreStatus(1, "ACTIVE");

    expect(api.patch).toHaveBeenCalledWith("/admin/stores/1/status", {
      status: "ACTIVE",
    });
    expect(result.status).toBe("ACTIVE");
  });

  test("deleteStore는 DELETE 요청의 응답을 그대로 반환한다", async () => {
    const response = { status: 204 };
    api.delete.mockResolvedValue(response);

    const result = await deleteStore(1);

    expect(api.delete).toHaveBeenCalledWith("/admin/stores/1");
    expect(result).toBe(response);
  });

  test("resetStorePassword는 비밀번호 초기화 API를 호출한다", async () => {
    api.patch.mockImplementation(ok({ temp_password: "tmp" }));

    const result = await resetStorePassword(3);

    expect(api.patch).toHaveBeenCalledWith("/admin/stores/3/password/reset");
    expect(result).toEqual({ temp_password: "tmp" });
  });
});
