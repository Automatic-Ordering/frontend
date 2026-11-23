export const SPEC_STATUSES = [
  "DRAFT",
  "PENDING_RECEIPT",
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "ORDERED",
  "RECEIVED",
  "CANCELLED",
];

export const SPEC_STATUS_LABELS = {
  DRAFT: "임시 저장",
  PENDING_RECEIPT: "입고 대기",
  REQUESTED: "승인 대기",
  APPROVED: "승인 완료",
  REJECTED: "반려",
  ORDERED: "발주서 발행",
  RECEIVED: "입고 완료",
  CANCELLED: "취소",
};

export const SPEC_STATUS_BADGE_STYLES = {
  DRAFT: { background: "#f1f5f9", color: "#475569" },
  PENDING_RECEIPT: { background: "#fef3c7", color: "#b45309" },
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

export const formatAmount = (value) =>
  `${Number(value ?? 0).toLocaleString("ko-KR")}원`;

export const formatDateTime = (value) => {
  let raw = value;

  if (typeof value === "object" && value !== null && !(value instanceof Date)) {
    raw =
      value.created_at ||
      value.createdAt ||
      value.order_date ||
      value.ordered_at ||
      value.date;
  }

  if (!raw) return "-";

  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    const [year, month, day] = raw.trim().split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("ko-KR");
  }

  const parsed = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleString("ko-KR");
};