import { useEffect, useState } from "react";
import { Boxes, PackageSearch, Sparkles } from "lucide-react";
import { Card, Button } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/layout";
import { useAuth } from "../../contexts/AuthContext";
import { getStoreProducts } from "../../services/productService";
import { getPendingReceipts } from "../../services/orderSpecService";

export default function StoreDashboard() {
  const { user } = useAuth();
  const name = user?.name || user?.storeName || "점포";
  const navigate = useNavigate();

  const [productCount, setProductCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [recommendedCount, setRecommendedCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(true);

  // Count products, low stock, and recommended items on mount
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [products] = await Promise.all([getStoreProducts()]);
        const registeredProducts = products.filter((p) => p.is_registered);
        setProductCount(registeredProducts.length);

        // Count low stock items (current_stock < 10 as example threshold)
        const lowStock = registeredProducts.filter(
          (p) => (p.current_stock ?? 0) < 10,
        ).length;
        setLowStockCount(lowStock);

        // Count pending receipt items as a proxy for recommended orders
        try {
          const receiptData = await getPendingReceipts({ page: 1, limit: 100 });
          const items = receiptData.items || [];
          setRecommendedCount(items.length);
        } catch (e) {
          setRecommendedCount(0);
        }
      } catch (e) {
        // Counts remain 0 if API fails; navigation still works
      } finally {
        setLoadingCounts(false);
      }
    };

    fetchCounts();
  }, []);

  const handleCardClick = (path) => {
    navigate(path, { state: { from: "dashboard" } });
  };

  return (
    <>
      <Header
        title={`${name}님, 환영합니다`}
        description="오늘도 편리한 점포 운영을 시작해보세요."
      />
      <Card className="welcome-card">
        <div>
          <span className="eyebrow">STORE OPERATIONS</span>
          <h2>자동발주 시스템 준비 완료</h2>
          <p>
            상품과 재고 데이터를 연결하면 더 편리한 점포 운영을 시작할 수
            있습니다.
          </p>
        </div>
        <Sparkles size={70} />
      </Card>

      <div className="stats-row" style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
        <Card className="stat-card" style={{ width: "140px" }}>
          <div style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>
              {productCount}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>등록 상품 수</div>
          </div>
        </Card>
        <Card className="stat-card" style={{ width: "140px" }}>
          <div style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>
              {lowStockCount}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>재고 부족 품목</div>
          </div>
        </Card>
        <Card className="stat-card" style={{ width: "140px" }}>
          <div style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>
              {recommendedCount}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>추천 발주 품목</div>
          </div>
        </Card>
      </div>

      <div className="feature-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <Card
          className="function-card"
          onClick={() => handleCardClick("/store/sales")}
          style={{ cursor: "pointer", transition: "transform 0.2s" }}
          onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ width: "40px", height: "40px", background: "rgba(30, 64, 136, 0.1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
            <PackageSearch size={20} style={{ color: "#1e3a8a" }} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>상품 관리</h2>
          <p style={{ fontSize: "13px", color: "#475569", marginBottom: "8px" }}>상품 등록 및 판매 정보 관리</p>
          <span style={{ fontSize: "11px", color: "#10b981" }}>운영 중 {productCount > 0 && `(${productCount}개)`}</span>
        </Card>

        <Card
          className="function-card"
          onClick={() => handleCardClick("/store/inventory")}
          style={{ cursor: "pointer", transition: "transform 0.2s" }}
          onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ width: "40px", height: "40px", background: "rgba(30, 64, 136, 0.1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
            <Boxes size={20} style={{ color: "#1e3a8a" }} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>재고 관리</h2>
          <p style={{ fontSize: "13px", color: "#475569", marginBottom: "8px" }}>점포 재고 현황 확인</p>
          <span style={{ fontSize: "11px", color: "#f6e05e" }}>실시간 연동 {lowStockCount > 0 && `(${lowStockCount}부족)`}</span>
        </Card>

        <Card
          className="function-card"
          onClick={() => handleCardClick("/store/orders/specs/new")}
          style={{ cursor: "pointer", transition: "transform 0.2s" }}
          onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ width: "40px", height: "40px", background: "rgba(30, 64, 136, 0.1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
            <Sparkles size={20} style={{ color: "#1e3a8a" }} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>자동발주</h2>
          <p style={{ fontSize: "13px", color: "#475569", marginBottom: "8px" }}>판매량을 기반으로 발주 자동화</p>
          <span style={{ fontSize: "11px", color: "#3b82f6" }}>사용 가능 {recommendedCount > 0 && `(${recommendedCount}건)`}</span>
        </Card>
      </div>
    </>
  );
}