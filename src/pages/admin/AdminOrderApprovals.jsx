import { useEffect, useMemo, useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Loading,
  StatCard,
} from "../../components/ui";
import Pagination from "../../components/Pagination";
import { Header } from "../../components/layout";
import {
  SPEC_STATUS_OPTIONS,
  SpecDetailModal,
  SpecStatusBadge,
  formatAmount,
} from "../../components/orderSpec";
import { getApiError } from "../../services/api";
import {
  approveOrderSpec,
  getAdminOrderSpecDetail,
  getAdminOrderSpecs,
  issueOrderSpec,
  rejectOrderSpec,
} from "../../services/orderSpecService";
import { getStores } from "../../services/storeService";

const PAGE_SIZE = 20;

export default function AdminOrderApprovals() {
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stores, setStores] = useState([]);
  const [storeFilter, setStoreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [rowBusyId, setRowBusyId] = useState(null);

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [actionError, setActionError] = useState("");
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const loadStores = () => {
    getStores()
      .then((data) => setStores(data || []))
      .catch(() => setStores([]));
  };

  const loadSpecs = ({
    storeId = storeFilter,
    status = statusFilter,
    targetPage = 1,
  } = {}) => {
    setLoading(true);
    setError("");
    getAdminOrderSpecs({
      storeId: storeId || undefined,
      status: status || undefined,
      page: targetPage,
      limit: PAGE_SIZE,
    })
      .then((data) => {
        setSpecs(data.items || []);
        setTotalCount(Number(data.total ?? 0));
        setTotalPages(Number(data.total_pages ?? 0));
        setPage(Number(data.page ?? targetPage));
      })
      .catch((err) =>
        setError(
          getApiError(err, "발주 요청 목록을 불러오는 중 오류가 발생했습니다."),
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSpecs();
    loadStores();
  }, []);

  const loadDetail = async (specId) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      const data = await getAdminOrderSpecDetail(specId);
      setDetail(data);
    } catch (err) {
      setDetailError(
        getApiError(err, "발주 명세서를 불러오는 중 오류가 발생했습니다."),
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = async (specId) => {
    setDetailId(specId);
    setDetail(null);
    setActionError("");
    setRejectMode(false);
    setRejectReason("");
    setActionLoading("");
    await loadDetail(specId);
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
    setDetailError("");
    setActionLoading("");
    setActionError("");
    setRejectMode(false);
    setRejectReason("");
  };

  const requestedCount = useMemo(
    () => specs.filter((spec) => spec.order_status === "REQUESTED").length,
    [specs],
  );

  const refreshList = () => loadSpecs({ targetPage: page });

  const handleApprove = async (specId) => {
    const spec =
      detail?.order_spec_id === specId
        ? detail
        : specs.find((item) => item.order_spec_id === specId);
    if (
      !window.confirm(
        `발주를 승인하시겠습니까?\n발주 번호: ${spec?.order_number ?? specId}\n총 발주 금액: ${formatAmount(spec?.total_amount)}`,
      )
    ) {
      return;
    }
    const isModalAction = detailId === specId;
    setActionLoading(isModalAction ? "approve" : "");
    setRowBusyId(isModalAction ? null : specId);
    try {
      await approveOrderSpec(specId);
      if (isModalAction) await loadDetail(specId);
      refreshList();
    } catch (err) {
      const message = getApiError(err, "발주 승인 중 오류가 발생했습니다.");
      if (isModalAction) setActionError(message);
      else setError(message);
    } finally {
      setActionLoading("");
      setRowBusyId(null);
    }
  };

  const handleIssue = async () => {
    if (
      !window.confirm(
        `발주서를 발행하시겠습니까?\n발주 번호: ${detail?.order_number ?? detailId}`,
      )
    ) {
      return;
    }
    setActionLoading("issue");
    try {
      await issueOrderSpec(detail.order_spec_id);
      await loadDetail(detail.order_spec_id);
      refreshList();
    } catch (err) {
      setActionError(getApiError(err, "발주서 발행 중 오류가 발생했습니다."));
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async () => {
    setActionError("");
    const reason = rejectReason.trim();
    if (!reason) {
      setActionError("반려 사유를 입력하세요.");
      return;
    }
    if (
      !window.confirm(
        `발주를 반려하시겠습니까?\n발주 번호: ${detail?.order_number ?? detailId}\n반려 사유: ${reason}`,
      )
    ) {
      return;
    }
    setActionLoading("reject");
    try {
      await rejectOrderSpec(detail.order_spec_id, reason);
      setRejectMode(false);
      setRejectReason("");
      await loadDetail(detail.order_spec_id);
      refreshList();
    } catch (err) {
      setActionError(getApiError(err, "발주 반려 처리 중 오류가 발생했습니다."));
    } finally {
      setActionLoading("");
    }
  };

  return (
    <>
      <Header
        title="발주 승인 관리"
        description="점포에서 제출한 발주 명세서를 검토하고 승인 또는 반려할 수 있습니다."
      />

      <div className="stats-grid">
        <StatCard
          label="전체 발주 명세서"
          value={totalCount.toLocaleString()}
          icon={ClipboardList}
          tone="blue"
        />
        <StatCard
          label="승인 대기 (현재 페이지)"
          value={requestedCount}
          icon={ClipboardList}
          tone="orange"
        />
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <label className="field">
            <span>점포</span>
            <select
              value={storeFilter}
              onChange={(event) => setStoreFilter(event.target.value)}
            >
              <option value="">전체 점포</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name ?? store.store_name} ({store.code ?? store.store_code})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>발주 상태</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {SPEC_STATUS_OPTIONS.map((option) => (
                <option key={option.value || "ALL"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            onClick={() => loadSpecs({ targetPage: 1 })}
            loading={loading}
          >
            조회
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setStoreFilter("");
              setStatusFilter("");
              loadSpecs({ storeId: "", status: "", targetPage: 1 });
            }}
            disabled={loading}
          >
            초기화
          </Button>
        </div>
        <div className="toolbar-right">
          <Button
            type="button"
            variant="secondary"
            className="btn-sm"
            onClick={() => loadSpecs({ targetPage: page })}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            새로고침
          </Button>
        </div>
      </div>

      <Card className="table-card">
        {loading ? (
          <Loading label="발주 요청 목록을 불러오는 중..." />
        ) : error ? (
          <div style={{ padding: "24px" }}>
            <div className="alert alert-error">{error}</div>
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => loadSpecs({ targetPage: page })}
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : specs.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>발주 번호</th>
                  <th>점포명</th>
                  <th style={{ textAlign: "center" }}>상태</th>
                  <th style={{ textAlign: "right" }}>상품 수</th>
                  <th style={{ textAlign: "right" }}>총 발주 금액</th>
                  <th>발주 요청 일시</th>
                  <th style={{ textAlign: "center" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((spec) => (
                  <tr key={spec.order_spec_id}>
                    <td className="muted" style={{ fontFamily: "monospace" }}>
                      {spec.order_number}
                    </td>
                    <td>
                      <strong>{spec.store_name ?? "-"}</strong>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <SpecStatusBadge status={spec.order_status} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {Number(spec.item_count ?? 0).toLocaleString("ko-KR")}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatAmount(spec.total_amount)}
                    </td>
                    <td className="muted">
                      {spec.request_date
                        ? new Date(spec.request_date).toLocaleString("ko-KR")
                        : "-"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openDetail(spec.order_spec_id)}
                          disabled={rowBusyId === spec.order_spec_id}
                        >
                          상세
                        </button>
                        {spec.order_status === "REQUESTED" && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApprove(spec.order_spec_id)}
                            disabled={rowBusyId === spec.order_spec_id}
                          >
                            {rowBusyId === spec.order_spec_id ? "처리 중..." : "승인"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>
            {storeFilter || statusFilter
              ? "조건에 맞는 발주 요청이 없습니다."
              : "발주 요청이 없습니다."}
          </EmptyState>
        )}
        {!loading && !error && specs.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalCount}
            disabled={loading}
            onChange={(targetPage) => loadSpecs({ targetPage })}
          />
        )}
      </Card>

      {detailId && (
        <SpecDetailModal
          title="발주 명세서 검토"
          spec={detail}
          loading={detailLoading}
          error={detailError}
          onRetry={() => loadDetail(detailId)}
          onClose={closeDetail}
          banner={
            rejectMode ? (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  padding: "14px",
                  marginBottom: "14px",
                }}
              >
                <label className="field" style={{ marginBottom: "10px" }}>
                  <span>반려 사유 (필수)</span>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="반려 사유를 입력하세요. (최대 500자)"
                    maxLength={500}
                    disabled={Boolean(actionLoading)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                </label>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <Button
                    type="button"
                    variant="secondary"
                    className="btn-sm"
                    onClick={() => {
                      setRejectMode(false);
                      setRejectReason("");
                      setActionError("");
                    }}
                    disabled={Boolean(actionLoading)}
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="btn-sm"
                    onClick={handleReject}
                    loading={actionLoading === "reject"}
                    disabled={Boolean(actionLoading) && actionLoading !== "reject"}
                  >
                    반려 확정
                  </Button>
                </div>
              </div>
            ) : null
          }
          footer={
            detail ? (
              <>
                {actionError && (
                  <span
                    className="alert alert-error"
                    style={{ marginRight: "auto", padding: "6px 12px" }}
                  >
                    {actionError}
                  </span>
                )}
                {detail.order_status === "REQUESTED" && !rejectMode && (
                  <>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        setActionError("");
                        setRejectMode(true);
                      }}
                      loading={actionLoading === "reject"}
                      disabled={Boolean(actionLoading) && actionLoading !== "reject"}
                    >
                      반려
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleApprove(detail.order_spec_id)}
                      loading={actionLoading === "approve"}
                      disabled={Boolean(actionLoading) && actionLoading !== "approve"}
                    >
                      승인
                    </Button>
                  </>
                )}
                {detail.order_status === "APPROVED" && (
                  <>
                    <span className="muted" style={{ marginRight: "auto", fontSize: "13px" }}>
                      승인 완료. 발주서를 발행하면 점포에 입고 대기로 표시됩니다.
                    </span>
                    <Button
                      type="button"
                      onClick={handleIssue}
                      loading={actionLoading === "issue"}
                      disabled={Boolean(actionLoading) && actionLoading !== "issue"}
                    >
                      발주서 발행
                    </Button>
                  </>
                )}
                {detail.order_status === "ORDERED" && (
                  <span className="muted" style={{ fontSize: "13px" }}>
                    발주서가 발행되었습니다. (발주서 번호:{" "}
                    <strong style={{ fontFamily: "monospace" }}>
                      {detail.issued_order_number}
                    </strong>
                    )
                  </span>
                )}
                {["RECEIVED", "REJECTED", "CANCELLED", "DRAFT"].includes(
                  detail.order_status,
                ) && (
                  <span className="muted" style={{ fontSize: "13px" }}>
                    {detail.order_status === "DRAFT"
                      ? "점포가 아직 제출하지 않은 임시 저장 명세서입니다."
                      : "이 상태에서는 승인·반려할 수 없습니다."}
                  </span>
                )}
              </>
            ) : null
          }
        />
      )}
    </>
  );
}
