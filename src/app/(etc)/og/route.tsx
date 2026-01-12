import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET(request: Request) {
  let url = new URL(request.url)
  let title = url.searchParams.get('title') || 'bt norris'

  const paperColor = '#f2efeb'
  const inkColor = '#333333'
  const dossierColor = '#2c3e2d'
  const blueprintColor = '#1a365d'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: '#050505',
          fontFamily: 'monospace',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Blueprint Card - Cropped Bottom Left */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '800px',
            backgroundColor: blueprintColor,
            left: '-150px',
            bottom: '-250px',
            transform: 'rotate(-12deg)',
            display: 'flex',
            flexDirection: 'column',
            padding: '40px',
            zIndex: 1,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ color: '#90cdf4', opacity: 0.2, fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid rgba(144,205,244,0.2)', paddingBottom: '8px' }}>
            SPEC_V2.5 // ARCHIVE
          </div>
          {/* Mock Grid Lines */}
          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div style={{ height: '1px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            <div style={{ height: '1px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            <div style={{ height: '1px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
          </div>
        </div>

        {/* Dossier Card - Cropped Top Right */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '800px',
            backgroundColor: dossierColor,
            right: '-180px',
            top: '-200px',
            transform: 'rotate(12deg)',
            display: 'flex',
            zIndex: 2,
            border: '1px solid #41503E',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ 
            marginTop: '120px',
            marginLeft: '40px',
            padding: '8px 24px', 
            border: '4px solid #ef4444', 
            color: '#ef4444', 
            fontSize: '32px', 
            fontWeight: 'bold',
            transform: 'rotate(-8deg)',
          }}>
            CLASSIFIED
          </div>
        </div>

        {/* Main Receipt */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-1.5deg)',
            width: '640px',
            backgroundColor: paperColor,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10,
            boxShadow: '0 60px 120px rgba(0,0,0,0.9)',
          }}
        >
          <div style={{ padding: '64px 60px 40px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Logo */}
            <div style={{ marginBottom: '40px', display: 'flex', color: inkColor, transform: 'scale(3.5)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="2" y="2" width="1" height="1"/><rect x="3" y="2" width="2" height="1"/><rect x="5" y="2" width="1" height="1"/><rect x="2" y="3" width="4" height="2"/><rect x="2" y="5" width="1" height="1"/><rect x="3" y="5" width="2" height="1"/><rect x="5" y="5" width="1" height="1"/><rect x="10" y="2" width="1" height="1"/><rect x="11" y="2" width="2" height="1"/><rect x="13" y="2" width="1" height="1"/><rect x="10" y="3" width="4" height="2"/><rect x="10" y="5" width="1" height="1"/><rect x="11" y="5" width="2" height="1"/><rect x="13" y="5" width="1" height="1"/><rect x="3" y="9" width="2" height="1"/><rect x="5" y="10" width="2" height="1"/><rect x="6" y="11" width="4" height="1"/><rect x="9" y="10" width="2" height="1"/><rect x="11" y="9" width="2" height="1"/>
              </svg>
            </div>

            <h1 style={{ fontSize: '100px', fontWeight: 'bold', color: inkColor, margin: 0, letterSpacing: '-0.07em', lineHeight: 1 }}>
              {title}
            </h1>
            <div style={{ fontSize: '24px', color: '#666', fontWeight: 'bold', letterSpacing: '0.4em', textTransform: 'uppercase', marginTop: '10px' }}>
              Design Engineer
            </div>

            {/* Signature Block */}
            <div style={{ width: '100%', marginTop: '48px', display: 'flex', justifyContent: 'center', opacity: 0.8 }}>
              <svg viewBox="35 30 215 75" width="180" height="60" fill="none" stroke={inkColor} strokeWidth="3" strokeLinecap="round">
                <path d="M 35,75 C 50,70 70,60 100,55 M 100,55 C 130,50 160,40 190,35 M 190,35 C 210,30 230,35 240,45" />
                <path d="M 193,40 L 193,80" strokeWidth="4" />
              </svg>
            </div>

            <div style={{ width: '100%', marginTop: '24px', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ccc', paddingTop: '20px' }}>
              <div style={{ fontSize: '14px', color: '#999' }}>JAN 12, 2026</div>
              <div style={{ fontSize: '14px', color: inkColor, fontWeight: 'bold' }}>NO. 0001_V3</div>
            </div>
          </div>

          {/* Zigzag bottom edge */}
          <div style={{ display: 'flex', width: '100%', overflow: 'hidden', height: '16px' }}>
            {Array.from({ length: 32 }).map((_, i) => (
              <svg key={i} width="20" height="16" viewBox="0 0 20 12" fill="none">
                <path d="M0 0 L10 12 L20 0 Z" fill={paperColor} />
                <path d="M0 0 L10 12" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
              </svg>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
