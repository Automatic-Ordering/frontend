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
  getOrderSpecs,
  getPendingReceipts,
  getOrderSpecDetail,
  createOrderSpec,
  updateOrderSpecItems,
  submitOrderSpec,
  confirmOrderSpec,
  cancelOrderSpec,
  receiveOrderSpec,
  getAdminOrderSpecs,
  getAdminOrderSpecDetail,
} from "../orderSpecService";

beforeEach(() => {
  jest.clearAllMocks();
});

const ok = (data) => jest.fn(() => Promise.resolve({ data }));

describe("services/orderSpecService", () => {
  test("getOrderSpecs는 status/page/limit 파라미터를 전송한다", async () => {
    api.get.mockImplementation(ok({ items: [] }));

    await getOrderSpecs({ status: "DRAFT", page: 2, limit: 10 });

    expect(api.get).toHaveBeenCalledWith("/store/orders/specs", {
      params: { status: "DRAFT", page: 2, limit: 10 },
    });
  });

  test("getPendingReceipts는 page/limit 파라미터를 전송한다", async () => {
    api.get.mockImplementation(ok({ items: [] }));

    await getPendingReceipts({ page: 1, limit: 5 });

    expect(api.get).toHaveBeenCalledWith(
      "/store/orders/specs/pending-receipts",
      { params: { page: 1, limit: 5 } },
    );
  });

  test("getOrderSpecDetail은 specId를 경로에 포함한다", async () => {
    api.get.mockImplementation(ok({ spec_id: 9 }));

    const result = await getOrderSpecDetail(9);

    expect(api.get).toHaveBeenCalledWith("/store/orders/specs/9");
    expect(result).toEqual({ spec_id: 9 });
  });

  test("createOrderSpec은 items를 body에 담아 POST 한다", async () => {
    api.post.mockImplementation(ok({ spec_id: 1 }));
    const items = [{ product_id: 1, quantity: 3 }];

    const result = await createOrderSpec(items);

    expect(api.post).toHaveBeenCalledWith("/store/orders/specs", { items });
    expect(result).toEqual({ spec_id: 1 });
  });

  test("createOrderSpec은 items 생략 시 빈 body로 POST 한다 (자동 추천 사용)", async () => {
    api.post.mockImplementation(ok({}));

    await createOrderSpec();

    expect(api.post).toHaveBeenCalledWith("/store/orders/specs", {});
  });

  test("updateOrderSpecItems는 PATCH /items 로 전체 교체한다", async () => {
    api.patch.mockImplementation(ok({}));
    const items = [{ product_id: 2, quantity: 5 }];

    await updateOrderSpecItems(4, items);

    expect(api.patch).toHaveBeenCalledWith("/store/orders/specs/4/items", {
      items,
    });
  });

  test.each([
    ["submitOrderSpec", submitOrderSpec, "/submit"],
    ["confirmOrderSpec", confirmOrderSpec, "/confirm"],
    ["cancelOrderSpec", cancelOrderSpec, "/cancel"],
  ])("%s는 POST /specs/:id%s 를 호출한다", async (_name, fn, suffix) => {
    api.post.mockImplementation(ok({ done: true }));

    const result = await fn(12);

    expect(api.post).toHaveBeenCalledWith(`/store/orders/specs/12${suffix}`);
    expect(result).toEqual({ done: true });
  });

  test("receiveOrderSpec은 입고 수량을 body에 담아 POST 한다", async () => {
    api.post.mockImplementation(ok({ comparison: [] }));
    const items = [{ product_id: 1, received_quantity: 10 }];

    const result = await receiveOrderSpec(8, items);

    expect(api.post).toHaveBeenCalledWith("/store/orders/specs/8/receipt", {
      items,
    });
    expect(result).toEqual({ comparison: [] });
  });

  test("getAdminOrderSpecs는 store_id/status/page/limit를 전송한다", async () => {
    api.get.mockImplementation(ok({ items: [] }));

    await getAdminOrderSpecs({ storeId: 3, status: "REQUESTED", page: 1, limit: 20 });

    expect(api.get).toHaveBeenCalledWith("/admin/orders/specs", {
      params: { store_id: 3, status: "REQUESTED", page: 1, limit: 20 },
    });
  });

  test("getAdminOrderSpecDetail은 본사 상세 경로를 호출한다", async () => {
    api.get.mockImplementation(ok({ spec_id: 5 }));

    const result = await getAdminOrderSpecDetail(5);

    expect(api.get).toHaveBeenCalledWith("/admin/orders/specs/5");
    expect(result).toEqual({ spec_id: 5 });
  });
});
