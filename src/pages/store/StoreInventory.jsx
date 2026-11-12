import { useEffect, useMemo, useState } from "react";
import { Boxes, RefreshCw, Search } from "lucide-react";
import { Badge, Card, EmptyState, Loading, StatCard } from "../../components/ui";
import { Header } from "../../components/layout";
import { getApiError } from "../../services/api";
import { getStoreProducts } from "../../services/productService";

export default function StoreInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadProducts = () => {
    setLoading(true);
    setError("");
    getStoreProducts()
      .then((data) => setProducts(data.filter((product) => product.is_registered)))
      .catch((err) =>
        setError(getApiError(err, "재고 목록을 불러오는 중 오류가 발생했습니다.")),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((product) =>
      `${product.product_id} ${product.product_name || ""} ${product.category || ""}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [products, query]);

  const lowStockCount = products.filter(
    (product) => product.current_stock <= product.safety_stock,
  ).length;

  return (
    <>
      <Header title="재고 관리" description="점포에 등록된 상품의 재고 현황을 조회합니다." />

      <div className="stats-grid">
        <StatCard label="등록 상품 수" value={products.length} icon={Boxes} tone="blue" />
        <StatCard label="안전 재고 이하" value={lowStockCount} icon={Boxes} tone="purple" />
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="상품명, 상품 코드, 카테고리 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadProducts} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          새로고침
        </button>
      </div>

      <Card className="table-card">
        {loading ? (
          <Loading label="재고 목록을 불러오는 중..." />
        ) : error ? (
          <div style={{ padding: "24px" }}>
            <div className="alert alert-error">{error}</div>
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <button type="button" className="btn btn-primary" onClick={loadProducts}>다시 시도</button>
            </div>
          </div>
        ) : filteredProducts.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>상품 코드</th><th>상품명</th><th>카테고리</th><th style={{ textAlign: "right" }}>현재 재고</th><th style={{ textAlign: "right" }}>안전 재고</th><th style={{ textAlign: "center" }}>재고 상태</th></tr></thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isLowStock = product.current_stock <= product.safety_stock;
                  return <tr key={product.product_id}>
                    <td className="muted" style={{ fontFamily: "monospace" }}>#{product.product_id}</td>
                    <td><strong>{product.product_name}</strong></td>
                    <td><span className="badge" style={{ background: "#f1f5f9", color: "#334155" }}>{product.category || "-"}</span></td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{Number(product.current_stock).toLocaleString()}</td>
                    <td style={{ textAlign: "right" }}>{Number(product.safety_stock).toLocaleString()}</td>
                    <td style={{ textAlign: "center" }}><Badge status={isLowStock ? "suspended" : "active"}>{isLowStock ? "재고 부족" : "정상"}</Badge></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>{query ? "검색 결과가 없습니다." : "등록된 재고 상품이 없습니다."}</EmptyState>
        )}
      </Card>
    </>
  );
}
