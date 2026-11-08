"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import ManagerNav from "../manager-nav";
import {
  formatMoney,
  getErrorMessage,
  isRecordValue,
  managerRequest,
} from "../manager-api";

const optionTypes = ["SIZE", "ICE_LEVEL", "SUGAR_LEVEL", "TOPPING"] as const;
type OptionType = (typeof optionTypes)[number];

type ProductOption = {
  id: string;
  optionType: OptionType;
  name: string;
  priceAdjustment: string;
  isAvailable: boolean;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  stockQuantity: number;
  isAvailable: boolean;
  options: ProductOption[];
};

type ProductDraft = {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
};

type OptionDraft = {
  optionType: OptionType;
  name: string;
  priceAdjustment: string;
};

const emptyProductDraft: ProductDraft = {
  name: "",
  description: "",
  price: "",
  stockQuantity: "0",
};

const emptyOptionDraft: OptionDraft = {
  optionType: "SIZE",
  name: "",
  priceAdjustment: "0",
};

const typeLabels: Record<OptionType, string> = {
  SIZE: "Size",
  ICE_LEVEL: "Mức đá",
  SUGAR_LEVEL: "Mức đường",
  TOPPING: "Topping",
};

function parseProducts(value: unknown): Product[] {
  if (!Array.isArray(value)) {
    throw new Error("Dữ liệu danh sách đồ uống từ API không đúng định dạng.");
  }

  return value.map((value) => {
    if (
      !isRecordValue(value) ||
      typeof value.id !== "string" ||
      typeof value.name !== "string" ||
      !(typeof value.description === "string" || value.description === null) ||
      typeof value.price !== "string" ||
      typeof value.stockQuantity !== "number" ||
      typeof value.isAvailable !== "boolean" ||
      !Array.isArray(value.options)
    ) {
      throw new Error("Dữ liệu đồ uống từ API không đúng định dạng.");
    }

    const options = value.options.map((option) => {
      if (
        !isRecordValue(option) ||
        typeof option.id !== "string" ||
        typeof option.optionType !== "string" ||
        !optionTypes.includes(option.optionType as OptionType) ||
        typeof option.name !== "string" ||
        typeof option.priceAdjustment !== "string" ||
        typeof option.isAvailable !== "boolean"
      ) {
        throw new Error("Dữ liệu tùy chọn từ API không đúng định dạng.");
      }

      return {
        id: option.id,
        optionType: option.optionType as OptionType,
        name: option.name,
        priceAdjustment: option.priceAdjustment,
        isAvailable: option.isAvailable,
      };
    });

    return {
      id: value.id,
      name: value.name,
      description: value.description,
      price: value.price,
      stockQuantity: value.stockQuantity,
      isAvailable: value.isAvailable,
      options,
    };
  });
}

function validateProductDraft(draft: ProductDraft) {
  const price = Number(draft.price);
  const stockQuantity = Number(draft.stockQuantity);
  if (!draft.name.trim()) return "Tên đồ uống không được để trống.";
  if (!Number.isFinite(price) || price < 0 || price > 99_999_999.99) {
    return "Giá phải từ 0 đến 99.999.999,99 VND.";
  }
  if (
    !/^\d+$/.test(draft.stockQuantity) ||
    !/^\d+(\.\d{1,2})?$/.test(draft.price) ||
    !Number.isInteger(stockQuantity) ||
    stockQuantity < 0 ||
    stockQuantity > 2_147_483_647
  ) {
    return "Giá tối đa 2 chữ số thập phân; số lượng là số nguyên từ 0 đến 2.147.483.647.";
  }
  return "";
}

