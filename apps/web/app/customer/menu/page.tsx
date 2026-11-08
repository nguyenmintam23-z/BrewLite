"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CustomerNav from "../customer-nav";
import {
  customerRequest,
  formatCustomerMoney,
  getCustomerErrorMessage,
  isRecordValue,
} from "../customer-api";

type MenuProduct = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  stockQuantity: number;
  imageUrl: string;
};

const menuImageByName: Record<string, string> = {
  "Bạc xỉu": "/images/menu/bac-xiu.svg",
  "Cà phê sữa": "/images/menu/ca-phe-sua.svg",
  Espresso: "/images/menu/espresso.svg",
  "Matcha latte": "/images/menu/matcha-latte.svg",
  "Soda chanh dây": "/images/menu/soda-chanh-day.svg",
  "Trà đào": "/images/menu/tra-dao.svg",
  "Trà sữa trân châu": "/images/menu/tra-sua-tran-chau.svg",
  "Yuzu tea": "/images/menu/yuzu-tea.svg",
};

function resolveProductImage(name: string): string {
  return menuImageByName[name] ?? "/images/menu/default-drink.svg";
}

function parseProducts(value: unknown): MenuProduct[] {
  if (!Array.isArray(value)) {
    throw new Error("Dữ liệu thực đơn từ API không đúng định dạng.");
  }
  return value.map((product) => {
    if (
      !isRecordValue(product) ||
      typeof product.id !== "string" ||
      typeof product.name !== "string" ||
      !(typeof product.description === "string" || product.description === null) ||
      typeof product.price !== "string" ||
      typeof product.stockQuantity !== "number"
    ) {
      throw new Error("Thông tin đồ uống từ API không đúng định dạng.");
    }
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      imageUrl: resolveProductImage(product.name),
    };
  });
}

export default function CustomerMenuPage() {
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    void customerRequest("/products")
      .then(parseProducts)
      .then((result) => {
        if (active) setProducts(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setProducts([]);
          setError(getCustomerErrorMessage(cause));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  return (
    <main className="manager-shell">
      <div className="manager-container manager-container-wide">
        <CustomerNav />
        <header className="manager-heading customer-heading">
          <p className="eyebrow">THỰC ĐƠN BREWLITE</p>
          <h1>Chọn món yêu thích</h1>
          <p className="subtitle">Đồ uống và giá lấy trực tiếp từ thực đơn hiện có.</p>
        </header>

        {loading ? (
          <section className="manager-state" role="status">
            <span className="loading-indicator" aria-hidden="true" />
            <p>Đang tải thực đơn…</p>
          </section>
        ) : error ? (
          <section className="manager-state manager-state-error" role="alert">
            <h2>Không tải được thực đơn</h2>
            <p>{error}</p>
            <button
              className="button manager-state-action"
              type="button"
              onClick={() => {
                setError("");
                setLoading(true);
                setRetry((value) => value + 1);
              }}
            >
              Thử lại
            </button>
          </section>
        ) : products.length === 0 ? (
          <section className="manager-state">
            <h2>Thực đơn đang trống</h2>
            <p>Hiện chưa có đồ uống nào đang được bán.</p>
          </section>
        ) : (
          <section className="customer-product-grid" aria-label="Danh sách đồ uống">
            {products.map((product) => (
              <article className="customer-product-card" key={product.id}>
                <img className="customer-product-image" src={product.imageUrl} alt={product.name} />
                <p className="eyebrow">ĐỒ UỐNG BREWLITE</p>
                <h2>{product.name}</h2>
                <p className="customer-product-description">
                  {product.description || "Món uống thơm ngon được pha chế tại BrewLite."}
                </p>
                <div className="customer-product-pricing" aria-label={`Giá theo size cho ${product.name}`}>
                  <span>S: {formatCustomerMoney(product.price)}</span>
                  <span>M: {formatCustomerMoney((Number(product.price) + 10000).toString())}</span>
                  <span>L: {formatCustomerMoney((Number(product.price) + 20000).toString())}</span>
                </div>
                <div className="customer-product-bottom">
                  <div>
                    <strong>{formatCustomerMoney(product.price)}</strong>
                    <span>{product.stockQuantity > 0 ? `Còn ${product.stockQuantity} phần` : "Tạm hết hàng"}</span>
                  </div>
                  <Link className="button customer-product-link" href={`/customer/menu/${product.id}`}>
                    Chọn món
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
