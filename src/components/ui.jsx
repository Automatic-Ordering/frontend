import { LoaderCircle, Search } from "lucide-react";
export function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
  );
}
export function SearchInput({
  placeholder = "검색",
  value,
  onChange,
  onSearch,
}) {
  return (
    <div className="search-box compact">
      <Search size={18} />
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onSearch) onSearch();
        }}
      />
    </div>
  );
}
export function Input({ label, error, ...props }) {
  return (
    <label className="field">
      {label && <span>{label}</span>}
      <input {...props} />
      {error && <small className="error">{error}</small>}
    </label>
  );
}
export function Card({ children, className = "" }) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Badge({ children, status = "active" }) {
  return <span className={`badge badge-${status}`}>{children}</span>;
}
export function Loading({ label = "불러오는 중..." }) {
  return (
    <div className="loading">
      <LoaderCircle className="spin" size={22} />
      {label}
    </div>
  );
}
export function EmptyState({ children = "표시할 데이터가 없습니다." }) {
  return <div className="empty">{children}</div>;
}
export function StatCard({ label, value, icon: Icon, tone = "blue" }) {
  return (
    <Card className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </Card>
  );
}