export default function ManagerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [newProduct, setNewProduct] = useState(emptyProductDraft);
  const [productDrafts, setProductDrafts] = useState<Record<string, ProductDraft>>({});
  const [optionDrafts, setOptionDrafts] = useState<Record<string, OptionDraft>>({});
  const [newOptions, setNewOptions] = useState<Record<string, OptionDraft>>({});

  const fetchProducts = useCallback(async () => {
    return parseProducts(await managerRequest("/manager/products"));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProducts(await fetchProducts());
    } catch (cause) {
      setProducts([]);
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  useEffect(() => {
    let active = true;
    void fetchProducts()
      .then((result) => {
        if (active) setProducts(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setProducts([]);
          setError(getErrorMessage(cause));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchProducts, retry]);

  function retryProducts() {
    setError("");
    setLoading(true);
    setRetry((value) => value + 1);
  }

  function productDraft(product: Product): ProductDraft {
    return productDrafts[product.id] ?? {
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      stockQuantity: String(product.stockQuantity),
    };
  }

  function optionDraft(option: ProductOption): OptionDraft {
    return optionDrafts[option.id] ?? {
      optionType: option.optionType,
      name: option.name,
      priceAdjustment: option.priceAdjustment,
    };
  }

  function updateProductDraft(id: string, patch: Partial<ProductDraft>) {
    const current = products.find((product) => product.id === id);
    if (!current) return;
    setProductDrafts((drafts) => ({
      ...drafts,
      [id]: { ...productDraft(current), ...patch },
    }));
  }

  function updateOptionDraft(id: string, patch: Partial<OptionDraft>) {
    const option = products.flatMap((product) => product.options).find((item) => item.id === id);
    if (!option) return;
    setOptionDrafts((drafts) => ({
      ...drafts,
      [id]: { ...optionDraft(option), ...patch },
    }));
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateProductDraft(newProduct);
    if (validationError) {
      setError(validationError);
      return;
    }

    setCreating(true);
    setError("");
    setNotice("");
    try {
      await managerRequest("/products", {
        method: "POST",
        body: JSON.stringify({
          name: newProduct.name.trim(),
          description: newProduct.description.trim() || undefined,
          price: newProduct.price,
          stockQuantity: Number(newProduct.stockQuantity),
        }),
      });
      setNewProduct(emptyProductDraft);
      setNotice("Đã thêm đồ uống.");
      await loadProducts();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setCreating(false);
    }
  }

  async function saveProduct(product: Product) {
    const draft = productDraft(product);
    const validationError = validateProductDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSavingId(product.id);
    setError("");
    setNotice("");
    try {
      await managerRequest(`/manager/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: draft.name.trim(),
          description: draft.description.trim(),
          price: draft.price,
          stockQuantity: Number(draft.stockQuantity),
        }),
      });
      setProductDrafts((drafts) => {
        const next = { ...drafts };
        delete next[product.id];
        return next;
      });
      setNotice(`Đã lưu thay đổi cho ${draft.name.trim()}.`);
      await loadProducts();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSavingId("");
    }
  }

  async function toggleProduct(product: Product) {
    setSavingId(product.id);
    setError("");
    setNotice("");
    try {
      await managerRequest(`/manager/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isAvailable: !product.isAvailable }),
      });
      setNotice(
        `${product.name} đã ${product.isAvailable ? "được ẩn khỏi" : "hiển thị trên"} menu.`,
      );
      await loadProducts();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSavingId("");
    }
  }

  async function createOption(product: Product) {
    const draft = newOptions[product.id] ?? emptyOptionDraft;
    const adjustment = Number(draft.priceAdjustment);
    if (!draft.name.trim()) {
      setError("Tên tùy chọn không được để trống.");
      return;
    }
    if (
      !Number.isFinite(adjustment) ||
      Math.abs(adjustment) > 99_999_999.99 ||
      !/^-?\d+(\.\d{1,2})?$/.test(draft.priceAdjustment)
    ) {
      setError("Phụ phí tùy chọn phải hợp lệ và có tối đa 2 chữ số thập phân.");
      return;
    }

    setSavingId(product.id);
    setError("");
    setNotice("");
    try {
      await managerRequest(`/manager/products/${product.id}/options`, {
        method: "POST",
        body: JSON.stringify({
          optionType: draft.optionType,
          name: draft.name.trim(),
          priceAdjustment: draft.priceAdjustment,
        }),
      });
      setNewOptions((options) => ({ ...options, [product.id]: emptyOptionDraft }));
      setNotice(`Đã thêm tùy chọn cho ${product.name}.`);
      await loadProducts();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSavingId("");
    }
  }

  async function saveOption(product: Product, option: ProductOption) {
    const draft = optionDraft(option);
    const adjustment = Number(draft.priceAdjustment);
    if (
      !draft.name.trim() ||
      !Number.isFinite(adjustment) ||
      Math.abs(adjustment) > 99_999_999.99 ||
      !/^-?\d+(\.\d{1,2})?$/.test(draft.priceAdjustment)
    ) {
      setError("Tên và phụ phí tùy chọn phải hợp lệ (tối đa 2 chữ số thập phân).");
      return;
    }

    setSavingId(option.id);
    setError("");
    setNotice("");
    try {
      await managerRequest(
        `/manager/products/${product.id}/options/${option.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            optionType: draft.optionType,
            name: draft.name.trim(),
            priceAdjustment: draft.priceAdjustment,
          }),
        },
      );
      setOptionDrafts((drafts) => {
        const next = { ...drafts };
        delete next[option.id];
        return next;
      });
      setNotice(`Đã cập nhật tùy chọn ${draft.name.trim()}.`);
      await loadProducts();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSavingId("");
    }
  }

  async function toggleOption(product: Product, option: ProductOption) {
    setSavingId(option.id);
    setError("");
    setNotice("");
    try {
      await managerRequest(
        `/manager/products/${product.id}/options/${option.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isAvailable: !option.isAvailable }),
        },
      );
      setNotice(
        `Tùy chọn ${option.name} đã ${option.isAvailable ? "được ẩn" : "được hiển thị"}.`,
      );
      await loadProducts();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSavingId("");
    }
  }

  return (
    <main className="manager-shell">
      <div className="manager-container manager-container-wide">
        <ManagerNav />
        <header className="manager-heading">
          <p className="eyebrow">QUẢN LÝ CỬA HÀNG</p>
          <h1>Đồ uống</h1>
          <p className="subtitle">Quản lý món bán và các tùy chọn theo sản phẩm.</p>
        </header>

        <section className="manager-card product-create-card">
          <div className="section-heading">
            <div><p className="eyebrow">MENU</p><h2>Thêm đồ uống</h2></div>
          </div>
          <form className="product-form" onSubmit={createProduct}>
            <label className="field"><span>Tên đồ uống</span><input required maxLength={120} value={newProduct.name} onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })} /></label>
            <label className="field"><span>Giá (VND)</span><input required type="number" min="0" max="99999999.99" step="0.01" value={newProduct.price} onChange={(event) => setNewProduct({ ...newProduct, price: event.target.value })} /></label>
            <label className="field"><span>Số lượng tồn</span><input required type="number" min="0" max="2147483647" step="1" value={newProduct.stockQuantity} onChange={(event) => setNewProduct({ ...newProduct, stockQuantity: event.target.value })} /></label>
            <label className="field product-description-field"><span>Mô tả</span><input value={newProduct.description} onChange={(event) => setNewProduct({ ...newProduct, description: event.target.value })} /></label>
            <button className="button product-submit" type="submit" disabled={creating}>{creating ? "Đang lưu…" : "Thêm đồ uống"}</button>
          </form>
        </section>

        {notice && <p className="feedback success product-feedback" role="status">{notice}</p>}
        {error && <div className="manager-inline-error product-feedback" role="alert"><p>{error}</p></div>}

        {loading ? (
          <section className="manager-state" role="status"><span className="loading-indicator" aria-hidden="true" /><p>Đang tải đồ uống…</p></section>
        ) : error && products.length === 0 ? (
          <section className="manager-state manager-state-error" role="alert"><h2>Không tải được đồ uống</h2><p>{error}</p><button className="button manager-state-action" type="button" onClick={retryProducts}>Thử lại</button></section>
        ) : products.length === 0 ? (
          <section className="manager-state"><h2>Chưa có đồ uống</h2><p>Thêm đồ uống mới bằng biểu mẫu ở trên.</p></section>
        ) : (
          <div className="manager-product-list">
            {products.map((product) => {
              const draft = productDraft(product);
              const newOption = newOptions[product.id] ?? emptyOptionDraft;
              return (
                <article className="manager-card product-card" key={product.id}>
                  <div className="product-card-heading">
                    <div><p className="detail-label">ĐỒ UỐNG</p><h2>{product.name}</h2></div>
                    <span className={`status-pill ${product.isAvailable ? "status-succeeded" : "status-cancelled"}`}>{product.isAvailable ? "Đang bán" : "Đã ẩn"}</span>
                  </div>
                  <div className="product-form">
                    <label className="field"><span>Tên</span><input maxLength={120} value={draft.name} onChange={(event) => updateProductDraft(product.id, { name: event.target.value })} /></label>
                    <label className="field"><span>Giá (VND)</span><input type="number" min="0" max="99999999.99" step="0.01" value={draft.price} onChange={(event) => updateProductDraft(product.id, { price: event.target.value })} /></label>
                    <label className="field"><span>Số lượng tồn</span><input type="number" min="0" max="2147483647" step="1" value={draft.stockQuantity} onChange={(event) => updateProductDraft(product.id, { stockQuantity: event.target.value })} /></label>
                    <label className="field product-description-field"><span>Mô tả</span><input value={draft.description} onChange={(event) => updateProductDraft(product.id, { description: event.target.value })} /></label>
                  </div>
                  <p className="product-current-price">Giá hiện tại: {formatMoney(product.price)} · Tồn kho: {product.stockQuantity}</p>
                  <div className="product-action-row">
                    <button className="button" type="button" disabled={savingId === product.id} onClick={() => void saveProduct(product)}>Lưu thay đổi</button>
                    <button className="button-secondary" type="button" disabled={savingId === product.id} onClick={() => void toggleProduct(product)}>{product.isAvailable ? "Ẩn khỏi menu" : "Hiện trên menu"}</button>
                  </div>

                  <div className="product-options-section">
                    <div className="section-heading"><div><p className="eyebrow">TÙY CHỌN</p><h3>Tùy chọn món</h3></div><span className="item-count">{product.options.length} tùy chọn</span></div>
                    {product.options.length === 0 ? <p className="empty-message">Chưa có tùy chọn.</p> : (
                      <div className="product-option-list">
                        {product.options.map((option) => {
                          const optionForm = optionDraft(option);
                          return (
                            <div className="product-option-row" key={option.id}>
                              <label className="field"><span>Loại</span><select value={optionForm.optionType} onChange={(event) => updateOptionDraft(option.id, { optionType: event.target.value as OptionType })}>{optionTypes.map((type) => <option value={type} key={type}>{typeLabels[type]}</option>)}</select></label>
                              <label className="field"><span>Tên</span><input maxLength={60} value={optionForm.name} onChange={(event) => updateOptionDraft(option.id, { name: event.target.value })} /></label>
                              <label className="field"><span>Phụ phí</span><input type="number" step="0.01" value={optionForm.priceAdjustment} onChange={(event) => updateOptionDraft(option.id, { priceAdjustment: event.target.value })} /></label>
                              <span className={`status-pill ${option.isAvailable ? "status-succeeded" : "status-cancelled"}`}>{option.isAvailable ? "Đang dùng" : "Đã ẩn"}</span>
                              <div className="option-actions">
                                <button className="button-secondary" type="button" disabled={savingId === option.id} onClick={() => void saveOption(product, option)}>Lưu</button>
                                <button className="text-button" type="button" disabled={savingId === option.id} onClick={() => void toggleOption(product, option)}>{option.isAvailable ? "Ẩn" : "Hiện"}</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="product-option-create">
                      <label className="field"><span>Loại tùy chọn mới</span><select value={newOption.optionType} onChange={(event) => setNewOptions({ ...newOptions, [product.id]: { ...newOption, optionType: event.target.value as OptionType } })}>{optionTypes.map((type) => <option value={type} key={type}>{typeLabels[type]}</option>)}</select></label>
                      <label className="field"><span>Tên</span><input maxLength={60} value={newOption.name} onChange={(event) => setNewOptions({ ...newOptions, [product.id]: { ...newOption, name: event.target.value } })} placeholder="Ví dụ: Lớn" /></label>
                      <label className="field"><span>Phụ phí (VND)</span><input type="number" step="0.01" value={newOption.priceAdjustment} onChange={(event) => setNewOptions({ ...newOptions, [product.id]: { ...newOption, priceAdjustment: event.target.value } })} /></label>
                      <button className="button-secondary" type="button" disabled={savingId === product.id} onClick={() => void createOption(product)}>Thêm tùy chọn</button>
                    </div>
                  </div>
                  <p className="product-retention-note">Đồ uống được ẩn thay vì xóa cứng để giữ nguyên dữ liệu đơn hàng đã tham chiếu.</p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
