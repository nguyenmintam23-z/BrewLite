"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CustomerNav from "../../customer-nav";
import {
  customerRequest,
  formatCustomerMoney,
  getCustomerErrorMessage,
  isRecordValue,
  customerStatusLabel,
} from "../../customer-api";
import { CustomerCartItem, readCustomerCart, writeCustomerCart } from "../../cart-store";

type ProductOption = {
  id: string;
  optionType: string;
  name: string;
  priceAdjustment: string;
};

type ProductDetails = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  stockQuantity: number;
  options: ProductOption[];
};

function parseProduct(value: unknown): ProductDetails {
  if (
    !isRecordValue(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !(typeof value.description === "string" || value.description === null) ||
    typeof value.price !== "string" ||
    typeof value.stockQuantity !== "number" ||
    !Array.isArray(value.options)
  ) {
    throw new Error("Dữ liệu đồ uống từ API không đúng định dạng.");
  }
  const options = value.options.map((option): ProductOption => {
    if (
      !isRecordValue(option) ||
      typeof option.id !== "string" ||
      typeof option.optionType !== "string" ||
      typeof option.name !== "string" ||
      typeof option.priceAdjustment !== "string"
    ) {
      throw new Error("Dữ liệu tùy chọn từ API không đúng định dạng.");
    }
    return {
      id: option.id,
      optionType: option.optionType,
      name: option.name,
      priceAdjustment: option.priceAdjustment,
    };
  });
  return {
    id: value.id,
    name: value.name,
    description: value.description,
    price: value.price,
    stockQuantity: value.stockQuantity,
    options,
  };
}

function CustomerProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void customerRequest(`/products/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
      .then(parseProduct)
      .then(setProduct)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(getCustomerErrorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id]);

  const optionGroups = useMemo(() => {
    const groups = new Map<string, ProductOption[]>();
    for (const option of product?.options ?? []) {
      const current = groups.get(option.optionType) ?? [];
      current.push(option);
      groups.set(option.optionType, current);
    }
    return [...groups.entries()];
  }, [product]);

  const selected = useMemo(
    () =>
      (product?.options ?? []).filter((option) =>
        (selectedOptions[option.optionType] ?? []).includes(option.id),
      ),
    [product, selectedOptions],
  );
  const estimatedUnitPrice =
    Number(product?.price ?? 0) +
    selected.reduce((total, option) => total + Number(option.priceAdjustment), 0);

  function chooseOption(option: ProductOption, checked: boolean) {
    setSelectedOptions((current) => {
      const selectedForType = current[option.optionType] ?? [];
      const isTopping = option.optionType === "TOPPING";
      const next = checked
        ? isTopping
          ? [...selectedForType, option.id]
          : [option.id]
        : selectedForType.filter((id) => id !== option.id);
      return { ...current, [option.optionType]: next };
    });
  }

  function addToCart() {
    if (!product) return;
    const optionIds = selected.map((option) => option.id).sort();
    const key = `${product.id}:${optionIds.join(",")}`;
    const displayOptions: Record<string, string | string[]> = {};
    for (const option of selected) {
      const current = displayOptions[option.optionType];
      if (current === undefined) {
        displayOptions[option.optionType] = option.name;
      } else if (Array.isArray(current)) {
        current.push(option.name);
      } else {
        displayOptions[option.optionType] = [current, option.name];
      }
    }
    const cart = readCustomerCart();
    const existing = cart.find((item) => item.key === key);
    const nextItem: CustomerCartItem = {
      key,
      productId: product.id,
      productName: product.name,
      basePrice: product.price,
      optionIds,
      optionPriceAdjustments: selected.map((option) => option.priceAdjustment),
      selectedOptions: displayOptions,
      quantity: (existing?.quantity ?? 0) + quantity,
    };
    writeCustomerCart([
      ...cart.filter((item) => item.key !== key),
      nextItem,
    ]);
    setNotice("Đã thêm món vào giỏ hàng.");
  }

  return (
    <main className="manager-shell">
      <div className="manager-container">
        <CustomerNav />
        <p className="customer-back-link"><Link href="/customer/menu">← Quay lại thực đơn</Link></p>
        {loading ? (
          <section className="manager-state" role="status"><span className="loading-indicator" aria-hidden="true" /><p>Đang tải đồ uống…</p></section>
        ) : error ? (
          <section className="manager-state manager-state-error" role="alert"><h2>Không tải được đồ uống</h2><p>{error}</p><Link className="button manager-state-action" href="/customer/menu">Về thực đơn</Link></section>
        ) : !product ? (
          <section className="manager-state"><h2>Không tìm thấy đồ uống</h2><Link className="button manager-state-action" href="/customer/menu">Về thực đơn</Link></section>
        ) : (
          <article className="manager-card customer-detail-card">
            <div className="customer-product-mark" aria-hidden="true">☕</div>
            <p className="eyebrow">CHI TIẾT ĐỒ UỐNG</p>
            <h1>{product.name}</h1>
            <p className="customer-product-description customer-detail-description">{product.description || "Món uống thơm ngon được pha chế tại BrewLite."}</p>
            <p className="customer-detail-price">{formatCustomerMoney(product.price)} <span>Giá cơ bản</span></p>
            <p className="customer-stock-note">{product.stockQuantity > 0 ? `Còn ${product.stockQuantity} phần` : "Tạm hết hàng"}</p>

            {optionGroups.length > 0 && (
              <div className="customer-option-groups">
                {optionGroups.map(([type, options]) => (
                  <fieldset className="customer-option-group" key={type}>
                    <legend>{customerStatusLabel(type)}{type === "TOPPING" ? " · Có thể chọn nhiều" : ""}</legend>
                    <div className="customer-option-list">
                      {options.map((option) => {
                        const checked = (selectedOptions[type] ?? []).includes(option.id);
                        return (
                          <label className={`customer-option${checked ? " checked" : ""}`} key={option.id}>
                            <input
                              type={type === "TOPPING" ? "checkbox" : "radio"}
                              name={`option-${type}`}
                              checked={checked}
                              onChange={(event) => chooseOption(option, event.target.checked)}
                            />
                            <span>{option.name}</span>
                            <strong>{Number(option.priceAdjustment) > 0 ? `+${formatCustomerMoney(option.priceAdjustment)}` : formatCustomerMoney(option.priceAdjustment)}</strong>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            )}

            <div className="customer-add-row">
              <label className="field">
                <span>Số lượng</span>
                <input type="number" min="1" max={Math.max(product.stockQuantity, 1)} step="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(Number(event.target.value) || 1, product.stockQuantity || 1)))} />
              </label>
              <div className="customer-estimate"><span>Đơn giá tạm tính</span><strong>{formatCustomerMoney(estimatedUnitPrice)}</strong></div>
              <button className="button customer-add-button" type="button" disabled={product.stockQuantity === 0} onClick={addToCart}>Thêm vào giỏ</button>
            </div>
            {notice && <p className="feedback success" role="status">{notice}</p>}
            <p className="customer-price-disclaimer">Giá và tồn kho cuối cùng sẽ được máy chủ kiểm tra khi đặt hàng.</p>
          </article>
        )}
      </div>
    </main>
  );
}

export default function CustomerProductPage() {
  return (
    <Suspense fallback={<main className="manager-shell"><section className="manager-state" role="status">Đang mở đồ uống…</section></main>}>
      <CustomerProductDetails />
    </Suspense>
  );
}
