import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardList,
  Eye,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Loading,
  Modal,
  SearchInput,
  StatCard,
} from "../../components/ui";
import Pagination from "../../components/Pagination";
import { Header } from "../../components/layout";
import {
  SpecItemsTable,
  SpecStatusBadge,
  formatAmount,
} from "../../components/orderSpec";
import { getApiError } from "../../services/api";
import { getRecommendations } from "../../services/orderService";
import { createOrderSpec, submitOrderSpec } from "../../services/orderSpecService";
import { useAuth } from "../../contexts/AuthContext";

const WARNING_LABELS = {
  NO_SALES_DATA: "판매 데이터 없음",
  INSUFFICIENT_SALES_DATA: "판매 데이터 부족",
  INSUFFICIENT_MOVING_AVERAGE_WINDOW: "7일 미만 판매 데이터",
  NO_SAME_WEEKDAY_DATA: "동요일 판매 데이터 없음",
};

const PAGE_SIZE = 20;

export default function StoreOrderSpecCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  const loadRecommendations = ({ targetPage = 1, search = query.trim() } = {}) => {
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
            if (!(key in next)) next[key] = String(item.order_quantity ?? 0);
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

  const draftItems = useMemo(
    () =>
      recommendations
        .map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: Number(quantities[item.product_id] ?? 0),
          unit_price: Number(item.price ?? 0),
        }))
        .filter((item) => item.quantity > 0),
    [recommendations, quantities],
  );

  const totalQuantity = draftItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = draftItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );

  const handleQuantityChange = (productId, value) => {
    setQuantities((prev) => ({ ...prev, [productId]: value }));
  };

  const validateItems = () => {
    if (!draftItems.length) {
      return "발주할 상품이 없습니다. 발주 수량을 1 이상 입력하세요.";
    }
    const invalid = draftItems.some(
      (item) => !Number.isInteger(item.quantity) || item.quantity < 1,
    );
    if (invalid) {
      return "발주 수량은 1 이상의 정수로 입력하세요.";
    }
    if (draftItems.length > 500) {
      return "발주 항목은 한 번에 최대 500개까지 등록할 수 있습니다.";
    }
    return "";
  };

  const buildRequestItems = () =>
    draftItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    }));

  const handleSaveDraft = async () => {
    setFormError("");
    const validationError = validateItems();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (
      !window.confirm(
        `총 ${draftItems.length}개 상품 / ${totalQuantity.toLocaleString("ko-KR")}개 수량으로 발주 명세서를 임시 저장하시겠습니까?`,
      )
    ) {
      return;
    }
    setSavingDraft(true);
    try {
      const spec = await createOrderSpec(buildRequestItems());
      navigate("/store/orders/specs", {
        state: {
          message: `발주 명세서(${spec.order_number})가 임시 저장되었습니다. 제출하면 본사 승인 요청이 시작됩니다.`,
        },
      });
    } catch (err) {
      setFormError(
        getApiError(err, "발주 명세서 임시 저장 중 오류가 발생했습니다."),
      );
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    setFormError("");
    const validationError = validateItems();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (
      !window.confirm(
        `총 ${draftItems.length}개 상품 / ${totalQuantity.toLocaleString("ko-KR")}개 수량을 발주 요청하시겠습니까?\n제출 후에는 본사 검토 완료까지 상품과 수량을 변경할 수 없습니다.`,
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const spec = await createOrderSpec(buildRequestItems());
      await submitOrderSpec(spec.order_spec_id);
      navigate("/store/orders/specs", {
        state: {
          message: `발주 명세서(${spec.order_number})가 제출되었습니다. 본사 승인을 기다려 주세요.`,
        },
      });
    } catch (err) {
      setFormError(
        getApiError(err, "발주 요청 제출 중 오류가 발생했습니다."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const previewSpec = {
    order_number: "(저장 시 자동 생성)",
    order_status: "DRAFT",
    store_name: user?.storeName ?? "-",
    total_amount: totalAmount,
    items: draftItems.map((item, index) => ({
      item_id: index,
      product_id: item.product_id,
      product_name: item.product_name,
      order_quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.quantity * item.unit_price,
      received_quantity: null,
    })),
    status_histories: [],
  };

  return (
    <>
      <Header
        title="발주 명세서 작성"
        description="자동 발주 추천 결과를 기반으로 발주 명세서를 작성하고 본사에 제출합니다."
      />

      <div className="stats-grid">
        <StatCard
          label="상품 수"
          value={totalCount.toLocaleString()}
          icon={ClipboardList}
          tone="blue"
        />
        <StatCard
          label={`발주 대상 상품 (현재 페이지)`}
          value={draftItems.length}
          icon={ShoppingCart}
          tone="orange"
        />
        <StatCard
          label="총 발주 금액 (현재 페이지)"
          value={formatAmount(totalAmount)}
          icon={ShoppingCart}
          tone="purple"
        />
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <SearchInput
            placeholder="상품명, 카테고리 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onSearch={() => loadRecommendations({ targetPage: 1 })}
          />
          <Button
            type="button"
            variant="secondary"
            className="btn-sm"
            onClick={() => loadRecommendations({ targetPage: 1 })}
            disabled={loading || savingDraft || submitting}
          >
            조회
          </Button>
        </div>
        <div className="toolbar-right">
          <span className="muted" style={{ fontSize: "12px", fontWeight: 600 }}>
            {draftItems.length}개 상품 / {totalQuantity.toLocaleString("ko-KR")}개
          </span>
          <Button
            type="button"
            variant="secondary"
            className="btn-sm"
            onClick={() => setPreviewOpen(true)}
            disabled={loading || savingDraft || submitting || !draftItems.length}
          >
            <Eye size={16} />
            미리보기
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="btn-sm"
            onClick={handleSaveDraft}
            loading={savingDraft}
            disabled={loading || submitting || !draftItems.length}
          >
            임시 저장
          </Button>
          <Button
            type="button"
            className="btn-sm"
            onClick={handleSubmit}
            loading={submitting}
            disabled={loading || savingDraft || !draftItems.length}
          >
            발주 요청 제출
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="btn-sm"
            onClick={() => loadRecommendations({ targetPage: page })}
            disabled={loading || savingDraft || submitting}
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
          <Loading label="발주 추천을 불러오는 중..." />
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
                  <th style={{ textAlign: "right" }}>추천 발주량</th>
                  <th style={{ textAlign: "right" }}>단가</th>
                  <th style={{ textAlign: "center" }}>발주 수량</th>
                  <th style={{ textAlign: "right" }}>금액</th>
                  <th style={{ textAlign: "center" }}>데이터 상태</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((item) => {
                  const quantity = Number(quantities[item.product_id] ?? 0);
                  const hasWarning = item.data_warning?.length > 0;
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
                        {Number(item.current_stock).toLocaleString("ko-KR")}
                      </td>
                      <td style={{ textAlign: "right", color: item.needs_order ? "#b45309" : "#64748b" }}>
                        {item.needs_order
                          ? Number(item.order_quantity).toLocaleString("ko-KR")
                          : "발주 불필요"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {Number(item.price ?? 0).toLocaleString("ko-KR")}원
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
                          disabled={savingDraft || submitting}
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
                        {formatAmount(quantity * Number(item.price ?? 0))}
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
          disabled={loading || savingDraft || submitting}
          onChange={(nextPage) => loadRecommendations({ targetPage: nextPage })}
        />
      )}

      {previewOpen && (
        <Modal
          title="발주 명세서 미리보기"
          onClose={() => setPreviewOpen(false)}
          maxWidth="760px"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "12px",
              marginBottom: "14px",
              fontSize: "13px",
            }}
          >
            <div>
              <span className="muted" style={{ display: "block" }}>발주 번호</span>
              <strong style={{ fontFamily: "monospace" }}>
                (저장 시 자동 생성)
              </strong>
            </div>
            <div>
              <span className="muted" style={{ display: "block" }}>점포</span>
              <strong>{user?.storeName ?? "-"}</strong>
            </div>
            <div>
              <span className="muted" style={{ display: "block" }}>상태</span>
              <SpecStatusBadge status="DRAFT" />
            </div>
            <div>
              <span className="muted" style={{ display: "block" }}>총 발주 금액</span>
              <strong style={{ fontSize: "15px" }}>{formatAmount(totalAmount)}</strong>
            </div>
          </div>
          <SpecItemsTable
            items={previewSpec.items}
            quantityColumnLabel="발주 수량"
          />
          <p className="muted" style={{ fontSize: "12px", marginTop: "12px" }}>
            임시 저장 또는 제출 시점에 상품명·단가가 서버에 스냅샷으로 저장되고
            발주 번호(OS-YYYYMMDD-XXXXXX)가 자동 생성됩니다.
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
              onClick={() => setPreviewOpen(false)}
            >
              닫기
            </Button>
            <Button
              type="button"
              onClick={handleSaveDraft}
              loading={savingDraft}
              disabled={submitting}
            >
              임시 저장
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              loading={submitting}
              disabled={savingDraft}
            >
              발주 요청 제출
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
