import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout";
export default function StoreLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
