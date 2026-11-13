import { useEffect, useMemo, useState } from "react";
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
import { confirmOrders, getRecommendations } from "../../services/orderService";

const WARNING_LABELS = {
  NO_SALES_DATA: "판매 데이터 없음",
  INSUFFICIENT_SALES_DATA: "판매 데이터 부족",
  INSUFFICIENT_MOVING_AVERAGE_WINDOW: "7일 미만 판매 데이터",
  NO_SAME_WEEKDAY_DATA: "동요일 판매 데이터 없음",
};

const PAGE_SIZE = 20;

export default function StoreOrderRecommendations() {
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

  const handleSearch = () => {
    setFormError("");
    setSuccess("");
    loadRecommendations({ targetPage: 1 });
  };

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
        `총 ${pendingItems.length}개 상품 / ${totalQuantity.toLocaleString()}개 수량을 발주 확정하시겠습니까?`,
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const created = await confirmOrders(pendingItems);
      const confirmedIds = new Set(
        (Array.isArray(created) ? created : []).map((order) =>
          Number(order.product_id),
        ),
      );
      setQuantities((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(
            ([productId]) => !confirmedIds.has(Number(productId)),
          ),
        ),
      );
      setSuccess(
        `${created.length}건의 발주가 등록되었습니다. (발주 대기 상태)`,
      );
      loadRecommendations({ targetPage: page });
    } catch (err) {
      setFormError(getApiError(err, "발주 확정 중 오류가 발생했습니다."));
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
          value={recommendations.filter((item) => item.needs_order).length}
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
            발주 확정
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
            <table>
              <thead>
                <tr>
                  <th>상품 코드</th>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th style={{ textAlign: "right" }}>현재 재고</th>
                  <th style={{ textAlign: "right" }}>예상 일일 판매량</th>
                  <th style={{ textAlign: "right" }}>안전 재고</th>
                  <th style={{ textAlign: "right" }}>목표 재고</th>
                  <th style={{ textAlign: "right" }}>추천 발주량</th>
                  <th style={{ textAlign: "center" }}>발주 수량</th>
                  <th style={{ textAlign: "center" }}>데이터 상태</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((item) => {
                  const hasWarning = item.data_warning.length > 0;
                  return (
                    <tr key={item.product_id}>
                      <td className="muted" style={{ fontFamily: "monospace" }}>
                        #{item.product_id}
                      </td>
                      <td>
                        <strong>{item.product_name}</strong>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{ background: "#f1f5f9", color: "#334155" }}
                        >
                          {item.category || "-"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {Number(item.current_stock).toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {Number(item.predicted_demand).toFixed(2)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {Number(item.applied_safety_stock).toLocaleString()}
                        {item.safety_stock_source === "CONFIGURED" && (
                          <small className="muted" style={{ display: "block" }}>
                            (설정값)
                          </small>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {Number(item.target_stock).toLocaleString()}
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
