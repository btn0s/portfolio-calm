import type { ReactNode } from "react"

/**
 * An index list split by year, newest first, with a small mono heading
 * above each group. Items keep their given order within a year.
 */
export function YearGroups<T>({
  items,
  year,
  children,
}: {
  items: T[]
  year: (item: T) => number
  children: (item: T) => ReactNode
}) {
  const years = [...new Set(items.map(year))].sort((a, b) => b - a)

  return years.map((y) => (
    <section key={y} className="mt-7 first:mt-0">
      <h3 className="mb-1 font-mono text-[10px] font-bold tracking-[0.14em] opacity-45">{y}</h3>
      {items.filter((item) => year(item) === y).map(children)}
    </section>
  ))
}
