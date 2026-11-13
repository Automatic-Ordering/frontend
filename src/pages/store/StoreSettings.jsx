import { useEffect, useState } from "react";
import { Button, Card, Input } from "../../components/ui";
import { Header } from "../../components/layout";
import { useAuth } from "../../contexts/AuthContext";
import { changePassword } from "../../services/authService";
import { getApiError } from "../../services/api";

export default function StoreSettings() {
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeLoading, setStoreLoading] = useState(true);

  // 점포 정보 조회
  useEffect(() => {
    refreshUser()
      .catch((err) => {
        setError(getApiError(err, "점포 정보를 불러오지 못했습니다."));
      })
      .finally(() => {
        setStoreLoading(false);
      });
  }, [refreshUser]);

  // 입력값 변경
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 비밀번호 변경
  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (form.newPassword !== form.confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      await changePassword({
        current_password: form.currentPassword,
        new_password: form.newPassword,
      });

      setMessage("비밀번호가 변경되었습니다.");

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(getApiError(err, "비밀번호 변경에 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header
        title="점포 설정"
        description="점포 정보와 계정 보안을 관리하세요."
      />

      <div className="settings-grid">
        <Card>
          <h2>점포 정보</h2>

          <div className="info-list">
            <div>
              <span>점포명</span>
              <strong>
                {storeLoading
                  ? "조회 중..."
                  : user?.name || user?.storeName || "-"}
              </strong>
            </div>

            <div>
              <span>점포 코드</span>
              <strong>
                {storeLoading
                  ? "조회 중..."
                  : user?.code || user?.storeCode || "-"}
              </strong>
            </div>

            <div>
              <span>운영 상태</span>
              <strong className="status-text">
                {storeLoading
                  ? "조회 중..."
                  : user?.status === "ACTIVE"
                    ? "운영 중"
                    : user?.status === "INACTIVE"
                      ? "운영 중지"
                      : "-"}
              </strong>
            </div>
          </div>
        </Card>

        <Card>
          <h2>비밀번호 변경</h2>

          <form onSubmit={submit}>
            <Input
              label="현재 비밀번호"
              name="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={handleChange}
              required
            />

            <Input
              label="새 비밀번호"
              name="newPassword"
              type="password"
              value={form.newPassword}
              onChange={handleChange}
              required
            />

            <Input
              label="새 비밀번호 확인"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            {error && <div className="alert alert-error">{error}</div>}

            {message && <div className="alert alert-success">{message}</div>}

            <Button type="submit" loading={loading}>
              비밀번호 변경
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
