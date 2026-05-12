import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'GlobalCampus AI — Land that Samsung internship'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0b',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
          color: '#fafafa',
          position: 'relative',
        }}
      >
        {/* glow */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            left: 200,
            width: 800,
            height: 500,
            background:
              'radial-gradient(closest-side, rgba(245, 158, 11, 0.22), transparent)',
            filter: 'blur(40px)',
            display: 'flex',
          }}
        />

        {/* brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: '#fafafa',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#0a0a0b', fontWeight: 700, fontSize: 16 }}>GC</span>
          </div>
          <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>
            GlobalCampus AI
          </span>
        </div>

        {/* spacer */}
        <div style={{ flex: 1, display: 'flex' }} />

        {/* headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            fontSize: 80,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          <span>Land that Samsung</span>
          <span style={{ color: '#fbbf24' }}>internship.</span>
        </div>

        {/* subhead */}
        <div
          style={{
            marginTop: 28,
            fontSize: 26,
            color: '#a1a1aa',
            maxWidth: 880,
            display: 'flex',
          }}
        >
          Decode Korean CS lectures. Track Samsung · Naver · Kakao · Coupang. Pass the coding test.
        </div>

        {/* footer */}
        <div
          style={{
            marginTop: 36,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 18,
            color: '#71717a',
          }}
        >
          <span>For international CS students at Korean universities</span>
          <span style={{ color: '#3f3f46' }}>·</span>
          <span style={{ color: '#fafafa' }}>Free during beta</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
