import LoginLayout from "./LoginLayout";
import LoginForm from "./LoginForm";

export default function LoginPage({ initialRole = "STORE" }) {
  return (
    <LoginLayout
      title="AutoOrder"
      subtitle="편의점 스마트 자동발주 시스템"
      portal="AUTO-ORDER"
    >
      <LoginForm initialRole={initialRole} />
    </LoginLayout>
  );
}
