import { useEffect, useMemo, useState } from "react";
import { Boxes, Receipt } from "lucide-react";
import { Button, Card, EmptyState, Input, Loading, StatCard } from "../../components/ui";
import Pagination from "../../components/Pagination";
import { Header } from "../../components/layout";
import { getApiError } from "../../services/api";
import { getSales } from "../../services/salesService";

const PAGE_SIZE = 20;

export default function StoreSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const loadSales = ({ targetPage = 1, from = fromDate, to = toDate } = {}) => {
    setLoading(true);
    setError("");
    getSales({ from: from || undefined, to: to || undefined, page: targetPage, limit: PAGE_SIZE })
      .then((data) => {
        setSales(data.items || []);
        setTotalCount(Number(data.total ?? 0));
        setTotalPages(Number(data.total_pages ?? 0));
        setPage(Number(data.page ?? targetPage));
      })
      .catch((err) =>
        setError(getApiError(err, "판매 내역을 불러오는 중 오류가 발생했습니다.")),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSales();
  }, []);

  const pageQuantity = useMemo(
    () =>
      sales.reduce((sum, sale) => sum + Number(sale.sales_quantity || 0), 0),
    [sales],
  );

  const handleSearch = () => {
    loadSales({ targetPage: 1 });
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    loadSales({ targetPage: 1, from: "", to: "" });
  };

  const handleRetry = () => {
    loadSales({ targetPage: page });
  };

  const handlePageChange = (targetPage) => {
    loadSales({ targetPage });
  };

  return (
    <>
      <Header title="판매 내역" description="기간별 판매 내역을 조회합니다." />

      <div className="stats-grid">
        <StatCard label="판매 건수" value={totalCount.toLocaleString()} icon={Receipt} tone="blue" />
        <StatCard
          label="총 판매 수량 (현재 페이지)"
          value={pageQuantity.toLocaleString()}
          icon={Boxes}
          tone="purple"
        />
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            label="시작일"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
          <Input
            label="종료일"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
          <Button type="button" onClick={handleSearch} loading={loading}>
            조회
          </Button>
          <Button type="button" variant="secondary" onClick={handleReset} disabled={loading}>
            초기화
          </Button>
        </div>
      </div>

      <Card className="table-card">
        {loading ? (
          <Loading label="판매 내역을 불러오는 중..." />
        ) : error ? (
          <div style={{ padding: "24px" }}>
            <div className="alert alert-error">{error}</div>
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <button type="button" className="btn btn-primary" onClick={handleRetry}>다시 시도</button>
            </div>
          </div>
        ) : sales.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th style={{ textAlign: "right" }}>판매 수량</th>
                  <th>판매 일시</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.sales_id}>
                    <td><strong>{sale.product_name ?? "-"}</strong></td>
                    <td>
                      <span className="badge" style={{ background: "#f1f5f9", color: "#334155" }}>
                        {sale.category ?? "-"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {Number(sale.sales_quantity).toLocaleString()}
                    </td>
                    <td className="muted">{new Date(sale.sales_date).toLocaleString("ko-KR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>
            {fromDate || toDate ? "해당 기간의 판매 내역이 없습니다." : "등록된 판매 내역이 없습니다."}
          </EmptyState>
        )}
        {!loading && !error && sales.length > 0 && (
          <Pagination page={page} totalPages={totalPages} total={totalCount} onChange={handlePageChange} disabled={loading} />
        )}
      </Card>
    </>
  );
}
