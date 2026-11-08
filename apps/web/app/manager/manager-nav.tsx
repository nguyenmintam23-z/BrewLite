import Link from "next/link";

export default function ManagerNav() {
  return (
    <nav className="manager-topline" aria-label="Điều hướng quản lý">
      <Link className="home-link" href="/">
        <span aria-hidden="true">←</span> Trang đăng nhập
      </Link>
      <div className="manager-nav-links">
        <Link href="/manager/orders">Đơn hàng</Link>
        <Link href="/manager/products">Đồ uống</Link>
        <Link href="/manager/reports">Báo cáo</Link>
      </div>
      <span className="sprint-tag">BrewLite · Quản lý</span>
    </nav>
  );
}
