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
  SpecDetailModal,
} from "../../components/orderSpec";
import {
  SPEC_STATUS_OPTIONS,
  formatAmount,
  formatDateTime,
  SpecStatusBadge,
} from "../../utils/orderSpecUtils";
import { getApiError } from "../../services/api";
import {
  getAdminOrderSpecDetail,
  getAdminOrderSpecs,
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

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

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
      setDetail(data?.spec ?? data?.item ?? data?.data ?? data);
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
    await loadDetail(specId);
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
    setDetailError("");
  };

  const requestedCount = useMemo(
    () => specs.filter((spec) => spec.order_status === "REQUESTED").length,
    [specs],
  );

  return (
    <>
      <Header
        title="발주 현황"
        description="점포 발주 명세서의 현황을 조회하고 상세 내용을 확인합니다."
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
                      {formatDateTime(spec.confirmed_at ?? spec.request_date ?? spec.requestDate)}
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
                        >
                          상세
                        </button>
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
        />
      )}
    </>
  );
}