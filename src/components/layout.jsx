import { NavLink, useNavigate } from "react-router-dom";
import {
  Boxes,
  ClipboardList,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackageCheck,
  Receipt,
  Settings,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export function Sidebar({ admin = false }) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const links = admin
    ? [
        ["/admin", "대시보드", LayoutDashboard],
        ["/admin/orders", "발주 승인 관리", ClipboardList],
        ["/admin/orders/issued", "발주서 관리", FileText],
        ["/admin/stores", "점포 관리", Store],
        ["/admin/stores/new", "점포 등록", Store],
        ["/admin/products", "상품 관리", Package],
      ]
    : [
        ["/store", "대시보드", LayoutDashboard],
        ["/store/inventory", "재고 관리", Boxes],
        ["/store/sales", "판매 내역", Receipt],
        ["/store/sales/new", "판매 등록", Receipt],
        ["/store/orders/recommendations", "자동 발주", ShoppingCart],
        ["/store/order-settings", "발주 기준 설정", SlidersHorizontal],
        ["/store/orders/specs/new", "명세서 작성", FilePlus2],
        ["/store/orders/specs", "발주 내역", ClipboardList],
        ["/store/orders/receipts", "입고 관리", PackageCheck],
        ["/store/settings", "점포 설정", Settings],
      ];
  const signOut = () => {
    logout();
    navigate(admin ? "/admin/login" : "/login");
  };
  return (
    <>
      <button
        className="mobile-menu"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
      >
        <Menu />
      </button>
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>AutoOrder</strong>
            <small>{admin ? "관리자 센터" : "점포 운영"}</small>
          </div>
          <button className="sidebar-close" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav>
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin" || to === "/store"}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="logout" onClick={signOut}>
          <LogOut size={18} />
          로그아웃
        </button>
      </aside>
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
    </>
  );
}

export function Header({ title, description }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </header>
  );
}
