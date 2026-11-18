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

import { getSales, createSale } from "../salesService";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("services/salesService", () => {
  test("getSales는 from/to/page/limit 파라미터를 전송한다", async () => {
    api.get.mockResolvedValue({ data: { data: { items: [], total: 0 } } });

    await getSales({ from: "2024-01-01", to: "2024-01-31", page: 1, limit: 20 });

    expect(api.get).toHaveBeenCalledWith("/store/sales", {
      params: { from: "2024-01-01", to: "2024-01-31", page: 1, limit: 20 },
    });
  });

  test("getSales는 배열 응답을 페이지네이션 형태로 정규화한다", async () => {
    const rows = [{ sale_id: 1 }, { sale_id: 2 }];
    api.get.mockResolvedValue({ data: rows });

    const result = await getSales();

    expect(result).toEqual({
      items: rows,
      total: 2,
      page: 1,
      limit: 2,
      total_pages: 1,
    });
  });

  test("getSales는 객체 응답을 그대로 반환한다", async () => {
    const pageData = { items: [], total: 0, page: 1, total_pages: 0 };
    api.get.mockResolvedValue({ data: pageData });

    expect(await getSales()).toBe(pageData);
  });

  test("createSale은 POST /store/sales 를 호출한다", async () => {
    api.post.mockResolvedValue({ data: { data: { sale_id: 1 } } });
    const payload = { product_id: 1, quantity: 2 };

    const result = await createSale(payload);

    expect(api.post).toHaveBeenCalledWith("/store/sales", payload);
    expect(result).toEqual({ sale_id: 1 });
  });
});
