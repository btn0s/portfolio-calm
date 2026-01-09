import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio v1',
  description: 'Previous portfolio iteration',
}

export default function PortfolioV1Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-6 tracking-tighter">
        Portfolio v1
      </h1>

      <div className="mb-8 flex flex-col gap-4 text-sm">
        <p>
          The previous iteration of my portfolio, showcasing an earlier approach
          to presenting work and projects.
        </p>
      </div>
    </section>
  )
}
