import { useEffect, useState } from "react";
import { FileCheck2, RefreshCw } from "lucide-react";
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
  SPEC_STATUSES,
  SPEC_STATUS_LABELS,
  SpecDetailModal,
  SpecStatusBadge,
  formatAmount,
} from "../../components/orderSpec";
import { getApiError } from "../../services/api";
import {
  getAdminOrderSpecs,
  getAdminOrderSpecDetail,
  issueOrderSpec,
} from "../../services/orderSpecService";

const PAGE_SIZE = 20;

const ISSUE_STATUSES = ["APPROVED", "ORDERED", "RECEIVED"];

export default function AdminIssuedOrders() {
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ORDERED");
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

  const loadSpecs = ({ status = statusFilter, targetPage = 1 } = {}) => {
    setLoading(true);
    setError("");
    getAdminOrderSpecs({
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
        setError(getApiError(err, "발주서 목록을 불러오는 중 오류가 발생했습니다.")),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSpecs();
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
    setActionLoading("");
    await loadDetail(specId);
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
    setDetailError("");
    setActionLoading("");
    setActionError("");
  };

  const issuedCount = specs.filter(
    (spec) => spec.order_status === "ORDERED",
  ).length;

  const refreshList = () => loadSpecs({ targetPage: page });

  const handleIssue = async (specId) => {
    const spec =
      detail?.order_spec_id === specId
        ? detail
        : specs.find((item) => item.order_spec_id === specId);
    if (
      !window.confirm(
        `발주서를 발행하시겠습니까?\n발주 번호: ${spec?.order_number ?? specId}\n발행 후 점포에 입고 대기로 표시됩니다.`,
      )
    ) {
      return;
    }
    const isModalAction = detailId === specId;
    setActionLoading(isModalAction ? "issue" : "");
    setRowBusyId(isModalAction ? null : specId);
    try {
      await issueOrderSpec(specId);
      if (isModalAction) await loadDetail(specId);
      refreshList();
    } catch (err) {
      const message = getApiError(err, "발주서 발행 중 오류가 발생했습니다.");
      if (isModalAction) setActionError(message);
      else setError(message);
    } finally {
      setActionLoading("");
      setRowBusyId(null);
    }
  };

  return (
    <>
      <Header
        title="발주서 관리"
        description="승인된 발주의 발주서 발행 상태를 관리하고 발주서를 확인합니다."
      />

      <div className="stats-grid">
        <StatCard
          label="발주서 목록"
          value={totalCount.toLocaleString()}
          icon={FileCheck2}
          tone="blue"
        />
        <StatCard
          label="발행 완료 (현재 페이지)"
          value={issuedCount}
          icon={FileCheck2}
          tone="purple"
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
              <option value="">전체</option>
              {SPEC_STATUSES.filter((status) => ISSUE_STATUSES.includes(status)).map(
                (status) => (
                  <option key={status} value={status}>
                    {SPEC_STATUS_LABELS[status]}
                  </option>
                ),
              )}
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
              setStatusFilter("ORDERED");
              loadSpecs({ status: "ORDERED", targetPage: 1 });
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
          <Loading label="발주서 목록을 불러오는 중..." />
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
                  <th>발주서 번호</th>
                  <th>점포명</th>
                  <th style={{ textAlign: "center" }}>상태</th>
                  <th style={{ textAlign: "right" }}>상품 수</th>
                  <th style={{ textAlign: "right" }}>총 발주 금액</th>
                  <th>발행 일시</th>
                  <th style={{ textAlign: "center" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((spec) => (
                  <tr key={spec.order_spec_id}>
                    <td className="muted" style={{ fontFamily: "monospace" }}>
                      {spec.order_number}
                    </td>
                    <td className="muted" style={{ fontFamily: "monospace" }}>
                      {spec.issued_order_number ?? "-"}
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
                      {spec.issued_at
                        ? new Date(spec.issued_at).toLocaleString("ko-KR")
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
                        {spec.order_status === "APPROVED" && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleIssue(spec.order_spec_id)}
                            disabled={rowBusyId === spec.order_spec_id}
                          >
                            {rowBusyId === spec.order_spec_id ? "처리 중..." : "발행"}
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
            {statusFilter
              ? `해당 상태의 발주서가 없습니다.`
              : "발주서가 없습니다. 발주 승인 관리에서 승인 후 발행할 수 있습니다."}
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
          title="발주서 상세"
          spec={detail}
          loading={detailLoading}
          error={detailError}
          onRetry={() => loadDetail(detailId)}
          onClose={closeDetail}
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
                {detail.order_status === "APPROVED" && (
                  <>
                    <span className="muted" style={{ marginRight: "auto", fontSize: "13px" }}>
                      승인 완료된 발주입니다. 발주서를 발행하면 점포에 입고 대기로 표시됩니다.
                    </span>
                    <Button
                      type="button"
                      onClick={() => handleIssue(detail.order_spec_id)}
                      loading={actionLoading === "issue"}
                      disabled={Boolean(actionLoading) && actionLoading !== "issue"}
                    >
                      발주서 발행
                    </Button>
                  </>
                )}
                {detail.order_status === "ORDERED" && (
                  <span className="muted" style={{ fontSize: "13px" }}>
                    발주서 발행 완료. 점포 입고 처리를 기다리고 있습니다.
                  </span>
                )}
                {detail.order_status === "RECEIVED" && (
                  <span className="muted" style={{ fontSize: "13px" }}>
                    입고가 완료되었습니다.
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
