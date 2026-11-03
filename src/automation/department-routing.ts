export type CategoryRoute = { name: string; departmentName: string };

// The server passes the real categories from the database, so this never
// drifts from the seed.
export function departmentNameFor(
  categoryName: string,
  categories: CategoryRoute[],
): string | null {
  return (
    categories.find((c) => c.name === categoryName)?.departmentName ?? null
  );
}
