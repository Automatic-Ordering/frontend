import { LoaderCircle } from "lucide-react";
export function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
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
