export const STAFF_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class StaffApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isRecordValue(
  value: unknown,
): value is Record<string, unknown> {
  return isRecord(value);
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Đã xảy ra lỗi.";
}

export async function staffRequest(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const token = window.sessionStorage.getItem("brewlite.accessToken");
  if (!token) {
    throw new StaffApiError("Phiên đăng nhập nhân viên không còn hợp lệ.", 401);
  }
  if (window.sessionStorage.getItem("brewlite.role") !== "STAFF") {
    throw new StaffApiError(
      "Tài khoản hiện tại không có quyền nhân viên quầy.",
      403,
    );
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${STAFF_API_URL}${path}`, { ...init, headers });
  } catch {
    throw new StaffApiError(
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
    const rawMessage = isRecord(payload) ? payload.message : undefined;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(". ")
      : typeof rawMessage === "string"
        ? rawMessage
        : response.status === 401
          ? "Phiên đăng nhập hết hạn. Hãy đăng nhập lại."
          : response.status === 403
            ? "Tài khoản hiện tại không có quyền nhân viên quầy."
            : `Yêu cầu thất bại (HTTP ${response.status}).`;
    throw new StaffApiError(message, response.status);
  }

  return payload;
}

export function formatStaffMoney(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Không xác định";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatStaffDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không xác định";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function staffStatusLabel(status: string) {
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
    WALLET: "Ví điện tử",
    SIZE: "Size",
    ICE_LEVEL: "Mức đá",
    SUGAR_LEVEL: "Mức đường",
    TOPPING: "Topping",
  };
  return labels[status] ?? status;
}
