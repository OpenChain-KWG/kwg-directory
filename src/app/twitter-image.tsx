import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const size = { width: 1200, height: 600 }
export const contentType = 'image/png'

export default async function TwitterImage() {
  const logoData = await readFile(join(process.cwd(), 'public/kwg-logo.png'))
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '600px',
          background: 'linear-gradient(135deg, #01696f 0%, #014d52 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoBase64} style={{ height: '120px', width: 'auto' }} alt="" />
        <div
          style={{
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
            textAlign: 'center',
            fontFamily: 'Georgia, serif',
          }}
        >
          OpenChain Korea Work Group Members
        </div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '24px', fontFamily: 'Arial, sans-serif' }}>
          OpenChain Korea Work Group
        </div>
      </div>
    ),
    { ...size }
  )
}
