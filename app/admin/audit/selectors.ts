export const auditSelectors = {
  event: (id: string) => `audit-event-${id}`,
  eventDetails: (id: string) => `audit-event-details-${id}`,
  filters: "audit-filters",
  list: "audit-list",
  page: "audit-page",
  stats: "audit-stats",
} as const;
