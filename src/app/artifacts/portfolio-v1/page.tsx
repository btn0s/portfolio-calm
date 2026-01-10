import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'portfolio v1',
  description: 'Previous portfolio iteration showcasing an earlier approach to presenting work and projects',
  path: '/artifacts/portfolio-v1',
})

export default function PortfolioV1Page() {
  return (
    <section>
      <div className="pt-8 pb-6">
        <h1 className="font-semibold text-2xl mb-6 tracking-tighter">
          Portfolio v1
        </h1>

        <div className="flex flex-col gap-4 text-sm">
          <p>
            The previous iteration of my portfolio, showcasing an earlier approach
            to presenting work and projects.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <video
          src="/assets/videos/portfolio.mp4"
          controls
          className="w-full h-auto"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  )
}
