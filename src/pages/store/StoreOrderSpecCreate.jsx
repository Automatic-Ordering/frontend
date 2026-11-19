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

const getRecentSales = (item) =>
  item.recent_7d_sales ??
  item.recent_sales_quantity ??
  item.recent_sales ??
  item.weekly_sales_quantity ??
  null;

const calculateRecommendedQuantity = (recentSales, safetyStock, currentStock) =>
  Math.max(0, recentSales + safetyStock - currentStock);

const mergeProductData = (products, recommendations) => {
  const recommendationsById = new Map(
    recommendations.map((item) => [String(item.product_id), item]),
  );

  return products.map((product) => {
    const recommendation = recommendationsById.get(String(product.product_id)) ?? {};
    const recentSales = getRecentSales(recommendation) ?? getRecentSales(product);
    const safetyStock = toNumber(
      recommendation.safety_stock ?? product.safety_stock ?? 0,
    );
    const currentStock = toNumber(
      recommendation.current_stock ?? product.current_stock,
    );

    const recommendedQuantity = calculateRecommendedQuantity(
      recentSales,
      safetyStock,
      currentStock,
    );

    return {
      product_id: product.product_id,
      product_code: recommendation.product_code ?? product.product_code ?? product.code,
      product_name: recommendation.product_name ?? product.product_name,
      category: recommendation.category ?? product.category ?? "미분류",
      price: toNumber(recommendation.price ?? product.price),
      current_stock: currentStock,
      safety_stock: safetyStock,
      recent_7d_sales: recentSales,
      recommended_quantity: recommendedQuantity,
      quantity: String(recommendedQuantity),
    };
  });
};

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
  const [activeTab, setActiveTab] = useState("specs-create");

  useEffect(() => {
    let cancelled = false;
    const loadInitialData = async () => {
      const [productData, recommendations] = await Promise.all([
        getStoreProducts(),
        fetchAllRecommendations(),
      ]);

      if (!cancelled) {
        const registeredProducts = (productData || []).filter(
          (item) => item.is_registered,
        );
        setOrderItems(mergeProductData(registeredProducts, recommendations));
      }

      loadInitialData()
        .catch((err) => {
          if (cancelled) return;
          setError(getApiError(err, "발주 화면 데이터를 불러오지 못했습니다."));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    };

    loadInitialData();
  }, []);

  // 카테고리를 동적으로 추출 (하드코딩 금지)
  const allCategories = useMemo(() => {
    const categorySet = new Set();
    orderItems.forEach((item) => {
      if (item.category) categorySet.add(item.category);
    });
    return ["ALL", ...categorySet];
  }, [orderItems]);

  const filteredOrderItems = useMemo(
    () =>
      selectedCategory === "ALL"
        ? orderItems
        : orderItems.filter((item) => item.category === selectedCategory),
    [orderItems, selectedCategory],
  );

  const totalQuantity = useMemo(
    () =>
      filteredOrderItems
        .filter((item) => Number(item.quantity || 0) > 0)
        .reduce((sum, item) => sum + Number(item.quantity), 0),
    [filteredOrderItems],
  );
  const totalAmount = useMemo(
    () =>
      filteredOrderItems.reduce(
        (sum, item) =>
          sum +
          (Number(item.quantity || 0) > 0
            ? Number(item.quantity) * Number(item.price || 0)
            : 0),
        0,
      ),
    [filteredOrderItems],
  );
  const pendingItemCount = useMemo(
    () =>
      filteredOrderItems.filter(
        (item) => Number(item.quantity || 0) > 0,
      ).length,
    [filteredOrderItems],
  );

  const totalPages = Math.ceil(filteredOrderItems.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const paginatedOrderItems = useMemo(
    () =>
      filteredOrderItems.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [currentPage, filteredOrderItems],
  );

  const updateQuantity = (productId, value) => {
    setOrderItems((previous) =>
      previous.map((item) =>
        String(item.product_id) === String(productId)
          ? { ...item, quantity: String(value) }
          : item,
      ),
    );
  };

  const handleCreate = async () => {
    setError("");
    const pendingItems = filteredOrderItems.filter((item) => Number(item.quantity || 0) > 0);
    const invalid = pendingItems.filter((item) => {
      const quantity = Number(item.quantity);
      return !Number.isInteger(quantity) || quantity < 1;
    });
    if (!pendingItems.length) {
      setError("발주할 상품이 없습니다.");
      return;
    }
    if (invalid.length) {
      setError("발주 수량은 1 이상의 정수로 입력하세요.");
      return;
    }
    if (!window.confirm(`총 ${pendingItems.length}개 상품으로 발주 명세서를 생성하시겠습니까?`)) return;
    setCreating(true);
    try {
      const spec = await createOrderSpec(
        pendingItems.map((item) => ({
          product_id: item.product_id,
          quantity: Number(item.quantity),
        })),
      );
      navigate("/store/orders/specs", {
        state: {
          message: `발주 명세서(${spec.order_number})가 DRAFT 상태로 생성되었습니다.`,
        },
      });
    } catch (err) {
      setError(getApiError(err, "발주 명세서 생성 중 오류가 발생했습니다."));
    } finally {
      setCreating(false);
    }
  };

  const switchTab = (tabName) => {
    setActiveTab(tabName);
    if (tabName === "specs-create") {
      navigate("/store/orders/specs/new");
    } else if (tabName === "order-settings") {
      navigate("/store/order-settings");
    }
  };

  // Safety stock 변경 핸들러
  const handleSafetyStockChange = (productId, event) => {
    const newSafetyStock = Number(event.target.value);
    setOrderItems((previous) =>
      previous.map((item) => {
        if (String(item.product_id) === String(productId)) {
          return {
            ...item,
            safety_stock: newSafetyStock,
            recommended_quantity:
              calculateRecommendedQuantity(
                Number(item.recent_7d_sales || 0),
                newSafetyStock,
                Number(item.current_stock || 0),
              ),
            quantity: String(
              calculateRecommendedQuantity(
                Number(item.recent_7d_sales || 0),
                newSafetyStock,
                Number(item.current_stock || 0),
              )
            ),
          };
        }
        return item;
      }),
    );
  };

  return (
    <>
      {/* 상단 탭 메뉴 */}
      <Card className="tab-card">
        <div className="tab-header" style={{ padding: "12px 20px" }}>
          <div className="tab-btn-group">
            <Button
              type="button"
              variant={activeTab === "specs-create" ? "primary" : "secondary"}
              size="sm"
              onClick={() => switchTab("specs-create")}
              disabled={creating}
            >
              [발주 명세서 작성]
            </Button>
            <Button
              type="button"
              variant={activeTab === "order-settings" ? "primary" : "secondary"}
              size="sm"
              onClick={() => switchTab("order-settings")}
              disabled={creating}
            >
              [발주 설정]
            </Button>
          </div>
        </div>
      </Card>

      {/* 탭별 컨텐츠 - 발주 명세서 작성 */}
      {activeTab === "specs-create" && (
        <Card className="table-card">
          {loading ? (
            <Loading label="발주 데이터를 불러오는 중..." />
          ) : (
            <>
              <div className="toolbar" style={{ padding: "14px 20px 0", marginBottom: "12px" }}>
                <div className="toolbar-left">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory("ALL")}
                    disabled={creating}
                  >
                    전체
                  </Button>
                </div>
                <div className="toolbar-right">
                  {allCategories.map((category) => (
                    <Button
                      key={category}
                      type="button"
                      variant={selectedCategory === category ? "primary" : "secondary"}
                      size="sm"
                      className="mx-1"
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
                      <th style={{ textAlign: "right", fontWeight: 600 }}>추천 발주량</th>
                      <th style={{ textAlign: "center" }}>발주 수량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrderItems.map((item) => {
                      return (
                        <tr key={item.product_id}>
                          <td>{item.category}</td>
                          <td><strong>{item.product_name}</strong></td>
                          <td style={{ textAlign: "right" }}>
                            {item.current_stock.toLocaleString()}개
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.safety_stock}
                              onChange={(e) => handleSafetyStockChange(item.product_id, e)}
                              disabled={creating}
                              style={{
                                width: "84px",
                                textAlign: "right",
                                padding: "7px 9px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                              }}
                            />개
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {item.recent_7d_sales === null
                              ? "-"
                              : `${Number(item.recent_7d_sales).toLocaleString()}개`}
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
                              onChange={(event) => updateQuantity(item.product_id, event.target.value)}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}

      {!loading &&
        totalPages > 0 &&
        activeTab === "specs-create" && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            total={filteredOrderItems.length}
            disabled={creating}
            onChange={setPage}
          />
        )}

      <div className="button-row" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
        <Button
          type="button"
          onClick={handleCreate}
          loading={creating}
          disabled={creating || filteredOrderItems.length === 0}
        >
          통합 발주 명세서 생성
        </Button>
      </div>
    </>
  );
}
