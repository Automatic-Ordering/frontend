import { useEffect, useState } from "react";
import { PackageCheck, RefreshCw } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Loading,
  Modal,
  StatCard,
} from "../../components/ui";
import Pagination from "../../components/Pagination";
import { Header } from "../../components/layout";
import {
  SpecStatusBadge,
  formatAmount,
} from "../../components/orderSpec";
import { getApiError } from "../../services/api";
import {
  getPendingReceipts,
  getOrderSpecDetail,
  receiveOrderSpec,
} from "../../services/orderSpecService";

const PAGE_SIZE = 20;

export default function StoreReceipts() {
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [receiptSpecId, setReceiptSpecId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [received, setReceived] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [comparison, setComparison] = useState(null);

  const loadReceipts = ({ targetPage = 1 } = {}) => {
    setLoading(true);
    setError("");
    getPendingReceipts({ page: targetPage, limit: PAGE_SIZE })
      .then((data) => {
        setSpecs(data.items || []);
        setTotalCount(Number(data.total ?? 0));
        setTotalPages(Number(data.total_pages ?? 0));
        setPage(Number(data.page ?? targetPage));
      })
      .catch((err) =>
        setError(getApiError(err, "입고 대기 목록을 불러오는 중 오류가 발생했습니다.")),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadDetail = async (specId) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      const data = await getOrderSpecDetail(specId);
      setDetail(data);
      setReceived(
        Object.fromEntries(
          (data.items ?? []).map((item) => [
            item.product_id,
            String(item.order_quantity),
          ]),
        ),
      );
    } catch (err) {
      setDetailError(
        getApiError(err, "발주 명세서를 불러오는 중 오류가 발생했습니다."),
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const openReceipt = (specId) => {
    setReceiptSpecId(specId);
    setDetail(null);
    setReceived({});
    setActionError("");
    setComparison(null);
    loadDetail(specId);
  };

  const closeReceipt = () => {
    setReceiptSpecId(null);
    setDetail(null);
    setDetailError("");
    setActionError("");
    setComparison(null);
    if (comparison) loadReceipts({ targetPage: page });
  };

  const handleReceivedChange = (productId, value) => {
    setReceived((prev) => ({ ...prev, [productId]: value }));
  };

  const handleReceive = async () => {
    setActionError("");
    const items = (detail?.items ?? []).map((item) => ({
      product_id: item.product_id,
      received_quantity: Number(received[item.product_id] ?? ""),
    }));
    const invalid = items.find(
      (item) => !Number.isInteger(item.received_quantity) || item.received_quantity < 0,
    );
    if (invalid) {
      setActionError("입고 수량은 0 이상의 정수로 모든 상품에 입력해야 합니다.");
      return;
    }
    const totalReceived = items.reduce(
      (sum, item) => sum + item.received_quantity,
      0,
    );
    if (
      !window.confirm(
        `총 ${totalReceived.toLocaleString("ko-KR")}개 수량을 입고 처리하시겠습니까?\n입고 완료 후에는 되돌릴 수 없습니다.`,
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await receiveOrderSpec(detail.order_spec_id, items);
      setComparison(result.comparison ?? []);
      setDetail(result);
      loadReceipts({ targetPage: page });
    } catch (err) {
      setActionError(getApiError(err, "입고 처리 중 오류가 발생했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header
        title="입고 관리"
        description="발주서가 발행된 발주의 실제 입고 수량을 입력하고 입고를 완료 처리합니다."
      />

      <div className="stats-grid">
        <StatCard
          label="입고 대기 발주"
          value={totalCount.toLocaleString()}
          icon={PackageCheck}
          tone="orange"
        />
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <span className="muted" style={{ fontSize: "13px" }}>
            발주서 발행이 완료된(ORDERED) 발주만 표시됩니다.
          </span>
        </div>
        <div className="toolbar-right">
          <Button
            type="button"
            variant="secondary"
            className="btn-sm"
            onClick={() => loadReceipts({ targetPage: page })}
            disabled={loading || submitting}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            새로고침
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <Card className="table-card">
        {loading ? (
          <Loading label="입고 대기 목록을 불러오는 중..." />
        ) : specs.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>발주 번호</th>
                  <th>발주서 번호</th>
                  <th style={{ textAlign: "right" }}>상품 수</th>
                  <th style={{ textAlign: "right" }}>총 발주 금액</th>
                  <th style={{ textAlign: "center" }}>상태</th>
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
                      {spec.issued_order_number}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {Number(spec.item_count ?? 0).toLocaleString("ko-KR")}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatAmount(spec.total_amount)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <SpecStatusBadge status={spec.order_status} />
                    </td>
                    <td className="muted">
                      {spec.issued_at
                        ? new Date(spec.issued_at).toLocaleString("ko-KR")
                        : "-"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => openReceipt(spec.order_spec_id)}
                        disabled={submitting}
                      >
                        입고 처리
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>
            입고 대기 중인 발주가 없습니다. 본사에서 발주서가 발행되면 이
            화면에 표시됩니다.
          </EmptyState>
        )}
        {!loading && specs.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalCount}
            disabled={loading || submitting}
            onChange={(targetPage) => loadReceipts({ targetPage })}
          />
        )}
      </Card>

      {receiptSpecId && (
        <Modal
          title={
            comparison ? "입고 완료" : `입고 처리 - ${detail?.order_number ?? ""}`
          }
          onClose={closeReceipt}
          maxWidth="760px"
        >
          {detailLoading ? (
            <Loading label="발주 명세서를 불러오는 중..." />
          ) : detailError ? (
            <>
              <div className="alert alert-error">{detailError}</div>
              <div style={{ marginTop: "12px", textAlign: "center" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => loadDetail(receiptSpecId)}
                >
                  다시 시도
                </button>
              </div>
            </>
          ) : comparison ? (
            <>
              <div className="alert alert-success">
                입고가 완료되었습니다. 처리 결과는 재고 관리 화면에서 확인할 수
                있습니다.
              </div>
              <SpecStatusBadge status={detail.order_status} />
              <div className="table-wrap" style={{ marginTop: "12px" }}>
                <table>
                  <thead>
                    <tr>
                      <th>상품명</th>
                      <th style={{ textAlign: "right" }}>주문 수량</th>
                      <th style={{ textAlign: "right" }}>입고 수량</th>
                      <th style={{ textAlign: "right" }}>차이</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row) => (
                      <tr key={row.product_id}>
                        <td>
                          <strong>{row.product_name}</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {Number(row.order_quantity).toLocaleString("ko-KR")}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {Number(row.received_quantity).toLocaleString("ko-KR")}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            color:
                              row.difference === 0
                                ? "#15803d"
                                : row.difference < 0
                                  ? "#b91c1c"
                                  : "#1d4ed8",
                            fontWeight: 600,
                          }}
                        >
                          {row.difference > 0 ? "+" : ""}
                          {Number(row.difference).toLocaleString("ko-KR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "14px",
                }}
              >
                <Button type="button" onClick={closeReceipt}>
                  확인
                </Button>
              </div>
            </>
          ) : detail ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                }}
              >
                <SpecStatusBadge status={detail.order_status} />
                <span className="muted" style={{ fontSize: "13px" }}>
                  발주서 번호:{" "}
                  <strong style={{ fontFamily: "monospace" }}>
                    {detail.issued_order_number}
                  </strong>
                </span>
                <span className="muted" style={{ fontSize: "13px" }}>
                  총 발주 금액:{" "}
                  <strong>{formatAmount(detail.total_amount)}</strong>
                </span>
              </div>
              {actionError && (
                <div className="alert alert-error" style={{ marginBottom: "12px" }}>
                  {actionError}
                </div>
              )}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>상품 코드</th>
                      <th>상품명</th>
                      <th style={{ textAlign: "right" }}>주문 수량</th>
                      <th style={{ textAlign: "center" }}>입고 수량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item) => (
                      <tr key={item.item_id}>
                        <td className="muted" style={{ fontFamily: "monospace" }}>
                          #{item.product_id}
                        </td>
                        <td>
                          <strong>{item.product_name}</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {Number(item.order_quantity).toLocaleString("ko-KR")}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={received[item.product_id] ?? ""}
                            onChange={(event) =>
                              handleReceivedChange(
                                item.product_id,
                                event.target.value.replace(/[^0-9]/g, ""),
                              )
                            }
                            disabled={submitting}
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
              <p className="muted" style={{ fontSize: "12px", marginTop: "10px" }}>
                모든 상품의 입고 수량을 입력해야 합니다. 입고 완료 시 실제 입고
                수량만큼 재고가 증가합니다.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "14px",
                }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeReceipt}
                  disabled={submitting}
                >
                  닫기
                </Button>
                <Button
                  type="button"
                  onClick={handleReceive}
                  loading={submitting}
                  disabled={detailLoading}
                >
                  입고 완료 처리
                </Button>
              </div>
            </>
          ) : null}
        </Modal>
      )}
    </>
  );
}
