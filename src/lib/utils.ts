import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 이름에서 이니셜 추출 (한글: 첫 글자, 영문: 이니셜)
export function getInitials(name: string): string {
  if (!name) return '?'
  const trimmed = name.trim()
  // 한글 감지
  if (/[가-힣]/.test(trimmed)) {
    return trimmed[0]
  }
  return trimmed
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// 이름 기반 결정적 색상 생성
const AVATAR_COLORS = [
  '#01696f', '#2563eb', '#7c3aed', '#db2777',
  '#ea580c', '#16a34a', '#0891b2', '#9333ea',
]

export function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function formatMemberCategory(category: string): string {
  return category
}

import { Member } from '@/types/member'

export function filterMembers(members: Member[], query: string, category: string): Member[] {
  const q = query.toLowerCase()
  return members.filter((m) => {
    const matchSearch =
      !q ||
      m.name_ko.toLowerCase().includes(q) ||
      (m.name_en?.toLowerCase().includes(q) ?? false) ||
      m.company.toLowerCase().includes(q)
    const matchCategory = category === 'all' || category === '전체' || m.category === category
    return matchSearch && matchCategory
  })
}
