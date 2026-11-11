import LoginLayout from './LoginLayout'
import LoginForm from './LoginForm'

export default function LoginPage({ initialRole = 'STORE' }) {
  return <LoginLayout title="로그인" subtitle="관리자 또는 점포 사용자로 로그인하세요" portal="AUTO-ORDER"><LoginForm initialRole={initialRole} /></LoginLayout>
}
