import { z } from 'zod'

export const VALID_CATEGORIES = ['기업', '연구/공공', '학계'] as const
export type ValidCategory = (typeof VALID_CATEGORIES)[number]

// optional 카테고리: 등록 폼이 미선택 시 빈 문자열('')을 보내올 수 있어
// enum이 ''를 거부하면 400이 난다(BUG-001). ''를 undefined로 정규화해 막는다.
const categoryField = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.enum(VALID_CATEGORIES).optional()
)

export const MemberCreateSchema = z.object({
  name_ko: z.string().min(1, '이름은 필수입니다').max(50),
  name_en: z.string().max(100).optional(),
  company: z.string().min(1, '소속은 필수입니다').max(100),
  role: z.string().max(100).optional(),
  bio: z.string().max(200).optional(),
  category: categoryField,
  email: z.union([z.string().email(), z.literal('')]).optional(),
  email_public: z.boolean().optional(),
  phone: z.string().max(20).optional(),
  phone_public: z.boolean().optional(),
  linkedin: z.string().max(500).optional(),
  github: z.string().max(500).optional(),
  discord: z.string().max(100).optional(),
  blog: z.string().max(500).optional(),
  avatar_url: z.string().max(1000).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  contact_email: z.string().email('유효한 이메일을 입력해주세요'),
  subscribe_mailing_list: z.boolean(),
  privacy_agreed_at: z.string().min(1, '개인정보 동의는 필수입니다'),
})

export const MemberUpdateSchema = z.object({
  name_ko: z.string().min(1, '이름은 필수입니다').max(50),
  name_en: z.string().max(100).optional(),
  company: z.string().min(1, '소속은 필수입니다').max(100),
  role: z.string().max(100).optional(),
  bio: z.string().max(200).optional(),
  category: categoryField,
  email: z.union([z.string().email('올바른 이메일 형식이 아닙니다'), z.literal('')]).optional(),
  email_public: z.boolean().optional(),
  phone: z.string().max(20).optional(),
  phone_public: z.boolean().optional(),
  linkedin: z.string().max(500).optional(),
  github: z.string().max(500).optional(),
  discord: z.string().max(100).optional(),
  blog: z.string().max(500).optional(),
  avatar_url: z.string().max(1000).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  contact_email: z.union([z.string().email('올바른 이메일 형식이 아닙니다'), z.literal('')]).optional(),
  subscribe_mailing_list: z.boolean().optional(),
})

export const MemberPatchSchema = z.object({
  name_ko: z.string().min(1).max(50).optional(),
  name_en: z.string().max(100).optional(),
  company: z.string().min(1).max(100).optional(),
  role: z.string().max(100).optional(),
  bio: z.string().max(200).optional(),
  category: categoryField,
  email: z.string().email().optional(),
  email_public: z.boolean().optional(),
  linkedin: z.string().max(500).optional(),
  github: z.string().max(500).optional(),
  discord: z.string().max(100).optional(),
  blog: z.string().max(500).optional(),
})

export const AdminIdSchema = z.object({
  id: z.string().uuid('유효한 ID가 아닙니다'),
})

export const AdminRejectSchema = z.object({
  id: z.string().uuid('유효한 ID가 아닙니다'),
  reason: z.string().min(1, '거절 사유는 필수입니다').max(500),
})

export const AdminMembersSchema = z.object({
  id: z.string().uuid('유효한 ID가 아닙니다'),
  approved: z.boolean(),
})

export const AdminAdminsSchema = z.object({
  action: z.enum(['add', 'remove']),
  user_id: z.string().uuid('유효한 user_id가 아닙니다'),
})

export const VALID_SORT = ['name', 'recent', 'random'] as const
export type ValidSort = (typeof VALID_SORT)[number]

export const PAGE_SIZE_MAX_SEARCH = 100

export const SearchMembersSchema = z.object({
  q: z.string().max(100).optional().default(''),
  category: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').filter(Boolean) : []))
    .pipe(z.array(z.enum(VALID_CATEGORIES)).max(VALID_CATEGORIES.length)),
  sort: z.enum(VALID_SORT).optional().default('name'),
  page: z
    .string()
    .optional()
    .transform((val) => Math.max(1, Number(val ?? 1)))
    .pipe(z.number().int().min(1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => Math.min(PAGE_SIZE_MAX_SEARCH, Math.max(1, Number(val ?? 24))))
    .pipe(z.number().int().min(1).max(PAGE_SIZE_MAX_SEARCH)),
})
