export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCurrency(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMinorCurrency(value?: number | null): string {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return "—";
  return formatCurrency(value / 100);
}

type QueryValue = string | number | boolean | null | undefined;

export function buildQueryString<T extends object>(values: T): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values as Record<string, QueryValue>)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function normalizeSkuPart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function previewGeneratedSku(productCode: string, sizeSetLabel: string): string {
  const code = productCode.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase().replace(/\s+/g, "_").replace(/_+/g, "_").replace(/[^A-Z0-9_]/g, "").replace(/^_+|_+$/g, "");
  const size = sizeSetLabel.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase().replace(/\s*-\s*/g, "-").replace(/\s+/g, "").replace(/-+/g, "-").replace(/[^A-Z0-9-]/g, "").replace(/^-+|-+$/g, "");
  return code && size ? `${code}_${size}` : "";
}

export function previewGeneratedProductCode(productName: string, colourName: string): string {
  const part = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  const product = part(productName); const colour = part(colourName);
  return product && colour ? `${product}_${colour}` : "";
}
