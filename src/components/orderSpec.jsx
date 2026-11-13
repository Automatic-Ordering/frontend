import { AlertTriangle } from "lucide-react";
import { Button, EmptyState, Loading } from "./ui";

export const SPEC_STATUSES = [
  "DRAFT",
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "ORDERED",
  "RECEIVED",
  "CANCELLED",
];

export const SPEC_STATUS_LABELS = {
  DRAFT: "임시 저장",
  REQUESTED: "승인 대기",
  APPROVED: "승인 완료",
  REJECTED: "반려",
  ORDERED: "발주서 발행",
  RECEIVED: "입고 완료",
  CANCELLED: "취소",
};

export const SPEC_STATUS_BADGE_STYLES = {
  DRAFT: { background: "#f1f5f9", color: "#475569" },
  REQUESTED: { background: "#fef3c7", color: "#b45309" },
  APPROVED: { background: "#dbeafe", color: "#1d4ed8" },
  REJECTED: { background: "#fee2e2", color: "#b91c1c" },
  ORDERED: { background: "#ede9fe", color: "#6d28d9" },
  RECEIVED: { background: "#dcfce7", color: "#15803d" },
  CANCELLED: { background: "#f1f5f9", color: "#64748b" },
};

export const SPEC_STATUS_OPTIONS = [
  { value: "", label: "전체" },
  ...SPEC_STATUSES.map((status) => ({
    value: status,
    label: SPEC_STATUS_LABELS[status],
  })),
];

export const SpecStatusBadge = ({ status }) => (
  <span className="badge" style={SPEC_STATUS_BADGE_STYLES[status] || {}}>
    {SPEC_STATUS_LABELS[status] || status}
  </span>
);

export const formatAmount = (value) =>
  `${Number(value ?? 0).toLocaleString("ko-KR")}원`;

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("ko-KR") : "-";

const numberInputStyle = {
  width: "84px",
  textAlign: "right",
  padding: "7px 9px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
};

/**
 * 발주 명세서 상품 목록 테이블
 * quantities를 넘기면 발주 수량을 입력받아 금액/합계를 다시 계산합니다.
 */
