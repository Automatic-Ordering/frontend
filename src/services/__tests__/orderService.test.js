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
  getRecommendations,
  getRecommendationDetail,
  getOrders,
  getOrder,
  getOrderSettings,
  updateOrderSettings,
} from "../orderService";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("services/orderService", () => {
  test("getRecommendations는 설정된 파라미터만 전송한다", async () => {
    api.get.mockResolvedValue({ data: { data: { items: [] } } });

    await getRecommendations({ page: 2, limit: 20, search: "도시락" });

    expect(api.get).toHaveBeenCalledWith("/store/orders/recommendations", {
      params: { page: 2, limit: 20, search: "도시락" },
    });
  });

  test("getRecommendations는 빈 옵션을 params에 넣지 않는다", async () => {
    api.get.mockResolvedValue({ data: {} });

    await getRecommendations();

    expect(api.get).toHaveBeenCalledWith("/store/orders/recommendations", {
      params: {},
    });
  });

  test("getRecommendationDetail은 productId를 경로에 포함한다", async () => {
    api.get.mockResolvedValue({ data: { data: { product_id: 7 } } });

    const result = await getRecommendationDetail(7);

    expect(api.get).toHaveBeenCalledWith("/store/orders/recommendations/7");
    expect(result).toEqual({ product_id: 7 });
  });

  test("getOrders는 status/page/limit 파라미터를 전송한다", async () => {
    api.get.mockResolvedValue({ data: { data: { items: [], total: 0 } } });

    await getOrders({ status: "PENDING", page: 1, limit: 10 });

    expect(api.get).toHaveBeenCalledWith("/store/orders", {
      params: { status: "PENDING", page: 1, limit: 10 },
    });
  });

  test("getOrder는 orderId를 경로에 포함한다", async () => {
    api.get.mockResolvedValue({ data: { order_id: 3 } });

    const result = await getOrder(3);

    expect(api.get).toHaveBeenCalledWith("/store/orders/3");
    expect(result).toEqual({ order_id: 3 });
  });

  test("getOrderSettings는 GET /store/order-settings 를 호출한다", async () => {
    api.get.mockResolvedValue({ data: { data: { service_factor: 1.2 } } });

    const result = await getOrderSettings();

    expect(api.get).toHaveBeenCalledWith("/store/order-settings");
    expect(result).toEqual({ service_factor: 1.2 });
  });

  test("updateOrderSettings는 PATCH /store/order-settings 를 호출한다", async () => {
    api.patch.mockResolvedValue({ data: { data: { updated: true } } });
    const payload = { analysis_period_days: 14, service_factor: 1.5 };

    const result = await updateOrderSettings(payload);

    expect(api.patch).toHaveBeenCalledWith("/store/order-settings", payload);
    expect(result).toEqual({ updated: true });
  });
});
