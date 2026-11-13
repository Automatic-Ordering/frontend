import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ClipboardList, FilePlus2, RefreshCw } from "lucide-react";
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
  cancelOrderSpec,
  getOrderSpecDetail,
  getOrderSpecs,
  submitOrderSpec,
  updateOrderSpecItems,
} from "../../services/orderSpecService";

const PAGE_SIZE = 20;

export default function StoreOrderSpecList() {
  const location = useLocation();
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [editing, setEditing] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [actionLoading, setActionLoading] = useState("");
  const [actionError, setActionError] = useState("");

  const notice = location.state?.message;

  const loadSpecs = ({ status = statusFilter, targetPage = 1 } = {}) => {
    setLoading(true);
    setError("");
    getOrderSpecs({
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
        setError(getApiError(err, "발주 내역을 불러오는 중 오류가 발생했습니다.")),
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
      const data = await getOrderSpecDetail(specId);
      setDetail(data);
      return data;
    } catch (err) {
      setDetailError(
        getApiError(err, "발주 명세서를 불러오는 중 오류가 발생했습니다."),
      );
      return null;
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = async (specId) => {
    setDetailId(specId);
    setDetail(null);
    setEditing(false);
    setActionError("");
    await loadDetail(specId);
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
    setDetailError("");
    setEditing(false);
    setActionLoading("");
    setActionError("");
  };

  const requestedCount = useMemo(
    () => specs.filter((spec) => spec.order_status === "REQUESTED").length,
    [specs],
  );
  const draftCount = useMemo(
    () => specs.filter((spec) => spec.order_status === "DRAFT").length,
    [specs],
  );

  const startEditing = () => {
    setActionError("");
    setEditing(true);
    setQuantities(
      Object.fromEntries(
        (detail?.items ?? []).map((item) => [
          item.product_id,
          String(item.order_quantity),
        ]),
      ),
    );
  };

  const handleQuantityChange = (productId, value) => {
    setQuantities((prev) => ({ ...prev, [productId]: value }));
  };

  const refreshList = () => loadSpecs({ targetPage: page });

  const handleSaveItems = async () => {
    setActionError("");
    const items = (detail?.items ?? []).map((item) => ({
      product_id: item.product_id,
      quantity: Number(quantities[item.product_id] ?? 0),
    }));
    if (items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) {
      setActionError("발주 수량은 1 이상의 정수로 입력하세요.");
      return;
    }
    setActionLoading("save");
    try {
      await updateOrderSpecItems(detail.order_spec_id, items);
      setEditing(false);
      await loadDetail(detail.order_spec_id);
      refreshList();
    } catch (err) {
      setActionError(
        getApiError(err, "발주 수량 수정 중 오류가 발생했습니다."),
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleSubmit = async () => {
    setActionError("");
    if (
      !window.confirm(
        "발주 명세서를 본사에 제출하시겠습니까? 제출 후에는 상품과 수량을 변경할 수 없습니다.",
      )
    ) {
      return;
    }
    setActionLoading("submit");
    try {
      await submitOrderSpec(detail.order_spec_id);
      setEditing(false);
      await loadDetail(detail.order_spec_id);
      refreshList();
    } catch (err) {
      setActionError(getApiError(err, "발주 요청 제출 중 오류가 발생했습니다."));
    } finally {
      setActionLoading("");
    }
  };

  const handleCancel = async () => {
    setActionError("");
    if (!window.confirm("발주 명세서를 취소하시겠습니까? 취소 후에는 되돌릴 수 없습니다.")) {
      return;
    }
    setActionLoading("cancel");
    try {
      await cancelOrderSpec(detail.order_spec_id);
      setEditing(false);
      await loadDetail(detail.order_spec_id);
      refreshList();
    } catch (err) {
      setActionError(getApiError(err, "발주 명세서 취소 중 오류가 발생했습니다."));
    } finally {
      setActionLoading("");
    }
  };

  return (
    <>
      <Header
        title="발주 내역"
        description="작성·제출한 발주 명세서의 승인 상태와 반려 사유를 확인합니다."
      />

      {notice && (
        <div className="alert alert-success" style={{ marginBottom: "16px" }}>
          {notice}
        </div>
      )}

      <div className="stats-grid">
        <StatCard
          label="총 발주 명세서"
          value={totalCount.toLocaleString()}
          icon={ClipboardList}
          tone="blue"
        />
        <StatCard
          label="임시 저장 (현재 페이지)"
          value={draftCount}
          icon={ClipboardList}
          tone="purple"
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
              setStatusFilter("");
              loadSpecs({ status: "", targetPage: 1 });
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
          <Link
            to="/store/orders/specs/new"
            className="btn btn-primary btn-sm"
            style={{ textDecoration: "none" }}
          >
            <FilePlus2 size={16} />
            명세서 작성
          </Link>
        </div>
      </div>

      <Card className="table-card">
        {loading ? (
          <Loading label="발주 내역을 불러오는 중..." />
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
                  <th style={{ textAlign: "center" }}>상태</th>
                  <th style={{ textAlign: "right" }}>상품 수</th>
                  <th style={{ textAlign: "right" }}>총 발주 금액</th>
                  <th>발주 요청 일시</th>
                  <th>생성 일시</th>
                  <th style={{ textAlign: "center" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((spec) => (
                  <tr key={spec.order_spec_id}>
                    <td className="muted" style={{ fontFamily: "monospace" }}>
                      {spec.order_number}
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
                    <td className="muted">
                      {new Date(spec.created_at).toLocaleString("ko-KR")}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openDetail(spec.order_spec_id)}
                      >
                        상세
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>
            {statusFilter
              ? `해당 상태의 발주 내역이 없습니다.`
              : "발주 내역이 없습니다. 발주 명세서 작성 화면에서 시작해 보세요."}
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
          spec={detail}
          loading={detailLoading}
          error={detailError}
          onRetry={() => loadDetail(detailId)}
          onClose={closeDetail}
          showStore={false}
          banner={
            editing && detail?.order_status === "DRAFT" ? (
              <div
                className="alert"
                style={{ background: "#eff6ff", color: "#1d4ed8" }}
              >
                수량을 수정한 뒤 <strong>수량 저장</strong>을 누르면 금액과 총
                발주 금액이 다시 계산됩니다.
              </div>
            ) : null
          }
          itemsContent={
            editing && detail ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>상품 코드</th>
                      <th>상품명</th>
                      <th style={{ textAlign: "right" }}>단가</th>
                      <th style={{ textAlign: "center" }}>발주 수량</th>
                      <th style={{ textAlign: "right" }}>금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item) => {
                      const quantity = Number(quantities[item.product_id] ?? 0);
                      return (
                        <tr key={item.item_id}>
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
                            <input
                              type="text"
                              inputMode="numeric"
                              value={quantities[item.product_id] ?? ""}
                              onChange={(event) =>
                                handleQuantityChange(
                                  item.product_id,
                                  event.target.value.replace(/[^0-9]/g, ""),
                                )
                              }
                              disabled={Boolean(actionLoading)}
                              style={{
                                width: "84px",
                                textAlign: "right",
                                padding: "7px 9px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                              }}
                            />
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>
                            {formatAmount(quantity * Number(item.unit_price))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : undefined
          }
          footer={
            detail && !editing ? (
              <>
                {detail.order_status === "DRAFT" && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={startEditing}
                      disabled={Boolean(actionLoading)}
                    >
                      수량 수정
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      loading={actionLoading === "submit"}
                      disabled={Boolean(actionLoading) && actionLoading !== "submit"}
                    >
                      발주 요청 제출
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleCancel}
                      loading={actionLoading === "cancel"}
                      disabled={Boolean(actionLoading) && actionLoading !== "cancel"}
                    >
                      취소
                    </Button>
                  </>
                )}
                {detail.order_status === "REQUESTED" && (
                  <>
                    <span className="muted" style={{ marginRight: "auto", fontSize: "13px" }}>
                      본사 승인 검토 중입니다.
                    </span>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleCancel}
                      loading={actionLoading === "cancel"}
                      disabled={Boolean(actionLoading) && actionLoading !== "cancel"}
                    >
                      취소
                    </Button>
                  </>
                )}
                {detail.order_status === "REJECTED" && (
                  <span className="muted" style={{ fontSize: "13px" }}>
                    반려된 발주입니다. 수량을 조정해 새 명세서를 작성해 주세요.
                  </span>
                )}
                {detail.order_status === "APPROVED" && (
                  <span className="muted" style={{ fontSize: "13px" }}>
                    본사 승인이 완료되었습니다. 발주서 발행을 기다려 주세요.
                  </span>
                )}
                {detail.order_status === "ORDERED" && (
                  <span className="muted" style={{ fontSize: "13px" }}>
                    발주서가 발행되었습니다. 입고 관리 화면에서 입고를 처리할 수 있습니다.
                  </span>
                )}
                {detail.order_status === "RECEIVED" && (
                  <span className="muted" style={{ fontSize: "13px" }}>
                    입고가 완료되어 재고에 반영되었습니다.
                  </span>
                )}
              </>
            ) : detail && editing ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditing(false);
                    setActionError("");
                  }}
                  disabled={Boolean(actionLoading)}
                >
                  수정 취소
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveItems}
                  loading={actionLoading === "save"}
                  disabled={Boolean(actionLoading) && actionLoading !== "save"}
                >
                  수량 저장
                </Button>
              </>
            ) : null
          }
        >
          {actionError && (
            <div className="alert alert-error" style={{ marginBottom: "14px" }}>
              {actionError}
            </div>
          )}
        </SpecDetailModal>
      )}
    </>
  );
}
