import { describe, it, expect } from 'vitest'
import { SearchMembersSchema, PAGE_SIZE_MAX_SEARCH } from '@/lib/schemas'

describe('SearchMembersSchema', () => {
  describe('기본값', () => {
    it('빈 입력 → 기본값으로 통과', () => {
      const result = SearchMembersSchema.safeParse({})
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.q).toBe('')
      expect(result.data.sort).toBe('name')
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(24)
      expect(result.data.category).toEqual([])
    })
  })

  describe('q (검색어)', () => {
    it('q=홍길동 → 통과', () => {
      const result = SearchMembersSchema.safeParse({ q: '홍길동' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.q).toBe('홍길동')
    })

    it('q 101자 → 실패', () => {
      const result = SearchMembersSchema.safeParse({ q: 'a'.repeat(101) })
      expect(result.success).toBe(false)
    })

    it('q 100자 → 통과', () => {
      const result = SearchMembersSchema.safeParse({ q: 'a'.repeat(100) })
      expect(result.success).toBe(true)
    })
  })

  describe('category', () => {
    it('유효한 단일 카테고리 → 배열로 변환', () => {
      const result = SearchMembersSchema.safeParse({ category: '기업' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.category).toEqual(['기업'])
    })

    it('콤마 구분 다중 카테고리 → 배열로 변환', () => {
      const result = SearchMembersSchema.safeParse({ category: '기업,연구/공공' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.category).toEqual(['기업', '연구/공공'])
    })

    it('모든 유효 카테고리 → 통과', () => {
      const result = SearchMembersSchema.safeParse({ category: '기업,연구/공공,학계' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.category).toHaveLength(3)
    })

    it('유효하지 않은 카테고리 → 실패', () => {
      const result = SearchMembersSchema.safeParse({ category: '대기업' })
      expect(result.success).toBe(false)
    })

    it('category 미입력 → 빈 배열', () => {
      const result = SearchMembersSchema.safeParse({})
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.category).toEqual([])
    })
  })

  describe('sort', () => {
    it('sort=name → 통과', () => {
      const result = SearchMembersSchema.safeParse({ sort: 'name' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.sort).toBe('name')
    })

    it('sort=recent → 통과', () => {
      const result = SearchMembersSchema.safeParse({ sort: 'recent' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.sort).toBe('recent')
    })

    it('sort=random → 통과', () => {
      const result = SearchMembersSchema.safeParse({ sort: 'random' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.sort).toBe('random')
    })

    it('sort=invalid → 실패', () => {
      const result = SearchMembersSchema.safeParse({ sort: 'popular' })
      expect(result.success).toBe(false)
    })
  })

  describe('page', () => {
    it('page=1 → 통과', () => {
      const result = SearchMembersSchema.safeParse({ page: '1' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.page).toBe(1)
    })

    it('page=0 → 1로 clamp', () => {
      const result = SearchMembersSchema.safeParse({ page: '0' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.page).toBe(1)
    })

    it('page=-5 → 1로 clamp', () => {
      const result = SearchMembersSchema.safeParse({ page: '-5' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.page).toBe(1)
    })

    it('page=10 → 통과', () => {
      const result = SearchMembersSchema.safeParse({ page: '10' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.page).toBe(10)
    })
  })

  describe('pageSize', () => {
    it('pageSize=24 → 통과', () => {
      const result = SearchMembersSchema.safeParse({ pageSize: '24' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.pageSize).toBe(24)
    })

    it(`pageSize=100 → 통과 (최대값)`, () => {
      const result = SearchMembersSchema.safeParse({ pageSize: '100' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.pageSize).toBe(100)
    })

    it(`pageSize=${PAGE_SIZE_MAX_SEARCH + 1} → ${PAGE_SIZE_MAX_SEARCH}으로 clamp`, () => {
      const result = SearchMembersSchema.safeParse({ pageSize: String(PAGE_SIZE_MAX_SEARCH + 1) })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.pageSize).toBe(PAGE_SIZE_MAX_SEARCH)
    })

    it('pageSize=0 → 1로 clamp', () => {
      const result = SearchMembersSchema.safeParse({ pageSize: '0' })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.pageSize).toBe(1)
    })
  })

  describe('복합 파라미터', () => {
    it('q + category + sort + page + pageSize 모두 유효 → 통과', () => {
      const result = SearchMembersSchema.safeParse({
        q: '홍길동',
        category: '기업,학계',
        sort: 'recent',
        page: '2',
        pageSize: '12',
      })
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.q).toBe('홍길동')
      expect(result.data.category).toEqual(['기업', '학계'])
      expect(result.data.sort).toBe('recent')
      expect(result.data.page).toBe(2)
      expect(result.data.pageSize).toBe(12)
    })
  })
})
