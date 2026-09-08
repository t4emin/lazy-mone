export function displayPrice(price: { toString(): string } | null) {
  return price === null
    ? "—"
    : new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
      }).format(Number(price.toString()));
}
export function displayDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}
