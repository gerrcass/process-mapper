/**
 * The editor lives on a single static route so the app can be exported to
 * GitHub Pages. The map id travels in the query string instead of the path.
 */
export function mapHref(
  mapId: string,
  options: { view?: "flow"; node?: string | null } = {},
): string {
  const params = new URLSearchParams({ map: mapId });
  if (options.view === "flow") params.set("view", "flow");
  if (options.node) params.set("node", options.node);
  return `/maps?${params.toString()}`;
}
