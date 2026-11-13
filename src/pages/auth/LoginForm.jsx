import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Store, UserRound } from "lucide-react";
import { Button, Input } from "../../components/ui";
import { getApiError } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginForm({ admin = false, initialRole }) {
  const defaultRole = initialRole || (admin ? "ADMIN" : "STORE");
  const [role, setRole] = useState(defaultRole);
  const [form, setForm] = useState(
    defaultRole === "ADMIN"
      ? { admin_username: "", password: "" }
      : { storeCode: "", password: "" },
  );
  const [error, setError] = useState("");
  const auth = useAuth();
  const { login, loading } = auth || {};
  const navigate = useNavigate();
  const location = useLocation();
  const adminRole = role === "ADMIN";
  const credentialKey = adminRole ? "admin_username" : "store_code";
  const handleRoleChange = (event) => {
    const nextRole = event.target.value;
    setRole(nextRole);
    setForm({
      [nextRole === "ADMIN" ? "admin_username" : "store_code"]: "",
      password: "",
    });
    setError("");
    navigate(nextRole === "ADMIN" ? "/admin/login" : "/login", {
      replace: true,
    });
  };
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const user = await login(form, role);
      navigate(
        location.state?.from?.pathname || (adminRole ? "/admin" : "/store"),
        { replace: true },
      );
      return user;
    } catch (err) {
      setError(getApiError(err, "아이디 또는 비밀번호를 확인해주세요."));
    }
  };
  return (
    <form className="auth-form" onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}
      <label className="field">
        <span>로그인 유형</span>
        <select value={role} onChange={handleRoleChange}>
          <option value="STORE">점포 사용자</option>
          <option value="ADMIN">관리자</option>
        </select>
      </label>
      <Input
        label={adminRole ? "관리자 ID" : "점포 코드"}
        placeholder={
          adminRole
            ? "관리자 ID를 입력하세요"
            : "발급받은 점포 코드를 입력하세요"
        }
        value={form[credentialKey] || ""}
        onChange={(e) => setForm({ ...form, [credentialKey]: e.target.value })}
        required
        autoComplete="username"
      />
      <Input
        label="비밀번호"
        type="password"
        placeholder="비밀번호를 입력하세요"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
        autoComplete="current-password"
      />
      <Button type="submit" loading={loading} className="full-btn">
        {adminRole ? <UserRound size={17} /> : <Store size={17} />}로그인
        <ArrowRight size={17} />
      </Button>
    </form>
  );
}
