import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import AdminLayout from "../layouts/AdminLayout";
import StoreLayout from "../layouts/StoreLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminOrderApprovals from "../pages/admin/AdminOrderApprovals";
import AdminIssuedOrders from "../pages/admin/AdminIssuedOrders";
import StoreList from "../pages/admin/StoreList";
import StoreCreate from "../pages/admin/StoreCreate";
import StoreDetail from "../pages/admin/StoreDetail";
import ProductList from "../pages/admin/ProductList";
import StoreDashboard from "../pages/store/StoreDashboard";
import StoreInventory from "../pages/store/StoreInventory";
import StoreSales from "../pages/store/StoreSales";
import StoreSaleCreate from "../pages/store/StoreSaleCreate";
import StoreOrderRecommendations from "../pages/store/StoreOrderRecommendations";
import StoreOrderSpecCreate from "../pages/store/StoreOrderSpecCreate";
import StoreOrderSpecList from "../pages/store/StoreOrderSpecList";
import StoreReceipts from "../pages/store/StoreReceipts";
import StoreOrderSettings from "../pages/store/StoreOrderSettings";
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
          <Route path="/admin/orders" element={<AdminOrderApprovals />} />
          <Route path="/admin/orders/issued" element={<AdminIssuedOrders />} />
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
          <Route path="/store/sales" element={<StoreSales />} />
          <Route path="/store/sales/new" element={<StoreSaleCreate />} />
          <Route
            path="/store/orders/recommendations"
            element={<StoreOrderRecommendations />}
          />
          <Route
            path="/store/orders/specs/new"
            element={<StoreOrderSpecCreate />}
          />
          <Route path="/store/orders/specs" element={<StoreOrderSpecList />} />
          <Route path="/store/orders/receipts" element={<StoreReceipts />} />
          <Route
            path="/store/orders"
            element={<Navigate to="/store/orders/specs" replace />}
          />
          <Route path="/store/order-settings" element={<StoreOrderSettings />} />
          <Route path="/store/order-settings" element={<StoreOrderSettings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
