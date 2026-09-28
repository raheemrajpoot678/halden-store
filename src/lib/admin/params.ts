// Parsing untrusted search params for admin list pages.
export type SearchParams = Record<string, string | string[] | undefined>;

export function param(params: SearchParams, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

export function pageParam(params: SearchParams) {
  const page = Number(param(params, "page"));
  return Number.isInteger(page) && page > 0 && page < 10_000 ? page : 1;
}

export function oneOf<T extends string>(value: string | undefined, options: readonly T[]) {
  return options.includes(value as T) ? (value as T) : undefined;
}

// Builds a URL for the same list with some params changed (empty ones dropped).
export function withParams(path: string, params: SearchParams, changes: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...changes })) {
    if (typeof value === "number" || (typeof value === "string" && value !== "")) {
      if (key === "page" && Number(value) === 1) continue;
      query.set(key, String(value));
    }
  }
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}
