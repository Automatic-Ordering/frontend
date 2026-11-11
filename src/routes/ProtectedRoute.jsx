import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
export default function ProtectedRoute({ role }) {
  const auth = useAuth(); const user = auth?.user; const location = useLocation()
  if (!user) return <Navigate to={role === 'ADMIN' ? '/admin/login' : '/login'} state={{ from: location }} replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/store'} replace />
  return <Outlet />
}
