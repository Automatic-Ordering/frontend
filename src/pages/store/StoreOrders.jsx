import { useEffect, useMemo, useState } from "react";
import { ClipboardList, RefreshCw, ShoppingCart } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Loading,
  StatCard,
} from "../../components/ui";
import Pagination from "../../components/Pagination";
import { Header } from "../../components/layout";
import { getApiError } from "../../services/api";
import { getOrder, getOrders } from "../../services/orderService";

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "PENDING", label: "발주 대기" },
  { value: "ORDERED", label: "발주 확정" },
  { value: "COMPLETED", label: "입고 완료" },
  { value: "CANCELLED", label: "취소" },
];

const STATUS_BADGE_STYLES = {
  PENDING: { background: "#fef3c7", color: "#b45309" },
  ORDERED: { background: "#dbeafe", color: "#1d4ed8" },
  COMPLETED: { background: "#dcfce7", color: "#15803d" },
  CANCELLED: { background: "#f1f5f9", color: "#64748b" },
};

const STATUS_LABELS = Object.fromEntries(
  STATUS_OPTIONS.map(({ value, label }) => [value, label]),
);

const PAGE_SIZE = 20;

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("ko-KR") : "-";

export default function StoreOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const loadOrders = ({ status = statusFilter, targetPage = 1 } = {}) => {
    setLoading(true);
    setError("");
    getOrders({
      status: status || undefined,
      page: targetPage,
      limit: PAGE_SIZE,
    })
      .then((data) => {
        setOrders(data.items || []);
        setTotalCount(Number(data.total ?? 0));
        setTotalPages(Number(data.total_pages ?? 0));
        setPage(Number(data.page ?? targetPage));
      })
      .catch((err) =>
        setError(
          getApiError(err, "발주 이력을 불러오는 중 오류가 발생했습니다."),
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const pendingCount = useMemo(
    () => orders.filter((order) => order.order_status === "PENDING").length,
    [orders],
  );

  const handleToggleDetail = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setDetail(null);
      return;
    }
    setExpandedOrderId(orderId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await getOrder(orderId);
      setDetail(data);
    } catch (err) {
      setDetail({
        error: getApiError(err, "발주 상세를 불러오지 못했습니다."),
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSearch = () => {
    setExpandedOrderId(null);
    setDetail(null);
    loadOrders({ targetPage: 1 });
  };

  const handleReset = () => {
    setStatusFilter("");
    setExpandedOrderId(null);
    setDetail(null);
    loadOrders({ status: "", targetPage: 1 });
  };

  const handlePageChange = (targetPage) => {
    setExpandedOrderId(null);
    setDetail(null);
    loadOrders({ targetPage });
  };

  return (
    <>
      <Header
        title="발주 이력"
        description="확정한 발주의 처리 상태를 조회합니다."
      />

      <div className="stats-grid">
        <StatCard
          label="총 발주 수"
          value={totalCount.toLocaleString()}
          icon={ClipboardList}
          tone="blue"
        />
        <StatCard
          label="발주 대기 (현재 페이지)"
          value={pendingCount}
          icon={ShoppingCart}
          tone="orange"
        />
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <label className="field">
            <span>발주 상태</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" onClick={handleSearch} loading={loading}>
            조회
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={loading}
          >
            초기화
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => loadOrders()}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            새로고침
          </Button>
        </div>
      </div>

      <Card className="table-card">
        {loading ? (
          <Loading label="발주 이력을 불러오는 중..." />
        ) : error ? (
          <div style={{ padding: "24px" }}>
            <div className="alert alert-error">{error}</div>
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSearch}
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : orders.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>발주 번호</th>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th style={{ textAlign: "right" }}>발주 수량</th>
                  <th style={{ textAlign: "center" }}>상태</th>
                  <th>발주일시</th>
                  <th>상태 변경일시</th>
                  <th style={{ textAlign: "center" }}>상세</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderRow
                    key={order.order_id}
                    order={order}
                    expanded={expandedOrderId === order.order_id}
                    detail={expandedOrderId === order.order_id ? detail : null}
                    detailLoading={
                      expandedOrderId === order.order_id ? detailLoading : false
                    }
                    onToggle={handleToggleDetail}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>
            {statusFilter
              ? `해당 상태의 발주 내역이 없습니다.`
              : "발주 내역이 없습니다. 자동 발주 화면에서 발주를 확정해 보세요."}
          </EmptyState>
        )}
        {!loading && !error && orders.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalCount}
            onChange={handlePageChange}
            disabled={loading}
          />
        )}
      </Card>
    </>
  );
}

function OrderRow({ order, expanded, detail, detailLoading, onToggle }) {
  return (
    <>
      <tr key={order.order_id}>
        <td className="muted" style={{ fontFamily: "monospace" }}>
          #{order.order_id}
        </td>
        <td>
          <strong>{order.product_name ?? "-"}</strong>
        </td>
        <td>
          <span
            className="badge"
            style={{ background: "#f1f5f9", color: "#334155" }}
          >
            {order.category ?? "-"}
          </span>
        </td>
        <td style={{ textAlign: "right", fontWeight: 600 }}>
          {Number(order.order_quantity).toLocaleString()}
        </td>
        <td style={{ textAlign: "center" }}>
          <span
            className="badge"
            style={STATUS_BADGE_STYLES[order.order_status] || {}}
          >
            {STATUS_LABELS[order.order_status] || order.order_status}
          </span>
        </td>
        <td className="muted">{formatDateTime(order.created_at)}</td>
        <td className="muted">{formatDateTime(order.updated_at)}</td>
        <td style={{ textAlign: "center" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onToggle(order.order_id)}
          >
            {expanded ? "닫기" : "상세"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr key={`${order.order_id}-detail`}>
          <td colSpan={8} style={{ background: "#f8fafc" }}>
            {detailLoading ? (
              <Loading label="상세 내역을 불러오는 중..." />
            ) : detail?.error ? (
              <div className="alert alert-error">{detail.error}</div>
            ) : detail ? (
              <div
                style={{
                  padding: "8px 4px",
                  display: "grid",
                  gap: "6px",
                  fontSize: "13px",
                }}
              >
                <div>
                  <strong>발주 번호</strong>: #{detail.order_id}
                </div>
                <div>
                  <strong>상품</strong>: {detail.product_name ?? "-"} (
                  {detail.category ?? "-"})
                </div>
                <div>
                  <strong>발주 수량</strong>:{" "}
                  {Number(detail.order_quantity).toLocaleString()}개
                </div>
                <div>
                  <strong>발주 상태</strong>:{" "}
                  <span
                    className="badge"
                    style={STATUS_BADGE_STYLES[detail.order_status] || {}}
                  >
                    {STATUS_LABELS[detail.order_status] || detail.order_status}
                  </span>
                </div>
                <div>
                  <strong>발주일시</strong>: {formatDateTime(detail.created_at)}
                </div>
                <div>
                  <strong>상태 변경일시</strong>:{" "}
                  {formatDateTime(detail.updated_at)}
                </div>
              </div>
            ) : null}
          </td>
        </tr>
      )}
    </>
  );
}
