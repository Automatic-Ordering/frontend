import { useEffect, useState } from "react";
import { ArrowLeft, Ban, CheckCircle2, Edit3, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, Input, Loading } from "../../components/ui";
import { Header } from "../../components/layout";
import { getApiError } from "../../services/api";
import {
  deleteStore,
  getStore,
  updateStore,
  updateStoreStatus,
} from "../../services/storeService";
export default function StoreDetail() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    getStore(storeId)
      .then((data) => {
        const item = data?.store || data;
        setStore(item);
        setName(item?.name || item?.storeName || "");
      })
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [storeId]);
  const save = async () => {
    setSaving(true);
    try {
      const data = await updateStore(storeId, { store_name: name });
      setStore(data?.store || data);
      setEditing(false);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  };
  const toggle = async () => {
    setSaving(true);
    try {
      const status =
        String(store.status || "").toUpperCase() === "ACTIVE"
          ? "SUSPENDED"
          : "ACTIVE";
      const data = await updateStoreStatus(storeId, status);
      setStore(data?.store || data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  };
  const closeStore = async () => {
    if (
      !window.confirm(
        "이 점포를 폐점 처리하면 모든 점포 데이터가 영구 삭제됩니다. 계속하시겠습니까?",
      )
    )
      return;
    setSaving(true);
    try {
      await deleteStore(storeId);
      window.location.replace("/admin/stores");
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <Loading />;
  if (error || !store)
    return (
      <div className="alert alert-error">
        {error || "점포를 찾을 수 없습니다."}
      </div>
    );
  const active = String(store.status || "").toUpperCase() === "ACTIVE";
  return (
    <>
      <Header
        title="점포 상세"
        description="점포 정보와 운영 상태를 관리하세요."
      />
      <Link className="back-link" to="/admin/stores">
        <ArrowLeft size={17} />
        점포 목록
      </Link>
      <Card className="detail-card">
        <div className="detail-top">
          <div className="avatar avatar-large">
            {(store.name || store.storeName || "점").slice(0, 1)}
          </div>
          <div>
            <h2>{store.name || store.storeName}</h2>
            <p className="muted">{store.code || store.storeCode || "-"}</p>
          </div>
          <Badge status={active ? "active" : "suspended"}>
            {active ? "운영 중" : "이용 정지"}
          </Badge>
        </div>
        <div className="detail-grid">
          {editing ? (
            <>
              <Input
                label="점포명"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div />
            </>
          ) : (
            <>
              <div>
                <span className="detail-label">점포명</span>
                <strong>{store.name || store.storeName}</strong>
              </div>
              <div>
                <span className="detail-label">점포 코드</span>
                <strong>{store.code || store.storeCode || "-"}</strong>
              </div>
            </>
          )}
          <div>
            <span className="detail-label">생성 일자</span>
            <strong>
              {store.createdAt
                ? new Date(store.createdAt).toLocaleDateString("ko-KR")
                : "-"}
            </strong>
          </div>
        </div>
        <div className="button-row">
          {editing ? (
            <>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                취소
              </Button>
              <Button loading={saving} onClick={save}>
                저장
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Edit3 size={16} />
              점포명 수정
            </Button>
          )}
          <Button
            variant={active ? "danger" : "success"}
            loading={saving}
            onClick={toggle}
          >
            {active ? (
              <>
                <Ban size={16} />
                점포 이용 정지
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                점포 재활성화
              </>
            )}
          </Button>
          {!active && (
            <Button variant="danger" loading={saving} onClick={closeStore}>
              <Trash2 size={16} />
              폐점 처리
            </Button>
          )}
        </div>
      </Card>
    </>
  );
}
