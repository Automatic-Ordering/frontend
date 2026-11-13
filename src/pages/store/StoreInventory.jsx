import { useEffect, useMemo, useState } from "react";
import { Boxes, RefreshCw } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Loading,
  SearchInput,
  StatCard,
} from "../../components/ui";
import Pagination from "../../components/Pagination";
import { Header } from "../../components/layout";
import { getApiError } from "../../services/api";
import { getStoreProductsPage } from "../../services/productService";

const PAGE_SIZE = 20;

export default function StoreInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const loadProducts = ({ targetPage = 1, search = query.trim() } = {}) => {
    setLoading(true);
    setError("");
    getStoreProductsPage({
      page: targetPage,
      limit: PAGE_SIZE,
      search: search || undefined,
    })
      .then((data) => {
        setProducts(data.items || []);
        setTotalCount(Number(data.total ?? 0));
        setTotalPages(Number(data.total_pages ?? 0));
        setPage(Number(data.page ?? targetPage));
      })
      .catch((err) =>
        setError(
          getApiError(err, "재고 목록을 불러오는 중 오류가 발생했습니다."),
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSearch = () => {
    loadProducts({ targetPage: 1 });
  };

  const handleRetry = () => {
    loadProducts({ targetPage: page });
  };

  const handlePageChange = (targetPage) => {
    loadProducts({ targetPage });
  };

  const lowStockCount = useMemo(
    () =>
      products.filter(
        (product) => product.current_stock <= product.safety_stock,
      ).length,
    [products],
  );

  return (
    <>
      <Header
        title="재고 관리"
        description="점포에 등록된 상품의 재고 현황을 조회합니다."
      />

      <div className="stats-grid">
        <StatCard
          label="등록 상품 수"
          value={totalCount.toLocaleString()}
          icon={Boxes}
          tone="blue"
        />
        <StatCard
          label="안전 재고 이하 (현재 페이지)"
          value={lowStockCount}
          icon={Boxes}
          tone="purple"
        />
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <SearchInput
            placeholder="상품명, 카테고리 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onSearch={handleSearch}
          />
          <Button
            type="button"
            variant="secondary"
            className="btn-sm"
            onClick={handleSearch}
            disabled={loading}
          >
            조회
          </Button>
        </div>
        <div className="toolbar-right">
          <Button
            type="button"
            variant="secondary"
            className="btn-sm"
            onClick={handleRetry}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            새로고침
          </Button>
        </div>
      </div>

      <Card className="table-card">
        {loading ? (
          <Loading label="재고 목록을 불러오는 중..." />
        ) : error ? (
          <div style={{ padding: "24px" }}>
            <div className="alert alert-error">{error}</div>
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRetry}
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : products.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>상품 코드</th>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th style={{ textAlign: "right" }}>현재 재고</th>
                  <th style={{ textAlign: "right" }}>안전 재고</th>
                  <th style={{ textAlign: "center" }}>재고 상태</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isLowStock =
                    product.current_stock <= product.safety_stock;
                  return (
                    <tr key={product.product_id}>
                      <td className="muted" style={{ fontFamily: "monospace" }}>
                        #{product.product_id}
                      </td>
                      <td>
                        <strong>{product.product_name}</strong>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{ background: "#f1f5f9", color: "#334155" }}
                        >
                          {product.category || "-"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {Number(product.current_stock).toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {Number(product.safety_stock).toLocaleString()}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {isLowStock ? (
                          <span className="badge badge-suspended">
                            재고 부족
                          </span>
                        ) : (
                          <span className="badge badge-active">정상</span>
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
              : "등록된 재고 상품이 없습니다."}
          </EmptyState>
        )}
        {!loading && !error && products.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalCount}
            disabled={loading}
            onChange={handlePageChange}
          />
        )}
      </Card>
    </>
  );
}
