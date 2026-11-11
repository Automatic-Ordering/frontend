import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input } from "../../components/ui";
import { Header } from "../../components/layout";
import { createStore } from "../../services/storeService";
import { getApiError } from "../../services/api";
export default function StoreCreate() {
  const [form, setForm] = useState({ store_name: "", password: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await createStore(form);
      setResult(data?.store || data);
    } catch (err) {
      setError(getApiError(err, "점포 등록에 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };
  const code = result?.store_code || result?.code || result?.storeCode;
  if (result)
    return (
      <>
        <Header
          title="점포 등록 완료"
          description="점포에 전달할 로그인 정보를 확인하세요."
        />
        <Card className="success-card">
          <div className="success-icon">
            <Check />
          </div>
          <h2>점포가 등록되었습니다</h2>
          <p>아래 정보를 점포 담당자에게 안전하게 전달해주세요.</p>
          <div className="credential">
            <span>점포 코드</span>
            <strong>{code || "-"}</strong>
            <button onClick={() => navigator.clipboard?.writeText(code || "")}>
              <Copy size={16} />
              복사
            </button>
          </div>
          <div className="credential">
            <span>초기 비밀번호</span>
            <strong>{form.password}</strong>
            <KeyRound size={17} />
          </div>
          <div className="button-row">
            <Button
              variant="secondary"
              onClick={() => navigate("/admin/stores")}
            >
              목록으로
            </Button>
            <Button
              onClick={() => {
                setResult(null);
                setForm({ store_name: "", password: "" });
              }}
            >
              추가 등록
            </Button>
          </div>
        </Card>
      </>
    );
  return (
    <>
      <Header
        title="점포 등록"
        description="새 점포의 기본 정보를 입력하세요."
      />
      <Card className="form-card">
        <form onSubmit={submit}>
          <Input
            label="점포명"
            placeholder="예: 자동발주 강남점"
            value={form.store_name}
            onChange={(e) => setForm({ ...form, store_name: e.target.value })}
            required
          />
          <Input
            label="초기 비밀번호"
            type="password"
            placeholder="점포 담당자에게 전달할 비밀번호"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
          />
          <p className="helper">점포 코드는 백엔드에서 자동으로 발급됩니다.</p>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="button-row">
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate("/admin/stores")}
            >
              취소
            </Button>
            <Button type="submit" loading={loading}>
              점포 등록
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
