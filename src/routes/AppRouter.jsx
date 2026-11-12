import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import AdminLayout from "../layouts/AdminLayout";
import StoreLayout from "../layouts/StoreLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import StoreList from "../pages/admin/StoreList";
import StoreCreate from "../pages/admin/StoreCreate";
import StoreDetail from "../pages/admin/StoreDetail";
import ProductList from "../pages/admin/ProductList";
import StoreDashboard from "../pages/store/StoreDashboard";
import StoreInventory from "../pages/store/StoreInventory";
import StoreSettings from "../pages/store/StoreSettings";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage initialRole="STORE" />} />
      <Route path="/admin/login" element={<LoginPage initialRole="ADMIN" />} />
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/stores" element={<StoreList />} />
          <Route path="/admin/stores/new" element={<StoreCreate />} />
          <Route path="/admin/stores/:storeId" element={<StoreDetail />} />
          <Route path="/admin/products" element={<ProductList />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute role="STORE" />}>
        <Route element={<StoreLayout />}>
          <Route path="/store" element={<StoreDashboard />} />
          <Route path="/store/inventory" element={<StoreInventory />} />
          <Route path="/store/settings" element={<StoreSettings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
