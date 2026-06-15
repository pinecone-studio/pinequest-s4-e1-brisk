export function toDateTimeLocalValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value: string) {
  if (!value.trim()) return null;

  return new Date(value).toISOString();
}