export function SpecItemsTable({
  items,
  quantities,
  onQuantityChange,
  quantityColumnLabel = "발주 수량",
  showReceived = false,
  disabled = false,
}) {
  const editable = Boolean(quantities);
  const rows = items ?? [];

  const rowQuantity = (item) =>
    editable ? Number(quantities?.[item.product_id] || 0) : item.order_quantity;

  const rowAmount = (item) => rowQuantity(item) * Number(item.unit_price || 0);
  const total = rows.reduce((sum, item) => sum + rowAmount(item), 0);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>상품 코드</th>
            <th>상품명</th>
            <th style={{ textAlign: "right" }}>단가</th>
            <th style={{ textAlign: "center" }}>{quantityColumnLabel}</th>
            <th style={{ textAlign: "right" }}>금액</th>
            {showReceived && <th style={{ textAlign: "right" }}>입고 수량</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((item) => (
              <tr key={item.item_id ?? item.product_id}>
                <td className="muted" style={{ fontFamily: "monospace" }}>
                  #{item.product_id}
                </td>
                <td>
                  <strong>{item.product_name}</strong>
                </td>
                <td style={{ textAlign: "right" }}>
                  {Number(item.unit_price).toLocaleString("ko-KR")}원
                </td>
                <td style={{ textAlign: "center" }}>
                  {editable ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={quantities[item.product_id] ?? ""}
                      onChange={(event) =>
                        onQuantityChange?.(
                          item.product_id,
                          event.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                      disabled={disabled}
                      style={numberInputStyle}
                    />
                  ) : (
                    <strong>
                      {Number(item.order_quantity).toLocaleString("ko-KR")}
                    </strong>
                  )}
                </td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>
                  {rowAmount(item).toLocaleString("ko-KR")}원
                </td>
                {showReceived && (
                  <td style={{ textAlign: "right" }}>
                    {item.received_quantity === null ||
                    item.received_quantity === undefined
                      ? "-"
                      : Number(item.received_quantity).toLocaleString("ko-KR")}
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={showReceived ? 6 : 5}>
                <EmptyState>발주 상품이 없습니다.</EmptyState>
              </td>
            </tr>
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={showReceived ? 4 : 4} className="muted">
                총 발주 금액
              </td>
              <td
                style={{ textAlign: "right", fontWeight: 700, fontSize: "15px" }}
              >
                {total.toLocaleString("ko-KR")}원
              </td>
              {showReceived && <td />}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

const summaryCellStyle = (extra = {}) => ({
  display: "grid",
  gap: "4px",
  ...extra,
});
const summaryLabelStyle = { color: "#64748b", fontSize: "12px" };

/** 발주 명세서 요약 정보 그리드 */
export function SpecSummaryGrid({ spec, showStore = true }) {
  if (!spec) return null;
  return (
    <div
      className="detail-grid"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
    >
      <div style={summaryCellStyle()}>
        <span style={summaryLabelStyle}>발주 번호</span>
        <strong style={{ fontFamily: "monospace" }}>{spec.order_number}</strong>
      </div>
      {showStore && (
        <div style={summaryCellStyle()}>
          <span style={summaryLabelStyle}>점포</span>
          <strong>{spec.store_name ?? "-"}</strong>
        </div>
      )}
      <div style={summaryCellStyle()}>
        <span style={summaryLabelStyle}>상태</span>
        <SpecStatusBadge status={spec.order_status} />
      </div>
      <div style={summaryCellStyle()}>
        <span style={summaryLabelStyle}>총 발주 금액</span>
        <strong style={{ fontSize: "16px" }}>
          {formatAmount(spec.total_amount)}
        </strong>
      </div>
      <div style={summaryCellStyle()}>
        <span style={summaryLabelStyle}>발주 요청 일시</span>
        <span>{formatDateTime(spec.request_date)}</span>
      </div>
      <div style={summaryCellStyle()}>
        <span style={summaryLabelStyle}>생성 일시</span>
        <span>{formatDateTime(spec.created_at)}</span>
      </div>
      {spec.approved_at && (
        <div style={summaryCellStyle()}>
          <span style={summaryLabelStyle}>승인 일시</span>
          <span>{formatDateTime(spec.approved_at)}</span>
        </div>
      )}
      {spec.rejected_at && (
        <div style={summaryCellStyle()}>
          <span style={summaryLabelStyle}>반려 일시</span>
          <span>{formatDateTime(spec.rejected_at)}</span>
        </div>
      )}
      {spec.issued_order_number && (
        <div style={summaryCellStyle()}>
          <span style={summaryLabelStyle}>발주서 번호</span>
          <strong style={{ fontFamily: "monospace" }}>
            {spec.issued_order_number}
          </strong>
          <span>{formatDateTime(spec.issued_at)}</span>
        </div>
      )}
      {spec.received_at && (
        <div style={summaryCellStyle()}>
          <span style={summaryLabelStyle}>입고 완료 일시</span>
          <span>{formatDateTime(spec.received_at)}</span>
        </div>
      )}
    </div>
  );
}

/** 상태 변경 이력 목록 */
export function SpecHistoryList({ histories }) {
  const rows = histories ?? [];
  if (!rows.length) {
    return <p className="muted">상태 변경 이력이 없습니다.</p>;
  }
  return (
    <div style={{ display: "grid", gap: "8px" }}>
      {rows.map((history) => (
        <div
          key={history.history_id}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            padding: "8px 10px",
            background: "#f8fafc",
            borderRadius: "8px",
          }}
        >
          <span>
            {history.from_status
              ? `${SPEC_STATUS_LABELS[history.from_status] || history.from_status} →`
              : "생성 →"}{" "}
            <strong>
              {SPEC_STATUS_LABELS[history.to_status] || history.to_status}
            </strong>
          </span>
          {history.note && <span className="muted">({history.note})</span>}
          <small className="muted" style={{ marginLeft: "auto" }}>
            {formatDateTime(history.created_at)}
          </small>
        </div>
      ))}
    </div>
  );
}

const sectionTitleStyle = {
  margin: "18px 0 10px",
  fontSize: "14px",
  fontWeight: 700,
};

/**
 * 발주 명세서 상세 모달 (요약 + 상품 목록 + 상태 이력)
 * spec / loading / error는 페이지에서 직접 조회해 전달합니다.
 * itemsContent를 넘기면 기본 상품 테이블 대신 해당 내용이 표시됩니다.
 */
export function SpecDetailModal({
  title = "발주 명세서 상세",
  spec,
  loading = false,
  error = "",
  onRetry,
  onClose,
  footer,
  showStore = true,
  banner,
  itemsContent,
  children,
}) {
  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          background: "#fff",
          borderRadius: "14px",
          maxWidth: "780px",
          width: "100%",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(15,23,42,0.25)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "20px 24px 14px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "17px" }}>{title}</h3>
          <Button
            type="button"
            variant="secondary"
            className="btn-sm"
            onClick={onClose}
          >
            닫기
          </Button>
        </div>
        <div style={{ padding: "18px 24px", overflowY: "auto" }}>
          {loading ? (
            <Loading label="발주 명세서를 불러오는 중..." />
          ) : error ? (
            <div style={{ padding: "16px 0" }}>
              <div className="alert alert-error">{error}</div>
              {onRetry && (
                <div style={{ marginTop: "12px", textAlign: "center" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onRetry}
                  >
                    다시 시도
                  </button>
                </div>
              )}
            </div>
          ) : spec ? (
            <>
              {banner}
              {spec.order_status === "REJECTED" && spec.rejection_reason && (
                <div
                  className="alert alert-error"
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <AlertTriangle size={16} />
                  <span>
                    <strong>반려 사유:</strong> {spec.rejection_reason}
                  </span>
                </div>
              )}
              <SpecSummaryGrid spec={spec} showStore={showStore} />
              <p style={sectionTitleStyle}>발주 상품</p>
              {itemsContent ?? (
                <SpecItemsTable
                  items={spec.items}
                  showReceived={Boolean(spec.received_at)}
                />
              )}
              <p style={sectionTitleStyle}>상태 변경 이력</p>
              <SpecHistoryList histories={spec.status_histories} />
              {children}
            </>
          ) : null}
        </div>
        {footer && spec && !loading && !error && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              gap: "10px",
              padding: "14px 24px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
