export const normalizeSearchQuery = (query: string) => query.trim().toLowerCase();

export const matchesSearchQuery = (
  query: string,
  ...values: Array<string | null | undefined | number>
) => {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return true;

  return values.some(
    (value) => value != null && String(value).toLowerCase().includes(normalized),
  );
};
