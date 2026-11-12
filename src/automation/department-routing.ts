export type CategoryRoute = { name: string; departmentName: string };

export function departmentNameFor(
  categoryName: string,
  categories: CategoryRoute[],
): string | null {
  return (
    categories.find((c) => c.name === categoryName)?.departmentName ?? null
  );
}
