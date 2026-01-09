import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Delphi Falling Chips',
  description: 'Interactive visual experiment',
}

export default function DelphiFallingChipsPage() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-6 tracking-tighter">
        Delphi Falling Chips
      </h1>

      <div className="mb-8 flex flex-col gap-4 text-sm">
        <p>An interactive visual experiment exploring particle systems and physics.</p>
      </div>
    </section>
  )
}
