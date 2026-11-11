import { useEffect, useState } from "react";
import { Activity, CircleAlert, Store, Users } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Badge,
  Card,
  EmptyState,
  Loading,
  StatCard,
} from "../../components/ui";
import { Header } from "../../components/layout";
import { getStoreId, getStores } from "../../services/storeService";
import { getApiError } from "../../services/api";

export default function AdminDashboard() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    getStores()
      .then((data) =>
        setStores(Array.isArray(data) ? data : data?.stores || []),
      )
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, []);
  const active = stores.filter(
    (store) => String(store.status || "").toUpperCase() === "ACTIVE",
  ).length;
  const suspended = stores.length - active;
  return (
    <>
      <Header
        title="대시보드"
        description="전체 점포 운영 현황을 한눈에 확인하세요."
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard label="전체 점포" value={stores.length} icon={Store} />
            <StatCard
              label="운영 중"
              value={active}
              icon={Activity}
              tone="green"
            />
            <StatCard
              label="이용 정지"
              value={suspended}
              icon={CircleAlert}
              tone="orange"
            />
            <StatCard label="관리자" value="-" icon={Users} tone="purple" />
          </div>
          <div className="content-grid">
            <Card>
              <div className="card-title">
                <div>
                  <h2>최근 점포</h2>
                  <p>최근 등록된 점포 목록입니다.</p>
                </div>
                <Link className="text-link" to="/admin/stores">
                  전체 보기
                </Link>
              </div>
              {stores.length ? (
                <div className="mini-list">
                  {stores.slice(0, 5).map((store) => (
                    <Link
                      className="mini-row"
                      to={`/admin/stores/${getStoreId(store)}`}
                      key={getStoreId(store)}
                    >
                      <span className="avatar">
                        {(store.name || store.storeName || "점").slice(0, 1)}
                      </span>
                      <span>
                        <strong>{store.name || store.storeName}</strong>
                        <small>{store.code || store.storeCode || "-"}</small>
                      </span>
                      <Badge
                        status={
                          String(store.status || "").toLowerCase() === "active"
                            ? "active"
                            : "suspended"
                        }
                      >
                        {String(store.status || "").toUpperCase() === "ACTIVE"
                          ? "운영 중"
                          : "정지"}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState>등록된 점포가 없습니다.</EmptyState>
              )}
            </Card>
            <Card className="quick-card">
              <h2>점포 관리</h2>
              <p>새로운 점포를 등록하거나 운영 상태를 관리할 수 있습니다.</p>
              <Link className="btn btn-primary" to="/admin/stores/new">
                점포 등록하기
              </Link>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
