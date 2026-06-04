import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KWG Directory',
    short_name: 'KWG',
    description: 'OpenChain Korea Work Group 멤버 주소록',
    start_url: '/',
    display: 'standalone',
    theme_color: '#01696f',
    background_color: '#f7f6f2',
    icons: [
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/kwg-logo.png',
        sizes: '432x432',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
