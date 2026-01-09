import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET(request: Request) {
  let url = new URL(request.url)
  let title = url.searchParams.get('title') || 'bt norris'

  return new ImageResponse(
    (
      <div
        tw="flex flex-col w-full h-full items-center justify-center"
        style={{
          background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
        }}
      >
        <div tw="flex flex-col w-full px-16 py-12">
          <h1
            tw="text-6xl font-bold tracking-tight text-left mb-4"
            style={{
              fontFamily: 'monospace',
              color: '#0a0a0a',
            }}
          >
            {title}
          </h1>
          <p
            tw="text-2xl text-gray-600"
            style={{
              fontFamily: 'sans-serif',
            }}
          >
            Product Designer & Engineer
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
