const planDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

export function formatPlanDate(input?: string | null): string {
  if (!input) {
    return "TBD";
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return planDateFormatter.format(date);
}

export function formatPlanDateRange(
  start?: string | null,
  end?: string | null
): string {
  const startLabel = formatPlanDate(start);
  const endLabel = formatPlanDate(end);

  if (!end || startLabel === endLabel) {
    return startLabel;
  }

  return `${startLabel} – ${endLabel}`;
}


