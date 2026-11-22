import { useEffect, useMemo, useState } from "react";
import { Button, Card, Loading } from "../../components/ui";
import { Header } from "../../components/layout";
import { getApiError } from "../../services/api";
import {
  getStoreProducts,
  patchProductSafetyStock,
} from "../../services/productService";
import { getRecommendations } from "../../services/orderService";

const PAGE_SIZE = 10;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeInteger = (value) =>
  Math.max(0, Math.floor(Number(value) || 0));

const fetchAllRecommendations = async () => {
  const firstPage = await getRecommendations({ page: 1, limit: 100 });
  const totalPages = Number(firstPage.total_pages ?? 1);
  const remainingPages =
    totalPages > 1
      ? await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            getRecommendations({ page: index + 2, limit: 100 }),
          ),
        )
      : [];
  return [
    ...(firstPage.items ?? []),
    ...remainingPages.flatMap((page) => page.items ?? []),
  ];
};

export default function StoreOrderSettings() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkSafetyStock, setBulkSafetyStock] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const [productData, recommendationData] = await Promise.all([
        getStoreProducts(),
        fetchAllRecommendations(),
      ]);

      const recommendationsById = new Map(
        recommendationData.map((item) => [
          String(item.product_id),
          item,
        ]),
      );

      setProducts(
        (productData ?? [])
          .filter((item) => item.is_registered)
          .map((product) => {
            const recommendation =
              recommendationsById.get(String(product.product_id)) ?? {};
            return {
              product_id: product.product_id,
              category: recommendation.category ?? product.category ?? "미분류",
              product_name:
                recommendation.product_name ?? product.product_name,
              current_stock: toNumber(
                recommendation.current_stock ?? product.current_stock,
              ),
              safety_stock: toNumber(
                recommendation.safety_stock ?? product.safety_stock,
              ),
              recent_7d_sales: toNumber(
                recommendation.recent_7d_sales ??
                  recommendation.recent_sales_quantity ??
                  recommendation.recent_sales ??
                  recommendation.weekly_sales_quantity,
              ),
            };
          }),
      );
    } catch (loadError) {
      setError(
        getApiError(loadError, "발주 설정 데이터를 불러오지 못했습니다."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadOnce = async () => {
      try {
        const [productData, recommendationData] = await Promise.all([
          getStoreProducts(),
          fetchAllRecommendations(),
        ]);

        if (cancelled) return;

        const recommendationsById = new Map(
          recommendationData.map((item) => [
            String(item.product_id),
            item,
          ]),
        );

        setProducts(
          (productData ?? [])
            .filter((item) => item.is_registered)
            .map((product) => {
              const recommendation =
                recommendationsById.get(String(product.product_id)) ?? {};
              return {
                product_id: product.product_id,
                category:
                  recommendation.category ?? product.category ?? "미분류",
                product_name:
                  recommendation.product_name ?? product.product_name,
                current_stock: toNumber(
                  recommendation.current_stock ?? product.current_stock,
                ),
                safety_stock: toNumber(
                  recommendation.safety_stock ?? product.safety_stock,
                ),
                recent_7d_sales: toNumber(
                  recommendation.recent_7d_sales ??
                    recommendation.recent_sales_quantity ??
                    recommendation.recent_sales ??
                    recommendation.weekly_sales_quantity,
                ),
              };
            }),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            getApiError(loadError, "발주 설정 데이터를 불러오지 못했습니다."),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOnce();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const categories = useMemo(
    () => [
      "ALL",
      ...Array.from(
        new Set(
          products
            .map((item) => item.category)
            .filter((category) => category && category !== "미분류"),
        ),
      ),
    ],
    [products],
  );

const filteredProducts = useMemo(
    () =>
      selectedCategory === "ALL"
        ? products
        : products.filter((item) => item.category === selectedCategory),
      [products, selectedCategory],
  );

  const pagedProducts = useMemo(
    () => filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredProducts, currentPage],
  );

  const applyBulkSafetyStock = () => {
    const normalizedValue = normalizeInteger(bulkSafetyStock);
    setBulkSafetyStock(normalizedValue);
    setProducts((previous) =>
      previous.map((product) =>
        selectedCategory === "ALL" ||
        product.category === selectedCategory
          ? { ...product, safety_stock: normalizedValue }
          : product,
      ),
    );
  };

  const updateSafetyStock = (productId, value) => {
    const normalizedValue = normalizeInteger(value);
    setProducts((previous) =>
      previous.map((product) =>
        String(product.product_id) === String(productId)
          ? { ...product, safety_stock: normalizedValue }
          : product,
      ),
    );
  };

  const saveSafetyStocks = async () => {
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await Promise.all(
        products.map((product) =>
          patchProductSafetyStock(
            product.product_id,
            normalizeInteger(product.safety_stock),
          ),
        ),
      );
      setMessage("안전 재고가 저장되었습니다.");
      await loadProducts();
    } catch (saveError) {
      setError(getApiError(saveError, "안전 재고 저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header
        title="발주 설정"
        description="상품별 안전 재고 수량을 관리합니다."
      />

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}
      {message && (
        <div className="alert alert-success" style={{ marginBottom: "16px" }}>
          {message}
        </div>
      )}

      <Card className="form-card" style={{ maxWidth: "100%", marginBottom: "16px" }}>
        <div
          className="toolbar"
          style={{ margin: 0, alignItems: "flex-end" }}
        >
          <div className="toolbar-left" style={{ alignItems: "center" }}>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              style={{
                height: "40px",
                minWidth: "180px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "0 10px",
              }}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "ALL" ? "전체" : category}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              value={bulkSafetyStock}
              onChange={(event) =>
                setBulkSafetyStock(
                  normalizeInteger(event.target.value),
                )
              }
              style={{
                width: "110px",
                height: "40px",
                textAlign: "right",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "0 10px",
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={applyBulkSafetyStock}
              disabled={loading || saving}
            >
              카테고리 일괄 적용
            </Button>
          </div>
        </div>
      </Card>

      <Card className="table-card">
        {loading ? (
          <Loading label="발주 설정 데이터를 불러오는 중..." />
        ) : (
          <>
            <div
              className="toolbar"
              style={{ padding: "14px 20px 0", marginBottom: "12px" }}
            >
              <div className="toolbar-left" style={{ alignItems: "center" }}>
                {categories.map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant={selectedCategory === category ? "primary" : "secondary"}
                    className="btn-sm"
                    onClick={() => setSelectedCategory(category)}
                    disabled={saving}
                  >
                    {category === "ALL" ? "전체" : category}
                  </Button>
                ))}
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>카테고리</th>
                    <th>상품명</th>
                    <th style={{ textAlign: "right" }}>현재 재고</th>
                    <th style={{ textAlign: "right" }}>최근 7일 판매량</th>
                    <th style={{ textAlign: "right" }}>안전 재고</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProducts.map((product) => (
                    <tr key={product.product_id}>
                      <td>{product.category}</td>
                      <td><strong>{product.product_name}</strong></td>
                      <td style={{ textAlign: "right" }}>
                        {product.current_stock.toLocaleString()}개
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {product.recent_7d_sales.toLocaleString()}개
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={product.safety_stock}
                          onChange={(event) =>
                            updateSafetyStock(
                              product.product_id,
                              event.target.value,
                            )
                          }
                          disabled={saving}
                          style={{
                            width: "84px",
                            textAlign: "right",
                            padding: "7px 9px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "16px",
              }}
            >
              <div style={{ marginRight: "12px" }}>
                <span>
                  {filteredProducts.length > 0
                    ? `${(currentPage - 1) * PAGE_SIZE + 1}~${
                        Math.min(
                          filteredProducts.length,
                          currentPage * PAGE_SIZE,
                        )
                      }/${filteredProducts.length}`
                    : "0~0/0"}
                </span>
              </div>
              <button
                type="button"
                disabled={currentPage === 1 || saving}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                style={{
                  margin: "0 4px",
                  padding: "6px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  background: currentPage === 1 ? "#f9fafb" : "white",
                }}
              >
                이전
              </button>
              <div style={{ margin: "0 4px" }}>
                {Array.from(
                  { length: Math.ceil(filteredProducts.length / PAGE_SIZE) || 1 },
                  (_, i) => i + 1,
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    disabled={page === currentPage || saving}
                    style={{
                      margin: "0 2px",
                      padding: "6px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      background:
                        page === currentPage ? "#e2e8f0" : "white",
                      color: page === currentPage ? "white" : "black",
                    }}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={
                  currentPage >= Math.ceil(filteredProducts.length / PAGE_SIZE) ||
                  saving
                }
                onClick={() => setCurrentPage((prev) => prev + 1)}
                style={{
                  margin: "0 4px",
                  padding: "6px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  background:
                    currentPage >= Math.ceil(filteredProducts.length / PAGE_SIZE)
                      ? "#f9fafb"
                      : "white",
                }}
              >
                다음
              </button>
            </div>
          </>
        )}
      </Card>

      <div
        className="button-row"
        style={{ justifyContent: "flex-end", marginTop: "16px" }}
      >
        <Button
          type="button"
          onClick={saveSafetyStocks}
          loading={saving}
          disabled={loading || saving || !products.length}
        >
          안전 재고 저장
        </Button>
      </div>
    </>
  );
}
