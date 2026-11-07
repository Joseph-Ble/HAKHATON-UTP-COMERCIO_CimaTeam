import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useApp } from "./AppProvider.js";
import { repository } from "./repository.js";

export function useListing(scope, filters, localRows, enabled = true) {
  const { mode, user } = useApp();
  const [search, setSearch] = useState(filters.search || "");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(filters.search || ""), 250);
    return () => clearTimeout(timer);
  }, [filters.search]);
  const effective = { ...filters, search };
  const query = useInfiniteQuery({
    queryKey: ["listing", user?.id || "visitor", scope, effective],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => repository.list(scope, effective, pageParam),
    getNextPageParam: (last, _pages, lastParam) =>
      last.has_more ? lastParam + 1 : undefined,
    enabled: mode === "remote" && enabled,
  });
  return {
    rows:
      mode === "remote"
        ? [
            ...new Map(
              (query.data?.pages.flatMap((p) => p.items) || []).map((r) => [
                r.id,
                r,
              ]),
            ).values(),
          ]
        : localRows,
    loading: mode === "remote" && enabled && query.isPending,
    error: mode === "remote" ? query.error?.message : null,
    hasMore: mode === "remote" && query.hasNextPage,
    fetchingMore: query.isFetchingNextPage,
    remote: mode === "remote",
    loadMore: async () => {
      const r = await query.fetchNextPage();
      if (r.error) throw r.error;
    },
    retry: async () => {
      const r = await query.refetch();
      if (r.error) throw r.error;
    },
  };
}
const merge = (oldRows, newRows) => [
  ...new Map([...oldRows, ...newRows].map((r) => [r.id, r])).values(),
];
export function useItem(scope, id) {
  const app = useApp();
  const query = useQuery({
    queryKey: [
      "detail",
      app.user?.id || "visitor",
      scope,
      id || "",
      app.barrio,
    ],
    queryFn: () => repository.detail(scope, id, app.barrio),
    enabled: app.mode === "remote" && !!id,
  });
  let data = app.data;
  if (app.mode === "remote" && query.data?.item) {
    data = { ...data };
    for (const key of [
      "profiles",
      "reviews",
      "contacts",
      "offers",
      "responses",
      "history",
    ])
      data[key] = merge(data[key], query.data[key] || []);
    const table = scope === "business" ? "businesses" : "posts";
    data[table] = merge(data[table], [query.data.item]);
  }
  const item =
    app.mode === "remote" && id
      ? query.data?.item || null
      : data[scope === "business" ? "businesses" : "posts"].find(
          (p) => p.id === id && !p.deleted_at,
        );
  return {
    data,
    item,
    loading: app.mode === "remote" && id ? query.isPending : app.loading,
    error: query.error?.message,
  };
}
