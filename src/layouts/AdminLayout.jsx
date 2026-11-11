import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout";
export default function AdminLayout() {
  return (
    <div className="app-shell">
      <Sidebar admin />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
