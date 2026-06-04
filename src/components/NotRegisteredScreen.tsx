import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { btnPrimary } from '@/lib/button-styles'

export default function NotRegisteredScreen() {
  return (
    <div
      className="flex-1 flex items-center justify-center px-4 py-24"
      data-testid="not-registered-screen"
    >
      <div className="w-full max-w-md bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-sm p-10 text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/kwg-logo.png"
            alt="OpenChain Korea Work Group"
            width={56}
            height={56}
            style={{ width: 'auto', height: '56px' }}
          />
        </div>

        <div className="flex justify-center mb-5">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
            <svg
              className="w-7 h-7 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </span>
        </div>

        <h1 className="text-xl font-bold text-[var(--color-text)] mb-3">
          OpenChain KWG 멤버 소개
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-8">
          멤버 소개를 이용하려면 프로필을 등록해주세요.
          <br />
          등록 후 관리자 승인을 거쳐 서비스를 이용하실 수 있습니다.
        </p>

        <Link
          href="/profile/new"
          className={cn(
            'inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark',
            btnPrimary
          )}
        >
          프로필 등록하기
        </Link>
      </div>
    </div>
  )
}
