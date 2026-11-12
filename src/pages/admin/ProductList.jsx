import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";
import { Badge, Card, EmptyState, Loading, StatCard } from "../../components/ui";
import { Header } from "../../components/layout";
import { getApiError } from "../../services/api";
import { getProducts } from "../../services/productService";



export default function ProductList() {


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [products, setProducts] = useState([]);
 const loadProducts = () => {
  setLoading(true);
  setError("");
  getProducts()
    .then((data) => setProducts(Array.isArray(data) ? data : []))
    .catch((err) => setError(getApiError(err, "상품 목록을 불러오는 중 오류가 발생했습니다.")))
    .finally(() => setLoading(false));
};

  useEffect(() => {
    getProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) =>
        setError(getApiError(err, "상품 목록을 불러오는 중 오류가 발생했습니다."))
      )
      .finally(() => setLoading(false));
  }, []);

  // 전체 카테고리 목록 추출
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // 검색어 및 카테고리 필터링
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "ALL" || p.category === selectedCategory;
      const matchesQuery =
        !query.trim() ||
        `${p.product_name || ""} ${p.category || ""} ${p.product_id || ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, query, selectedCategory]);

  // 필터(검색어, 카테고리) 변경 시 현재 페이지 1로 동기화 (React 권장 렌더링 중 상태 조정 패턴)
  const [prevFilter, setPrevFilter] = useState({ query: "", category: "ALL" });
  if (prevFilter.query !== query || prevFilter.category !== selectedCategory) {
    setPrevFilter({ query, category: selectedCategory });
    setCurrentPage(1);
  }

  // 전체 페이지 수 계산 (상품이 없어도 최소 1페이지 보장)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // 상품 데이터 갱신/필터링으로 현재 페이지가 범위를 벗어나면 유효한 페이지로 즉시 보정
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  // 현재 페이지 상품 계산
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // 페이지 사이즈 변경 핸들러
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // 페이지 번호 목록 생성 (생략 기호 ... 처리)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }, [currentPage, totalPages]);

  // 현재 표시 중인 상품 범위 계산
  const totalCount = filtered.length;
  const startCount = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endCount = Math.min(currentPage * pageSize, totalCount);

  return (
    <>
      <Header
        title="상품 관리"
        description="본사 공용 상품 카탈로그 및 등록된 상품 목록을 조회합니다."
      />

      <div className="stats-grid">
        <StatCard
          label="전체 상품 수"
          value={products.length}
          icon={Package}
          tone="blue"
        />
        <StatCard
          label="카테고리 수"
          value={categories.length}
          icon={Package}
          tone="purple"
        />
      </div>

      <div className="toolbar">
        <div style={{ display: "flex", gap: "10px", flex: 1, flexWrap: "wrap" }}>
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="상품명, 상품 코드, 카테고리 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="field" style={{ margin: 0, minWidth: "160px" }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">전체 카테고리</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadProducts}
          disabled={loading}
          title="새로고침"
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          새로고침
        </button>
      </div>

      <Card className="table-card">
        {loading ? (
          <Loading label="상품 목록을 불러오는 중..." />
        ) : error ? (
          <div style={{ padding: "24px" }}>
            <div className="alert alert-error">{error}</div>
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={loadProducts}
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : filtered.length ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>상품 코드</th>
                    <th>상품명</th>
                    <th>카테고리</th>
                    <th style={{ textAlign: "right" }}>판매 가격</th>
                    <th style={{ textAlign: "center" }}>상품 상태</th>
                    <th>등록일자</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => (
                    <tr key={product.product_id}>
                      <td className="muted" style={{ fontFamily: "monospace" }}>
                        #{product.product_id}
                      </td>
                      <td>
                        <strong>{product.product_name}</strong>
                      </td>
                      <td>
                        <span className="badge" style={{ background: "#f1f5f9", color: "#334155" }}>
                          {product.category}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {Number(product.price).toLocaleString()}원
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {/* 실제 DB products 테이블에는 status 컬럼이 없으므로 기본 활성 상태 표기 */}
                        <Badge status="active">정상</Badge>
                      </td>
                      <td className="muted">
                        {product.created_at
                          ? new Date(product.created_at).toLocaleDateString("ko-KR")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination-bar">
              <div className="pagination-info">
                <span>
                  전체 <strong>{totalCount.toLocaleString()}</strong>개 중{" "}
                  <strong>
                    {startCount}~{endCount}
                  </strong>
                  개 표시
                </span>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span>페이지당</span>
                  <select
                    className="pagination-size-select"
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  >
                    <option value={10}>10개</option>
                    <option value={20}>20개</option>
                    <option value={50}>50개</option>
                  </select>
                </label>
              </div>

              <div className="pagination-nav">
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                  title="처음 페이지"
                  aria-label="처음 페이지"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  title="이전 페이지"
                  aria-label="이전 페이지"
                >
                  <ChevronLeft size={16} />
                </button>

                {pageNumbers.map((num, idx) =>
                  num === "..." ? (
                    <span key={`ellipsis-${idx}`} className="page-ellipsis">
                      …
                    </span>
                  ) : (
                    <button
                      key={num}
                      type="button"
                      className={`page-btn ${currentPage === num ? "active" : ""}`}
                      onClick={() => setCurrentPage(num)}
                      aria-label={`${num}페이지`}
                      aria-current={currentPage === num ? "page" : undefined}
                    >
                      {num}
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  title="다음 페이지"
                  aria-label="다음 페이지"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                  title="마지막 페이지"
                  aria-label="마지막 페이지"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState>
            {query || selectedCategory !== "ALL"
              ? "검색 조건과 일치하는 상품이 없습니다."
              : "등록된 상품이 없습니다."}
          </EmptyState>
        )}
      </Card>
    </>
  );
}
