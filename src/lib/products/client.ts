"use client";

export async function productFetch(
  url: string,
  options: RequestInit,
): Promise<{ id?: string }> {
  const response = await fetch(url, options);
  if (response.status === 401) {
    // Expired authentication must discard the protected client router cache.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
    throw new Error("Session หมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง");
  }
  if (response.status === 204) return {};
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      result &&
        typeof result === "object" &&
        "error" in result &&
        typeof result.error === "string"
        ? result.error
        : "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง",
    );
  }
  if (
    result &&
    typeof result === "object" &&
    "id" in result &&
    typeof result.id === "string"
  )
    return { id: result.id };
  return {};
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง";
}
