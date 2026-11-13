import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, KeyRound, Plus, Search } from "lucide-react";
import { Badge, Button, Card, EmptyState, Loading } from "../../components/ui";
import { Header } from "../../components/layout";
import { getApiError } from "../../services/api";
import {
  getStoreId,
  getStores,
  resetStorePassword,
} from "../../services/storeService";

export default function StoreList() {
  const [stores, setStores] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 비밀번호 초기화 모달 상태
  const [resetTarget, setResetTarget] = useState(null); // 선택된 점포
  const [resetStep, setResetStep] = useState("confirm"); // "confirm" | "result"
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

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

  // 모달 열기
  const openResetModal = (store) => {
    setResetTarget(store);
    setResetStep("confirm");
    setResetting(false);
    setTempPassword("");
    setResetError("");
    setCopied(false);
    setCopyError("");
  };

  // 모달 닫기
  const closeResetModal = () => {
    setResetTarget(null);
    setResetStep("confirm");
    setResetting(false);
    setTempPassword("");
    setResetError("");
    setCopied(false);
    setCopyError("");
  };

  // 비밀번호 초기화 실행
  const handleReset = async () => {
    if (!resetTarget || resetting) return;
    setResetting(true);
    setResetError("");
    try {
      const result = await resetStorePassword(getStoreId(resetTarget));
      const pwd =
        result?.data?.temporaryPassword || result?.temporaryPassword || "";
      if (!pwd) {
        setResetError("응답에 임시 비밀번호가 없습니다. 다시 시도해 주세요.");
        return;
      }
      setTempPassword(pwd);
      setResetStep("result");
    } catch (err) {
      setResetError(getApiError(err, "비밀번호 초기화에 실패했습니다."));
    } finally {
      setResetting(false);
    }
  };

  // 복사
  const handleCopy = async () => {
    if (!tempPassword) return;
    if (!navigator.clipboard?.writeText) {
      setCopied(false);
      setCopyError(
        "클립보드를 사용할 수 없습니다. 임시 비밀번호를 직접 선택해 복사해 주세요.",
      );
      return;
    }
    setCopyError("");
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError(
        "복사에 실패했습니다. 임시 비밀번호를 직접 선택해 복사해 주세요.",
      );
    }
  };

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
                  <th style={{ textAlign: "center" }}>관리</th>
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
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "13px", padding: "4px 10px" }}
                        onClick={() => openResetModal(s)}
                      >
                        <KeyRound size={14} />
                        비밀번호 초기화
                      </button>
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

      {/* 비밀번호 초기화 모달 */}
      {resetTarget && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeResetModal}
        >
          <div
            className="modal-content"
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "28px 32px",
              maxWidth: "440px",
              width: "90%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {resetStep === "confirm" ? (
              <>
                <h3 style={{ margin: "0 0 16px", fontSize: "18px" }}>
                  비밀번호 초기화
                </h3>
                <p
                  style={{
                    margin: "0 0 8px",
                    color: "#334155",
                    lineHeight: 1.6,
                  }}
                >
                  <strong>{resetTarget.name || resetTarget.storeName}</strong>{" "}
                  점포의 비밀번호를 초기화하시겠습니까?
                </p>
                <p
                  style={{
                    margin: "0 0 20px",
                    color: "#94a3b8",
                    fontSize: "14px",
                  }}
                >
                  초기화하면 기존 비밀번호로 로그인할 수 없습니다.
                </p>
                {resetError && (
                  <div
                    className="alert alert-error"
                    style={{ marginBottom: "16px" }}
                  >
                    {resetError}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button variant="secondary" onClick={closeResetModal}>
                    취소
                  </Button>
                  <Button loading={resetting} onClick={handleReset}>
                    초기화
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ margin: "0 0 16px", fontSize: "18px" }}>
                  비밀번호 초기화 완료
                </h3>
                <p
                  style={{
                    margin: "0 0 12px",
                    color: "#334155",
                    lineHeight: 1.6,
                  }}
                >
                  새 임시 비밀번호를 점포에 전달해 주세요.
                </p>
                <div
                  className="credential"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "20px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#64748b" }}>
                    임시 비밀번호
                  </span>
                  <strong
                    style={{
                      flex: 1,
                      fontFamily: "monospace",
                      fontSize: "16px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {tempPassword}
                  </strong>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "13px", padding: "4px 10px" }}
                    onClick={handleCopy}
                  >
                    <Copy size={14} />
                    {copied ? "복사됨" : "복사"}
                  </button>
                </div>
                {copyError && (
                  <div
                    className="alert alert-error"
                    style={{ marginBottom: "20px" }}
                  >
                    {copyError}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button onClick={closeResetModal}>닫기</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
