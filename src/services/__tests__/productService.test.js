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
  getProducts,
  getProduct,
  getStoreProducts,
  getStoreProductsPage,
} from "../productService";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("services/productService", () => {
  test("getProducts는 배열 응답을 그대로 반환한다", async () => {
    api.get.mockResolvedValue({ data: [{ id: 1 }] });

    const result = await getProducts();

    expect(api.get).toHaveBeenCalledWith("/products");
    expect(result).toEqual([{ id: 1 }]);
  });

  test("getProducts는 data.data 객체에서 products 배열을 추출한다", async () => {
    api.get.mockResolvedValue({
      data: { data: { products: [{ id: 2 }] } },
    });

    const result = await getProducts();

    expect(result).toEqual([{ id: 2 }]);
  });

  test("getProducts는 products 키가 없으면 빈 배열을 반환한다", async () => {
    api.get.mockResolvedValue({ data: {} });

    expect(await getProducts()).toEqual([]);
  });

  test("getProduct는 productId를 경로에 포함한다", async () => {
    api.get.mockResolvedValue({ data: { data: { id: 7, name: "도시락" } } });

    const result = await getProduct(7);

    expect(api.get).toHaveBeenCalledWith("/products/7");
    expect(result).toEqual({ id: 7, name: "도시락" });
  });

  test("getStoreProducts는 배열 응답을 그대로 반환한다", async () => {
    api.get.mockResolvedValue({ data: [{ id: 1, stock: 5 }] });

    const result = await getStoreProducts();

    expect(api.get).toHaveBeenCalledWith("/store/products");
    expect(result).toEqual([{ id: 1, stock: 5 }]);
  });

  test("getStoreProducts는 객체 응답에서 products를 추출한다", async () => {
    api.get.mockResolvedValue({ data: { products: [{ id: 3 }] } });

    expect(await getStoreProducts()).toEqual([{ id: 3 }]);
  });

  test("getStoreProductsPage는 페이지네이션/검색 파라미터를 전송한다", async () => {
    api.get.mockResolvedValue({ data: { data: { items: [], total: 0 } } });

    await getStoreProductsPage({ page: 2, limit: 20, search: "김밥" });

    expect(api.get).toHaveBeenCalledWith("/store/products", {
      params: { page: 2, limit: 20, search: "김밥" },
    });
  });

  test("getStoreProductsPage는 빈 옵션을 params에 넣지 않는다", async () => {
    api.get.mockResolvedValue({ data: {} });

    await getStoreProductsPage();

    expect(api.get).toHaveBeenCalledWith("/store/products", {
      params: {},
    });
  });
});
