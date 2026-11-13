import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardList,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Loading,
  SearchInput,
  StatCard,
} from "../../components/ui";
import Pagination from "../../components/Pagination";
import { Header } from "../../components/layout";
import { getApiError } from "../../services/api";
import { getRecommendations } from "../../services/orderService";
import { getProduct } from "../../services/productService";
import { createOrderSpec } from "../../services/orderSpecService";

const WARNING_LABELS = {
  NO_SALES_DATA: "판매 데이터 없음",
  INSUFFICIENT_SALES_DATA: "판매 데이터 부족",
  INSUFFICIENT_MOVING_AVERAGE_WINDOW: "7일 미만 판매 데이터",
  NO_SAME_WEEKDAY_DATA: "동요일 판매 데이터 없음",
};

const PAGE_SIZE = 20;

const calculateShortage = (targetStock, currentStock) => {
  const shortage = targetStock - currentStock;
  return shortage > 0 ? shortage : 0;
};
const handleSearch = () => {
  loadRecommendations({ targetPage: page });
};

const calculateUndelivered = () => "-";

export default function StoreOrderRecommendations() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [productDetails, setProductDetails] = useState({});

  const loadRecommendations = ({
    targetPage = 1,
    search = query.trim(),
  } = {}) => {
    setLoading(true);
    setError("");
    getRecommendations({
      page: targetPage,
      limit: PAGE_SIZE,
      search: search || undefined,
    })
      .then((data) => {
        const items = data.items || [];
        setRecommendations(items);
        setQuantities((prev) => {
          const next = { ...prev };
          items.forEach((item) => {
            const key = String(item.product_id);
            if (!(key in next)) next[key] = String(item.order_quantity);
          });
          return next;
        });
        setTotalCount(Number(data.total ?? 0));
        setTotalPages(Number(data.total_pages ?? 0));
        setPage(Number(data.page ?? targetPage));

        const productIdMap = items.reduce((map, item) => {
          map[String(item.product_id)] = item.product_id;
          return map;
        }, {});
        const productIds = Object.values(productIdMap);

        if (productIds.length > 0) {
          productIds.forEach((pid) => {
            getProduct(pid).then((prod) => {
              setProductDetails((prev) => ({
                ...prev,
                [String(pid)]: {
                  supplier: prod.supplier || "-",
                  unit: prod.unit || "-",
                },
              }));
            });
          });
        }
      })
      .catch((err) =>
        setError(
          getApiError(err, "발주 추천 목록을 불러오는 중 오류가 발생했습니다."),
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  useEffect(() => {
    const productIdMap = recommendations.reduce((map, item) => {
      map[String(item.product_id)] = item.product_id;
      return map;
    }, {});
    const productIds = Object.values(productIdMap);

    if (productIds.length > 0) {
      productIds.forEach((pid) => {
        getProduct(pid).then((prod) => {
          setProductDetails((prev) => ({
            ...prev,
            [String(pid)]: {
              supplier: prod.supplier || "-",
              unit: prod.unit || "-",
            },
          }));
        });
      });
    }
  }, [recommendations]);

  const pendingItems = useMemo(
    () =>
      Object.entries(quantities)
        .map(([productId, value]) => ({
          product_id: Number(productId),
          quantity: Number(value || 0),
        }))
        .filter((item) => item.quantity > 0),
    [quantities],
  );

  const totalRecommendedQuantity = useMemo(
    () =>
      recommendations.reduce(
        (sum, item) => sum + Number(item.order_quantity || 0),
        0,
      ),
    [recommendations],
  );

  const invalidQuantities = pendingItems.filter(
    (item) => !Number.isInteger(item.quantity) || item.quantity < 1,
  ).length;

  const handleQuantityChange = (productId, value) => {
    const digits = value.replace(/[^0-9]/g, "");
    setQuantities((prev) => ({ ...prev, [productId]: digits }));
  };

  const handleConfirm = async () => {
    setFormError("");
    setSuccess("");

    if (!pendingItems.length) {
      setFormError("발주할 상품이 없습니다. 수량을 1 이상으로 입력하세요.");
      return;
    }
    if (invalidQuantities > 0) {
      setFormError("발주 수량은 1 이상의 정수로 입력하세요.");
      return;
    }

    const totalQuantity = pendingItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    if (
      !window.confirm(
        `총 ${pendingItems.length}개 상품 / ${totalQuantity.toLocaleString()}개 수량으로 발주 명세서를 생성하시겠습니까?`,
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const spec = await createOrderSpec(pendingItems);
      navigate("/store/orders/specs", {
        state: {
          message: `발주 명세서(${spec.order_number})가 임시 저장되었습니다. 발주 내역 화면에서 검토 후 제출하세요.`,
        },
      });
    } catch (err) {
      setFormError(
        getApiError(err, "발주 명세서 생성 중 오류가 발생했습니다."),
      );
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <>
      <Header
        title="자동 발주"
        description="판매 데이터 기반 수요 예측으로 상품별 추천 발주량을 계산합니다."
      />

      <div className="stats-grid">
        <StatCard
          label="상품 수"
          value={totalCount.toLocaleString()}
          icon={ClipboardList}
          tone="blue"
        />
        <StatCard
          label={`발주 필요 상품 (현재 페이지)`}
          value={
            recommendations.filter((item) => item.needs_order).length
          }
          icon={ShoppingCart}
          tone="orange"
        />
        <StatCard
          label="총 추천 발주 수량 (현재 페이지)"
          value={totalRecommendedQuantity.toLocaleString()}
          icon={ShoppingCart}
          tone="purple"
        />
      </div>

      {success && (
        <div className="alert alert-success" style={{ marginBottom: "16px" }}>
          {success}
        </div>
      )}

      <div className="toolbar">
        <div className="toolbar-left">
          <SearchInput
            placeholder="상품명, 카테고리 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onSearch={handleSearch}
          />
          <Button
            type="button"
            variant="secondary"
            className="btn-sm"
            onClick={handleSearch}
            disabled={loading || submitting}
          >
            조회
          </Button>
        </div>
        <div className="toolbar-right">
          {pendingItems.length > 0 && (
            <span
              className="muted"
              style={{ fontSize: "12px", fontWeight: 600 }}
            >
              {pendingItems.length}개 상품 선택
            </span>
          )}
          <Button
            type="button"
            className="btn-sm"
            onClick={handleConfirm}
            loading={submitting}
            disabled={loading || !pendingItems.length}
          >
            발주 명세서 생성
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="btn-sm"
            onClick={() => loadRecommendations({ targetPage: page })}
            disabled={loading || submitting}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            새로고침
          </Button>
        </div>
      </div>

      {formError && (
        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
          {formError}
        </div>
      )}

      <Card className="table-card">
        {loading ? (
          <Loading label="발주 추천을 계산하는 중..." />
        ) : error ? (
          <div style={{ padding: "24px" }}>
            <div className="alert alert-error">{error}</div>
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => loadRecommendations({ targetPage: page })}
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : recommendations.length ? (
          <div className="table-wrap">
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    상품
                  </th>
                  <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    공급업체
                  </th>
                  <th className="text-right font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    3일 합계
                  </th>
                  <th className="text-right font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    일평균
                  </th>
                  <th className="text-right font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    예상(3일)
                  </th>
                  <th className="text-right font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    안전재고
                  </th>
                  <th className="text-right font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    목표재고
                  </th>
                  <th className="text-right font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    현재고
                  </th>
                  <th className="text-right font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    미입고
                  </th>
                  <th className="text-right font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    부족량
                  </th>
                  <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    단위
                  </th>
                  <th className="text-right font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    권장
                  </th>
                  <th className="text-center font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    발주수량
                  </th>
                  <th className="text-center font-medium text-xs text-muted-foreground uppercase tracking-wider">
                    데이터 상태
                  </th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((item) => {
                  const productId = String(item.product_id);
                  const pd = productDetails[productId] || {};
                  const hasWarning = item.data_warning.length > 0;
                  const shortage = calculateShortage(
                    Number(item.target_stock),
                    Number(item.current_stock),
                  );
                  const undelivered = calculateUndelivered();

                  return (
                    <tr key={item.product_id}>
                      <td className="align-middle">
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-xs muted">#{item.product_id}</div>
                      </td>
                      <td className="align-middle">
                        <span className="text-xs">{pd.supplier || "-"}</span>
                      </td>
                      <td className="align-middle text-right">
                        {Number(item.predicted_demand * 3).toLocaleString()}
                      </td>
                      <td className="align-middle text-right">
                        {Number(item.predicted_demand).toFixed(2)}
                      </td>
                      <td className="align-middle text-right">
                        {Number(item.predicted_demand * 3).toLocaleString()}
                      </td>
                      <td className="align-middle text-right">
                        {Number(item.applied_safety_stock).toLocaleString()}
                        {item.safety_stock_source === "CONFIGURED" && (
                          <small className="muted" style={{ display: "block" }}>
                            (설정값)
                          </small>
                        )}
                      </td>
                      <td className="align-middle text-right">
                        {Number(item.target_stock).toLocaleString()}
                      </td>
                      <td className="align-middle text-right">
                        {Number(item.current_stock).toLocaleString()}
                      </td>
                      <td className="align-middle text-right">
                        {undelivered}
                      </td>
                      <td className="align-middle text-right">
                        {Number(shortage).toLocaleString()}
                      </td>
                      <td className="align-middle">
                        <span className="text-xs">{pd.unit || "-"}</span>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 600,
                          color: item.needs_order ? "#b45309" : "#64748b",
                        }}
                      >
                        {item.needs_order
                          ? Number(item.order_quantity).toLocaleString()
                          : "발주 불필요"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            quantities[item.product_id] ??
                            String(item.order_quantity)
                          }
                          onChange={(event) =>
                            handleQuantityChange(
                              item.product_id,
                              event.target.value,
                            )
                          }
                          disabled={submitting}
                          style={{
                            width: "76px",
                            textAlign: "right",
                            padding: "7px 9px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                          }}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {hasWarning ? (
                          <span
                            className="badge"
                            style={{ background: "#fef3c7", color: "#b45309" }}
                            title={item.data_warning
                              .map((code) => WARNING_LABELS[code] || code)
                              .join(", ")}
                          >
                            <AlertTriangle size={12} /> 데이터 부족
                          </span>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>
            {query.trim()
              ? "검색 결과가 없습니다."
              : "발주 추천을 계산할 재고 상품이 없습니다."}
          </EmptyState>
        )}
      </Card>

      {!loading && !error && recommendations.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={totalCount}
          disabled={loading || submitting}
          onChange={(nextPage) => loadRecommendations({ targetPage: nextPage })}
        />
      )}
    </>
  );
}