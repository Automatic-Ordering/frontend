import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, ShoppingCart } from "lucide-react";
import { Button, Card, Loading, StatCard } from "../../components/ui";
import Pagination from "../../components/Pagination";
import { Header } from "../../components/layout";
import { formatAmount } from "../../components/orderSpec";
import { getApiError } from "../../services/api";
import { getRecommendations } from "../../services/orderService";
import { getStoreProducts } from "../../services/productService";
import { createOrderSpec } from "../../services/orderSpecService";

const PAGE_SIZE = 20;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeInteger = (value) =>
  Math.max(0, Math.floor(Number(value) || 0));

const getRecentSales = (item) =>
  toNumber(
    item.recent_7d_sales ??
      item.recent_sales_quantity ??
      item.recent_sales ??
      item.weekly_sales_quantity,
  );

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

export default function StoreOrderSpecCreate() {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
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
        const registeredProducts = (productData ?? []).filter(
          (item) => item.is_registered,
        );

        setOrderItems(
          registeredProducts.map((product) => {
            const recommendation =
              recommendationsById.get(String(product.product_id)) ?? {};
            const currentStock = toNumber(
              recommendation.current_stock ?? product.current_stock,
            );
            const safetyStock = toNumber(
              recommendation.safety_stock ?? product.safety_stock,
            );
            const recentSales = getRecentSales(recommendation) || getRecentSales(product);
            const recommendedQuantity = Math.max(
              0,
              recentSales + safetyStock - currentStock,
            );

            return {
              product_id: product.product_id,
              category: recommendation.category ?? product.category ?? "미분류",
              product_name:
                recommendation.product_name ?? product.product_name,
              price: toNumber(recommendation.price ?? product.price),
              current_stock: currentStock,
              safety_stock: safetyStock,
              recent_7d_sales: recentSales,
              recommended_quantity: recommendedQuantity,
              quantity: recommendedQuantity,
            };
          }),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            getApiError(loadError, "발주 화면 데이터를 불러오지 못했습니다."),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => [
      "ALL",
      ...Array.from(
        new Set(
          orderItems
            .map((item) => item.category)
            .filter((category) => category && category !== "미분류"),
        ),
      ),
    ],
    [orderItems],
  );

  const filteredItems = useMemo(
    () =>
      selectedCategory === "ALL"
        ? orderItems
        : orderItems.filter((item) => item.category === selectedCategory),
    [orderItems, selectedCategory],
  );

  const paginatedItems = useMemo(() => {
    const filteredPageCount = Math.max(
      1,
      Math.ceil(filteredItems.length / PAGE_SIZE),
    );
    const filteredCurrentPage = Math.min(page, filteredPageCount);
    return filteredItems.slice(
      (filteredCurrentPage - 1) * PAGE_SIZE,
      filteredCurrentPage * PAGE_SIZE,
    );
  }, [filteredItems, page]);

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));

  const pendingItems = useMemo(
    () =>
      orderItems.filter(
        (item) => Number(item.quantity) > 0,
      ),
    [orderItems],
  );
  const totalQuantity = useMemo(
    () =>
      pendingItems.reduce(
        (sum, item) => sum + Number(item.quantity),
        0,
      ),
    [pendingItems],
  );
  const totalAmount = useMemo(
    () =>
      pendingItems.reduce(
        (sum, item) =>
          sum + Number(item.quantity) * Number(item.price || 0),
        0,
      ),
    [pendingItems],
  );

  const updateQuantity = (productId, value) => {
    const normalizedValue = normalizeInteger(value);
    setOrderItems((previous) =>
      previous.map((item) =>
        String(item.product_id) === String(productId)
          ? { ...item, quantity: normalizedValue }
          : item,
      ),
    );
  };

  const handleCreate = async () => {
    setError("");

    const invalidItems = pendingItems.filter(
      (item) =>
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1,
    );
    if (!pendingItems.length) {
      setError("발주할 상품이 없습니다.");
      return;
    }
    if (invalidItems.length) {
      setError("발주 수량은 1 이상의 정수로 입력하세요.");
      return;
    }
    if (
      !window.confirm(
        `총 ${pendingItems.length}개 상품으로 발주 명세서를 생성하시겠습니까?`,
      )
    ) {
      return;
    }

    setCreating(true);
    try {
      const spec = await createOrderSpec(
        pendingItems.map((item) => ({
          product_id: Number(item.product_id),
          quantity: normalizeInteger(item.quantity),
        })),
      );
      navigate("/store/orders/specs", {
        state: {
          message: `발주 명세서(${spec.order_number})가 DRAFT 상태로 생성되었습니다.`,
        },
      });
    } catch (createError) {
      setError(
        getApiError(createError, "발주 명세서 생성 중 오류가 발생했습니다."),
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Header
        title="발주 명세서 작성"
        description="전체 상품의 재고와 권장 발주량을 확인하고 발주 수량을 입력합니다."
      />

      <div className="stats-grid">
        <StatCard
          label="발주 품목"
          value={pendingItems.length.toLocaleString()}
          icon={ClipboardList}
          tone="blue"
        />
        <StatCard
          label="총 발주 수량"
          value={totalQuantity.toLocaleString()}
          icon={ShoppingCart}
          tone="orange"
        />
        <StatCard
          label="총 발주 금액"
          value={formatAmount(totalAmount)}
          icon={ShoppingCart}
          tone="purple"
        />
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <Card className="table-card">
        {loading ? (
          <Loading label="발주 데이터를 불러오는 중..." />
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
                    onClick={() => {
                      setSelectedCategory(category);
                      setPage(1);
                    }}
                    disabled={creating}
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
                    <th style={{ textAlign: "right" }}>안전 재고</th>
                    <th style={{ textAlign: "right" }}>최근 7일 판매량</th>
                    <th style={{ textAlign: "right" }}>추천 발주량</th>
                    <th style={{ textAlign: "center" }}>발주 수량</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr key={item.product_id}>
                      <td>{item.category}</td>
                      <td><strong>{item.product_name}</strong></td>
                      <td style={{ textAlign: "right" }}>
                        {item.current_stock.toLocaleString()}개
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {item.safety_stock.toLocaleString()}개
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {item.recent_7d_sales.toLocaleString()}개
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {item.recommended_quantity.toLocaleString()}개
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateQuantity(
                              item.product_id,
                              event.target.value,
                            )
                          }
                          disabled={creating}
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
          </>
        )}
      </Card>

      {!loading && totalPages > 0 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={filteredItems.length}
          disabled={creating}
          onChange={setPage}
        />
      )}

      <div
        className="button-row"
        style={{ justifyContent: "flex-end", marginTop: "16px" }}
      >
        <Button
          type="button"
          onClick={handleCreate}
          loading={creating}
          disabled={creating || !orderItems.length}
        >
          통합 발주 명세서 생성
        </Button>
      </div>
    </>
  );
}
