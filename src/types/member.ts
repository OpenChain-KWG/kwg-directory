export type Category = '기업' | '연구/공공' | '학계'

export type Member = {
  id: string
  user_id: string
  name_ko: string
  name_en?: string
  company: string
  role?: string
  bio?: string
  category?: Category
  email?: string
  email_public: boolean
  phone?: string
  phone_public: boolean
  linkedin?: string
  github?: string
  discord?: string
  blog?: string
  avatar_url?: string
  tags?: string[]
  contact_email?: string
  subscribe_mailing_list?: boolean
  privacy_agreed_at?: string
  rejection_reason?: string
  mailing_invite_sent_at?: string
  mailing_invite_error?: string
  approved: boolean
  created_at: string
  updated_at: string
}

export type MemberPublic = Omit<Member, 'email'> & {
  email?: string  // 로그인한 경우에만 포함
}

export type MemberFormData = {
  name_ko: string
  name_en: string
  company: string
  role: string
  bio: string
  category: Category | ''
  email: string
  email_public: boolean
  phone: string
  phone_public: boolean
  linkedin: string
  github: string
  discord: string
  blog: string
  avatar_url: string
  tags: string[]
  contact_email: string
  subscribe_mailing_list: boolean
}
