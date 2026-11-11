import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Badge, Card, EmptyState, Loading } from "../../components/ui";
import { Header } from "../../components/layout";
import { getApiError } from "../../services/api";
import { getStoreId, getStores } from "../../services/storeService";
export default function StoreList() {
  const [stores, setStores] = useState([]);
  const [query, setQuery] = useState("");
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
  const filtered = useMemo(
    () =>
      stores.filter((s) =>
        `${s.name || s.storeName} ${s.code || s.storeCode}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [stores, query],
  );
  return (
    <>
      <Header
        title="점포 관리"
        description="등록된 점포를 검색하고 관리하세요."
      />
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="점포명 또는 점포 코드 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Link className="btn btn-primary" to="/admin/stores/new">
          <Plus size={17} />
          점포 등록
        </Link>
      </div>
      <Card className="table-card">
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>점포명</th>
                  <th>점포 코드</th>
                  <th>운영 상태</th>
                  <th>생성 일자</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={getStoreId(s)}>
                    <td>
                      <Link
                        className="text-link"
                        to={`/admin/stores/${getStoreId(s)}`}
                      >
                        {s.name || s.storeName || "-"}
                      </Link>
                    </td>
                    <td className="muted">{s.code || s.storeCode || "-"}</td>
                    <td>
                      <Badge
                        status={
                          String(s.status || "").toLowerCase() === "active"
                            ? "active"
                            : "suspended"
                        }
                      >
                        {String(s.status || "").toUpperCase() === "ACTIVE"
                          ? "운영 중"
                          : "정지"}
                      </Badge>
                    </td>
                    <td className="muted">
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>검색 결과가 없습니다.</EmptyState>
        )}
      </Card>
    </>
  );
}
