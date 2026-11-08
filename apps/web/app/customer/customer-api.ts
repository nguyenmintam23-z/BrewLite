export const CUSTOMER_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class CustomerApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export function isRecordValue(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getCustomerErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Đã xảy ra lỗi.";
}

export async function customerRequest(
  path: string,
  init: RequestInit = {},
  authenticated = false,
): Promise<unknown> {
  const headers = new Headers(init.headers);
  if (authenticated) {
    const token = window.sessionStorage.getItem("brewlite.accessToken");
    const role = window.sessionStorage.getItem("brewlite.role");
    if (!token || role !== "CUSTOMER") {
      throw new CustomerApiError(
        "Đăng nhập bằng tài khoản khách hàng để tiếp tục.",
        token ? 403 : 401,
      );
    }
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${CUSTOMER_API_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new CustomerApiError(
      "Không kết nối được API. Hãy kiểm tra backend và cấu hình địa chỉ API.",
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }
  if (!response.ok) {
    const rawMessage = isRecordValue(payload) ? payload.message : undefined;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(". ")
      : typeof rawMessage === "string"
        ? rawMessage
        : response.status === 401
          ? "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại."
          : response.status === 403
            ? "Tài khoản hiện tại không có quyền khách hàng."
            : `Yêu cầu thất bại (HTTP ${response.status}).`;
    throw new CustomerApiError(message, response.status);
  }
  return payload;
}

export function formatCustomerMoney(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Không xác định";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCustomerDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không xác định";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function customerStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING_PAYMENT: "Chờ thanh toán",
    CONFIRMED: "Đã xác nhận",
    PREPARING: "Đang chuẩn bị",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    PENDING: "Đang chờ",
    SUCCEEDED: "Thành công",
    FAILED: "Thất bại",
    CARD: "Thẻ mô phỏng",
    WALLET: "Ví mô phỏng",
    SIZE: "Size",
    ICE_LEVEL: "Mức đá",
    SUGAR_LEVEL: "Mức đường",
    TOPPING: "Topping",
  };
  return labels[status] ?? status;
}
