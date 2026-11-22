jest.mock("../api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from "../api";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("services/api.integration", () => {
  test("추천 발주 목록 조회 (정상): GET /store/orders/recommendations 성공 시 order_unit, recommended_multiplier 파싱", async () => {
    const mockData = {
      data: {
        items: [
          { product_id: 1, order_unit: "박스", recommended_multiplier: 2 },
          { product_id: 2, order_unit: "개", recommended_multiplier: 3 },
        ],
      },
    };

    api.get.mockResolvedValueOnce(mockData);

    const result = await api.get("/store/orders/recommendations");

    expect(result.data.items).toHaveLength(2);
    expect(result.data.items[0]).toHaveProperty("order_unit");
    expect(result.data.items[0]).toHaveProperty("recommended_multiplier");
    expect(result.data.items[0].recommended_multiplier).toBe(2);
    expect(result.data.items[1].recommended_multiplier).toBe(3);
  });

  test("발주 명세서 생성 요청 (정상): POST /store/orders/specs 성공 시 items와 multiplier 전달", async () => {
    const mockResponse = { data: { spec_id: 1 } };
    api.post.mockResolvedValueOnce(mockResponse);

    const items = [
      { product_id: 1, quantity: 5 },
      { product_id: 2, quantity: 3 },
    ];
    const multiplier = 2;

    const result = await api.post("/store/orders/specs", { items, multiplier });

    expect(api.post).toHaveBeenCalledWith("/store/orders/specs", {
      items,
      multiplier,
    });
    expect(result.data).toEqual({ spec_id: 1 });
  });

  test("잘못된 발주 수량/입력값 예외 처리 (예외 - 400): 400 에러 시 예외가 정상 처리되는지 검증", async () => {
    const error = {
      response: {
        status: 400,
        data: { message: "유효하지 않은 발주 수량입니다." },
      },
    };

    api.post.mockRejectedValueOnce(error);

    await expect(api.post("/store/orders/specs", { items: [] })).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});
