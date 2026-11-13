const buildPageList = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const candidates = new Set(
    [1, totalPages, page - 1, page, page + 1].filter(
      (value) => value >= 1 && value <= totalPages,
    ),
  );
  const sorted = [...candidates].sort((a, b) => a - b);
  const result = [];
  let previous = 0;
  for (const value of sorted) {
    if (value - previous > 1) result.push("...");
    result.push(value);
    previous = value;
  }
  return result;
};

export default function Pagination({
  page,
  totalPages,
  onChange,
  disabled = false,
  total,
}) {
  if (!totalPages) return null;

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        <span>
          총 <strong>{Number(total ?? 0).toLocaleString()}</strong>건
        </span>
        <span className="muted">
          {page} / {totalPages} 페이지
        </span>
      </div>
      <div className="pagination-nav">
        <button
          type="button"
          className="page-btn"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          이전
        </button>
        {buildPageList(page, totalPages).map((value, index) =>
          value === "..." ? (
            <span key={`ellipsis-${index}`} className="page-ellipsis">
              …
            </span>
          ) : (
            <button
              key={value}
              type="button"
              className={`page-btn${value === page ? " active" : ""}`}
              disabled={disabled}
              onClick={() => onChange(value)}
            >
              {value}
            </button>
          ),
        )}
        <button
          type="button"
          className="page-btn"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          다음
        </button>
      </div>
    </div>
  );
}
