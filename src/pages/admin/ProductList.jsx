import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Package,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Loading,
  Modal,
  StatCard,
} from "../../components/ui";
import { Header } from "../../components/layout";
import { getApiError } from "../../services/api";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../services/productService";

const INITIAL_FORM = {
  product_name: "",
  category: "",
  price: "",
};

export default function ProductList() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingProductId, setEditingProductId] = useState(null);
  const [categories, setCategories] = useState([]);

  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadProducts = () => {
    setLoading(true);
    setError("");
    getProducts()
      .then((data) => {
        const arr = Array.isArray(data) ? data : data?.products || [];
        setProducts(arr);
        const catSet = new Set();
        arr.forEach((p) => {
          if (p.category) catSet.add(p.category);
        });
        setCategories(Array.from(catSet));
      })
      .catch((err) =>
        setError(
          getApiError(err, "상품 목록을 불러오는 중 오류가 발생했습니다."),
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // 검색어 및 카테고리 필터링
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "ALL" || p.category === selectedCategory;
      const matchesQuery =
        !query.trim() ||
        `${p.product_name || ""} ${p.category || ""} #${p.product_id || ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, query, selectedCategory]);

  // 필터 변경 시 현재 페이지 1로 동기화
  const [prevFilter, setPrevFilter] = useState({ query: "", category: "ALL" });
  if (prevFilter.query !== query || prevFilter.category !== selectedCategory) {
    setPrevFilter({ query, category: selectedCategory });
    setCurrentPage(1);
  }

  // 전체 페이지 수 계산
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  // 현재 페이지 상품 계산
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // 페이지 번호 목록 생성
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

  const totalCount = filtered.length;
  const startCount = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endCount = Math.min(currentPage * pageSize, totalCount);

  // 신규 등록 모달 열기
  const handleOpenCreate = () => {
    setOpenMenuId(null);
    setModalType("create");
    setEditingProductId(null);
    setFormData(INITIAL_FORM);
    setModalOpen(true);
  };

  // 수정 모달 열기
  const handleOpenEdit = async (product) => {
    const id = product.product_id;
    setOpenMenuId(null);
    setModalType("update");
    setEditingProductId(id);
    setFormData({
      product_name: product.product_name || "",
      category: product.category || "",
      price: String(product.price ?? ""),
    });
    setModalOpen(true);

    try {
      const res = await getProductById(id);
      const detail = res?.product || res;
      if (detail) {
        setFormData({
          product_name: detail.product_name || "",
          category: detail.category || "",
          price: String(detail.price ?? ""),
        });
      }
    } catch (err) {
      alert(getApiError(err, "상품 상세 정보를 불러오지 못했습니다."));
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalType("create");
    setFormData(INITIAL_FORM);
    setEditingProductId(null);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        product_name: formData.product_name.trim(),
        category: formData.category,
        price: Number(formData.price),
      };

      if (modalType === "create") {
        await createProduct(payload);
      } else {
        await updateProduct(editingProductId, payload);
      }
      handleModalClose();
      loadProducts();
    } catch (err) {
      alert(getApiError(err, "상품 저장에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    setOpenMenuId(null);
    if (!window.confirm("정말로 이 상품을 삭제하나요?")) return;
    try {
      await deleteProduct(productId);
      loadProducts();
    } catch (err) {
      alert(getApiError(err, "상품 삭제에 실패했습니다."));
    }
  };

  return (
    <>
      <Header
        title="상품 관리"
        description="본사 공용 상품 카탈로그 및 등록된 상품 목록을 관리합니다."
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
        <div
          style={{ display: "flex", gap: "10px", flex: 1, flexWrap: "wrap" }}
        >
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="상품명, 상품 코드(#번호), 카테고리 검색"
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

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginLeft: "auto",
            }}
          >
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              disabled={loading}
            >
              + 상품 등록
            </Button>
          </div>
        </div>
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
            <div className="table-wrap" style={{ overflow: "visible" }}>
              <table>
                <thead>
                  <tr>
                    <th>상품 코드</th>
                    <th>상품명</th>
                    <th>카테고리</th>
                    <th style={{ textAlign: "right" }}>판매 가격</th>
                    <th style={{ textAlign: "center" }}>상품 상태</th>
                    <th>등록일자</th>
                    <th style={{ width: "64px", textAlign: "center" }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => {
                    const isMenuOpen = openMenuId === product.product_id;
                    return (
                      <tr key={product.product_id}>
                        <td
                          className="muted"
                          style={{ fontFamily: "monospace" }}
                        >
                          #{product.product_id}
                        </td>
                        <td>
                          <strong>{product.product_name}</strong>
                        </td>
                        <td>
                          <span
                            style={{
                              background: "#f1f5f9",
                              color: "#334155",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                            }}
                          >
                            {product.category}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {Number(product.price).toLocaleString()}원
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <Badge status="active">정상</Badge>
                        </td>
                        <td className="muted">
                          {product.created_at
                            ? new Date(product.created_at).toLocaleDateString(
                                "ko-KR",
                              )
                            : "-"}
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            position: "relative",
                          }}
                        >
                          <div
                            ref={isMenuOpen ? menuRef : null}
                            style={{
                              position: "relative",
                              display: "inline-block",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId(
                                  isMenuOpen ? null : product.product_id,
                                )
                              }
                              aria-label="상품 관리 메뉴"
                              title="관리"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                border: "1px solid transparent",
                                background: isMenuOpen
                                  ? "#f1f5f9"
                                  : "transparent",
                                color: "#475569",
                                cursor: "pointer",
                              }}
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {isMenuOpen && (
                              <div
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: "calc(100% + 4px)",
                                  minWidth: "120px",
                                  background: "#ffffff",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "10px",
                                  boxShadow:
                                    "0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -4px rgba(15, 23, 42, 0.08)",
                                  padding: "4px",
                                  zIndex: 30,
                                  textAlign: "left",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(product)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    width: "100%",
                                    padding: "8px 10px",
                                    border: "none",
                                    borderRadius: "6px",
                                    background: "transparent",
                                    color: "#1e293b",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                      "#f8fafc")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      "transparent")
                                  }
                                >
                                  <Pencil size={14} />
                                  <span>수정</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(product.product_id)
                                  }
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    width: "100%",
                                    padding: "8px 10px",
                                    border: "none",
                                    borderRadius: "6px",
                                    background: "transparent",
                                    color: "#dc2626",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                      "#fef2f2")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      "transparent")
                                  }
                                >
                                  <Trash2 size={14} />
                                  <span>삭제</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>페이지당</span>
                  <select
                    className="pagination-size-select"
                    value={pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(Number(e.target.value))
                    }
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
                  ),
                )}

                <button
                  type="button"
                  className="page-btn"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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

      {/* 상품 등록/수정 모달 */}
      {modalOpen && (
        <Modal
          title={
            modalType === "create"
              ? "상품 등록"
              : `상품 수정 (#${editingProductId})`
          }
          onClose={handleModalClose}
        >
          <form
            onSubmit={handleModalSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {modalType === "update" && (
              <Input
                label="상품 코드 (자동 부여)"
                value={`#${editingProductId}`}
                disabled
              />
            )}
            <Input
              label="상품명"
              placeholder="예: 참치마요 삼각김밥"
              value={formData.product_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  product_name: e.target.value,
                })
              }
              required
            />
            <div className="field" style={{ margin: 0 }}>
              <label>카테고리</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                  })
                }
                required
              >
                <option value="">카테고리 선택</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="단가 (원)"
              placeholder="예: 1500"
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: e.target.value,
                })
              }
              required
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "12px",
              }}
            >
              <Button
                variant="secondary"
                type="button"
                onClick={handleModalClose}
                disabled={submitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "저장 중..."
                  : modalType === "create"
                    ? "등록"
                    : "수정"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}