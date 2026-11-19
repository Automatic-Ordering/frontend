import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  FilePlus2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, Loading, StatCard } from "../../components/ui";
import { Header } from "../../components/layout";
import { useAuth } from "../../contexts/AuthContext";
import api, { getApiError } from "../../services/api";

const EMPTY_KPI = {
  today_sales_amount: 0,
  today_sales_count: 0,
  recent_7d_sales_amount: 0,
  daily_sales_7d: [],
  top_products_7d: [],
  low_stock_count: 0,
  recommended_order_count: 0,
};

export default function StoreDashboard() {
  const { user } = useAuth();
  const name = user?.name || user?.storeName || "점포";
  const navigate = useNavigate();

  const [kpiData, setKpiData] = useState(EMPTY_KPI);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .get("/store/dashboard")
      .then((res) => {
        if (active && res.data) {
          setKpiData({ ...EMPTY_KPI, ...res.data });
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            getApiError(err, "대시보드 요약 정보를 불러오지 못했습니다."),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString("ko-KR");

  const dailyList = Array.isArray(kpiData.daily_sales_7d)
    ? kpiData.daily_sales_7d
    : [];
  const maxDailyAmount = Math.max(
    1,
    ...dailyList.map((d) => Number(d.amount || 0)),
  );

  const topProducts = Array.isArray(kpiData.top_products_7d)
    ? kpiData.top_products_7d
    : [];

  return (
    <>
      <Header
        title={`${name}님, 환영합니다`}
        description="오늘도 편리한 점포 운영을 시작해보세요."
      />

      <Card className="welcome-card" style={{ marginBottom: "20px" }}>
        <div>
          <span className="eyebrow">STORE OPERATIONS</span>
          <h2>자동발주 시스템 운영 현황</h2>
          <p>
            매출 추이와 재고 부족·발주 권장 품목을 확인하고 바로 발주 명세서를
            작성할 수 있습니다.
          </p>
        </div>
        <Sparkles size={70} />
      </Card>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <Loading label="대시보드 지표를 불러오는 중..." />
      ) : (
        <>
          <div className="stats-grid" style={{ marginBottom: "20px" }}>
            <div
              onClick={() => navigate("/store/sales")}
              style={{ cursor: "pointer" }}
            >
              <StatCard
                label={`오늘 매출 (${fmt(kpiData.today_sales_count)}건)`}
                value={`${fmt(kpiData.today_sales_amount)}원`}
                icon={Banknote}
                tone="blue"
              />
            </div>
            <div
              onClick={() => navigate("/store/sales")}
              style={{ cursor: "pointer" }}
            >
              <StatCard
                label="최근 7일 누적 매출"
                value={`${fmt(kpiData.recent_7d_sales_amount)}원`}
                icon={TrendingUp}
                tone="green"
              />
            </div>
            <div
              onClick={() => navigate("/store/inventory")}
              style={{ cursor: "pointer" }}
            >
              <StatCard
                label="재고 부족 품목"
                value={`${fmt(kpiData.low_stock_count)}개`}
                icon={AlertTriangle}
                tone="orange"
              />
            </div>
            <div
              onClick={() => navigate("/store/orders/specs/new")}
              style={{ cursor: "pointer" }}
            >
              <StatCard
                label="발주 권장 품목"
                value={`${fmt(kpiData.recommended_order_count)}개`}
                icon={FilePlus2}
                tone="blue"
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "16px",
            }}
          >
            <Card>
              <div style={{ padding: "18px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "16px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
                    최근 7일 일별 매출 추이
                  </h3>
                  <span className="muted" style={{ fontSize: "12px" }}>
                    합계 {fmt(kpiData.recent_7d_sales_amount)}원
                  </span>
                </div>

                {dailyList.length === 0 ? (
                  <p className="muted" style={{ fontSize: "13px" }}>
                    최근 7일 매출 데이터가 없습니다.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "10px",
                      height: "190px",
                      paddingTop: "24px",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    {dailyList.map((d) => {
                      const rawAmount = Number(d.amount || 0);
                      const barHeight =
                        rawAmount > 0
                          ? Math.max(
                              8,
                              Math.round((rawAmount / maxDailyAmount) * 130),
                            )
                          : 2;
                      const shortDate = String(d.date || "").slice(5);
                      return (
                        <div
                          key={d.date}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            height: "100%",
                          }}
                        >
                          <span
                            className="muted"
                            style={{
                              fontSize: "11px",
                              marginBottom: "4px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {rawAmount > 0
                              ? `${Math.round(rawAmount / 1000)}k`
                              : "0"}
                          </span>
                          <div
                            title={`${d.date}: ${fmt(rawAmount)}원`}
                            style={{
                              width: "100%",
                              maxWidth: "36px",
                              height: `${barHeight}px`,
                              backgroundColor:
                                rawAmount > 0 ? "#2563eb" : "#e2e8f0",
                              borderRadius: "6px 6px 0 0",
                            }}
                          />
                          <span
                            className="muted"
                            style={{
                              fontSize: "11px",
                              marginTop: "6px",
                              marginBottom: "4px",
                            }}
                          >
                            {shortDate}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            <Card className="table-card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "18px 18px 8px 18px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
                  최근 7일 판매 TOP 5
                </h3>
              </div>
              {topProducts.length === 0 ? (
                <p
                  className="muted"
                  style={{ padding: "12px 18px 20px 18px", fontSize: "13px" }}
                >
                  판매 데이터가 없습니다.
                </p>
              ) : (
                <div style={{ width: "100%", overflowX: "hidden" }}>
                  <table
                    style={{
                      width: "100%",
                      minWidth: 0,
                      tableLayout: "fixed",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={{ width: "42%", padding: "10px 8px 10px 16px" }}>
                          상품명
                        </th>
                        <th style={{ width: "22%", padding: "10px 6px" }}>
                          카테고리
                        </th>
                        <th
                          style={{
                            width: "15%",
                            padding: "10px 6px",
                            textAlign: "right",
                          }}
                        >
                          판매량
                        </th>
                        <th
                          style={{
                            width: "21%",
                            padding: "10px 16px 10px 6px",
                            textAlign: "right",
                          }}
                        >
                          매출액
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p, idx) => (
                        <tr key={p.product_id ?? idx}>
                          <td
                            title={p.product_name || "알 수 없음"}
                            style={{
                              padding: "10px 8px 10px 16px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <strong>{p.product_name || "알 수 없음"}</strong>
                          </td>
                          <td
                            className="muted"
                            title={p.category || "미분류"}
                            style={{
                              padding: "10px 6px",
                              fontSize: "12px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.category || "미분류"}
                          </td>
                          <td
                            style={{
                              padding: "10px 6px",
                              textAlign: "right",
                              whiteSpace: "nowrap",
                              fontSize: "13px",
                            }}
                          >
                            {fmt(p.sold_quantity)}개
                          </td>
                          <td
                            style={{
                              padding: "10px 16px 10px 6px",
                              textAlign: "right",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              fontSize: "13px",
                            }}
                          >
                            {fmt(p.sales_amount)}원
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}