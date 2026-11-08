export type CustomerCartItem = {
  key: string;
  productId: string;
  productName: string;
  basePrice: string;
  optionIds: string[];
  optionPriceAdjustments: string[];
  selectedOptions: Record<string, string | string[]>;
  quantity: number;
};

const CART_STORAGE_KEY = "brewlite.customer.cart";
const CART_EVENT_NAME = "brewlite-customer-cart-change";

function isCartItem(value: unknown): value is CustomerCartItem {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const item = value as Record<string, unknown>;
  const selectedOptions = item.selectedOptions;
  return (
    typeof item.key === "string" &&
    typeof item.productId === "string" &&
    typeof item.productName === "string" &&
    typeof item.basePrice === "string" &&
    Array.isArray(item.optionIds) &&
    item.optionIds.every((id) => typeof id === "string") &&
    Array.isArray(item.optionPriceAdjustments) &&
    item.optionPriceAdjustments.every((price) => typeof price === "string") &&
    item.optionPriceAdjustments.length === item.optionIds.length &&
    typeof selectedOptions === "object" &&
    selectedOptions !== null &&
    !Array.isArray(selectedOptions) &&
    Object.values(selectedOptions).every(
      (option) =>
        typeof option === "string" ||
        (Array.isArray(option) &&
          option.every((name) => typeof name === "string")),
    ) &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

export function readCustomerCart(): CustomerCartItem[] {
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(value) ? value.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export function writeCustomerCart(items: CustomerCartItem[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT_NAME));
}

export function customerCartEventName() {
  return CART_EVENT_NAME;
}

export function customerCartItemPrice(item: CustomerCartItem) {
  return (
    Number(item.basePrice) +
    item.optionPriceAdjustments.reduce((total, price) => total + Number(price), 0)
  );
}
