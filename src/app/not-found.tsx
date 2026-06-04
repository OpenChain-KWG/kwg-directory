import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <Image
          src="/logos/kwg-icon.svg"
          alt="KWG Directory"
          width={80}
          height={80}
          className="mx-auto mb-6"
        />
        <div
          className="text-6xl font-bold text-[var(--color-brand)] mb-4"
        >
          404
        </div>
        <p className="text-[var(--color-text-muted)] mb-8">
          페이지를 찾을 수 없습니다
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white font-medium px-6 py-3 rounded-xl transition-colors"
        >
          멤버 주소록으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
