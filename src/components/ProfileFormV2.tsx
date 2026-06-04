'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

import { Member, MemberFormData, Category } from '@/types/member'
import { InterestTag } from '@/constants/tags'
import { CATEGORIES } from '@/lib/mock-data'
import { MemberCreateSchema, MemberUpdateSchema } from '@/lib/schemas'
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@/components/ui'
import { FormSection } from '@/components/patterns'
import AvatarUpload from './AvatarUpload'
import TagSelector from './TagSelector'
import { MemberCardV2 } from './directory'

interface Props {
  userId: string
  mode?: 'create' | 'edit'
  initialData?: Member
  /** Session avatar fallback used to seed a brand-new profile. */
  userImage?: string
}

type FieldErrors = Partial<Record<keyof MemberFormData | 'privacy', string>>

const EMPTY_FORM: MemberFormData = {
  name_ko: '',
  name_en: '',
  company: '',
  role: '',
  bio: '',
  category: '',
  email: '',
  email_public: false,
  phone: '',
  phone_public: false,
  linkedin: '',
  github: '',
  discord: '',
  blog: '',
  avatar_url: '',
  tags: [],
  contact_email: '',
  subscribe_mailing_list: true,
}

function toFormData(member: Member): MemberFormData {
  return {
    name_ko: member.name_ko ?? '',
    name_en: member.name_en ?? '',
    company: member.company ?? '',
    role: member.role ?? '',
    bio: member.bio ?? '',
    category: (member.category as Category | '') ?? '',
    email: member.email ?? '',
    email_public: member.email_public ?? false,
    phone: member.phone ?? '',
    phone_public: member.phone_public ?? false,
    linkedin: member.linkedin ?? '',
    github: member.github ?? '',
    discord: member.discord ?? '',
    blog: member.blog ?? '',
    avatar_url: member.avatar_url ?? '',
    tags: member.tags ?? [],
    contact_email: member.contact_email ?? '',
    subscribe_mailing_list: member.subscribe_mailing_list ?? true,
  }
}

/** Build a Member-shaped object for the live preview card. */
function toPreviewMember(userId: string, form: MemberFormData): Member {
  const now = new Date().toISOString()
  return {
    id: 'preview',
    user_id: userId,
    name_ko: form.name_ko,
    name_en: form.name_en || undefined,
    company: form.company,
    role: form.role || undefined,
    bio: form.bio || undefined,
    category: (form.category || undefined) as Category | undefined,
    email: form.email || undefined,
    email_public: form.email_public,
    phone: form.phone || undefined,
    phone_public: form.phone_public,
    linkedin: form.linkedin || undefined,
    github: form.github || undefined,
    discord: form.discord || undefined,
    blog: form.blog || undefined,
    avatar_url: form.avatar_url || undefined,
    tags: form.tags,
    approved: false,
    created_at: now,
    updated_at: now,
  }
}

const DRAFT_PREFIX = 'kwg:profile-draft:'
const DRAFT_DEBOUNCE_MS = 600

export default function ProfileFormV2({
  userId,
  mode = 'create',
  initialData,
  userImage,
}: Props) {
  const t = useTranslations('profileForm')
  const draftKey = `${DRAFT_PREFIX}${userId}`

  const [form, setForm] = useState<MemberFormData>(() =>
    initialData
      ? toFormData(initialData)
      : { ...EMPTY_FORM, avatar_url: userImage ?? '' },
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedSnapshot, setSubmittedSnapshot] = useState<{
    email: string
    subscribe: boolean
  }>({ email: '', subscribe: true })
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  )
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [avatarResetKey, setAvatarResetKey] = useState(0)

  const draftHydrated = useRef(false)
  const submitInFlight = useRef(false)

  // ── Draft restore (create mode only) ──────────────────────────────
  useEffect(() => {
    if (mode !== 'create' || draftHydrated.current) return
    draftHydrated.current = true
    try {
      const raw = window.localStorage.getItem(draftKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MemberFormData>
        setForm((prev) => ({ ...prev, ...parsed }))
        setDraftStatus('saved')
      }
    } catch {
      // 손상된 draft는 무시
    }
  }, [mode, draftKey])

  // ── Draft autosave (create mode only, debounced) ──────────────────
  useEffect(() => {
    if (mode !== 'create' || !draftHydrated.current) return
    setDraftStatus('saving')
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(form))
        setDraftStatus('saved')
      } catch {
        setDraftStatus('idle')
      }
    }, DRAFT_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [form, mode, draftKey])

  const set = useCallback(
    <K extends keyof MemberFormData>(field: K, value: MemberFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => {
        if (!prev[field]) return prev
        const next = { ...prev }
        delete next[field]
        return next
      })
    },
    [],
  )

  // ── Required-field gate (drives submit disabled state) ────────────
  const requiredMet = useMemo(() => {
    const base =
      form.name_ko.trim() !== '' &&
      form.company.trim() !== ''
    if (mode === 'create') {
      return base && form.contact_email.trim() !== '' && privacyAgreed
    }
    return base
  }, [form.name_ko, form.company, form.contact_email, privacyAgreed, mode])

  const validate = useCallback((): FieldErrors => {
    const next: FieldErrors = {}
    if (mode === 'create') {
      const result = MemberCreateSchema.safeParse({
        ...form,
        category: form.category || undefined,
        privacy_agreed_at: privacyAgreed ? new Date().toISOString() : '',
      })
      if (!result.success) {
        const flat = result.error.flatten().fieldErrors
        for (const [key, msgs] of Object.entries(flat)) {
          if (!msgs?.length) continue
          if (key === 'privacy_agreed_at') {
            next.privacy = t('validation.privacyRequired')
          } else {
            next[key as keyof MemberFormData] = msgs[0]
          }
        }
      }
      if (!privacyAgreed) next.privacy = t('validation.privacyRequired')
    } else {
      const result = MemberUpdateSchema.safeParse({
        ...form,
        category: form.category || undefined,
      })
      if (!result.success) {
        const flat = result.error.flatten().fieldErrors
        for (const [key, msgs] of Object.entries(flat)) {
          if (msgs?.length) next[key as keyof MemberFormData] = msgs[0]
        }
      }
    }
    return next
  }, [form, privacyAgreed, mode, t])

  const handleSubmit = async () => {
    if (submitting || submitInFlight.current) return
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    submitInFlight.current = true
    setSubmitting(true)
    setSubmitError('')
    try {
      const isEdit = mode === 'edit'
      // 미선택 시 ''로 남는 optional enum(category)을 undefined로 정규화해
      // 서버 검증 400을 막는다 (BUG-001).
      const normalized = { ...form, category: form.category || undefined }
      const body = isEdit
        ? normalized
        : { ...normalized, privacy_agreed_at: new Date().toISOString() }
      const res = await fetch(isEdit ? '/api/members/me' : '/api/members', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const fieldErrors = data?.details?.fieldErrors as
          | Record<string, string[]>
          | undefined
        if (fieldErrors) {
          const mapped: FieldErrors = {}
          for (const [key, msgs] of Object.entries(fieldErrors)) {
            if (msgs?.length) mapped[key as keyof MemberFormData] = msgs[0]
          }
          if (Object.keys(mapped).length > 0) setErrors(mapped)
        }
        throw new Error(
          data?.error ?? t(isEdit ? 'errors.updateFailed' : 'errors.submitFailed'),
        )
      }
      if (isEdit) {
        window.location.href = '/?updated=1'
        return
      }
      // create — clear draft + show inline success
      try {
        window.localStorage.removeItem(draftKey)
      } catch {
        // ignore
      }
      setSubmittedSnapshot({
        email: form.contact_email,
        subscribe: form.subscribe_mailing_list,
      })
      setSubmitted(true)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : t('errors.genericError'))
      submitInFlight.current = false
    } finally {
      setSubmitting(false)
    }
  }

  const handleWithdraw = async () => {
    setWithdrawing(true)
    try {
      const res = await fetch('/api/members/me', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? t('withdraw.error'))
      }
      await signOut({ callbackUrl: '/?withdrawn=1' })
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : t('withdraw.error'))
      setWithdrawing(false)
      setShowWithdraw(false)
    }
  }

  // ── Success screen (create only) ──────────────────────────────────
  if (submitted) {
    return (
      <div
        data-testid="registration-success"
        className="flex flex-col items-center gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-8 text-center"
      >
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-100)] text-[var(--color-state-primary)]">
          <Check className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="text-xl font-bold text-[var(--color-text-default)]">
          {t('success.title')}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t('success.description')}
        </p>
        <p className="break-all text-sm font-semibold text-[var(--color-state-primary)]">
          {submittedSnapshot.email}
        </p>
        <div className="w-full space-y-2 rounded-lg bg-[var(--color-bg-surface-alt)] p-4 text-left text-sm">
          <p className="mb-1 font-medium text-[var(--color-text-default)]">
            {t('success.nextTitle')}
          </p>
          <p className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <Check
              className="h-4 w-4 shrink-0 text-[var(--color-state-primary)]"
              aria-hidden
            />
            {t('success.directoryAccess')}
          </p>
          {submittedSnapshot.subscribe && (
            <p className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <Check
                className="h-4 w-4 shrink-0 text-[var(--color-state-primary)]"
                aria-hidden
              />
              {t('success.mailingInvite')}
            </p>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {t('success.contact')}{' '}
          <a
            href="mailto:korea-sg-planning@lists.openchainproject.org"
            className="text-[var(--color-state-primary)] underline"
          >
            korea-sg-planning@lists.openchainproject.org
          </a>
        </p>
      </div>
    )
  }

  const previewMember = toPreviewMember(userId, form)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      {/* ── Form column ─────────────────────────────────────────── */}
      <form
        data-testid="profile-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void handleSubmit()
        }}
        className="flex min-w-0 flex-col gap-8"
      >
        {/* Section: Basic info */}
        <FormSection
          title={t('sections.basic.title')}
          description={t('sections.basic.description')}
        >
          {/* Avatar */}
          <FormField>
            <FormField.Label>{t('fields.avatar')}</FormField.Label>
            <div className="flex flex-col items-center gap-2">
              <AvatarUpload
                key={avatarResetKey}
                currentUrl={form.avatar_url || undefined}
                userId={userId}
                name={form.name_ko}
                onUpload={(url) => set('avatar_url', url)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  set('avatar_url', '')
                  setAvatarResetKey((k) => k + 1)
                }}
              >
                {t('avatar.useDefault')}
              </Button>
            </div>
            <FormField.Helper>{t('hints.avatar')}</FormField.Helper>
          </FormField>

          <FormField id="name_ko" hasError={!!errors.name_ko}>
            <FormField.Label>
              {t('fields.nameKo')}{' '}
              <span className="text-[var(--color-state-danger)]" aria-hidden>
                *
              </span>
            </FormField.Label>
            <FormField.Control>
              <Input
                data-testid="registration-input-name-ko"
                aria-required="true"
                value={form.name_ko}
                error={!!errors.name_ko}
                onChange={(e) => set('name_ko', e.target.value)}
                onBlur={() => {
                  if (!form.name_ko.trim())
                    setErrors((p) => ({
                      ...p,
                      name_ko: t('validation.nameKoRequired'),
                    }))
                }}
                placeholder={t('placeholders.nameKo')}
              />
            </FormField.Control>
            <FormField.Error>{errors.name_ko}</FormField.Error>
          </FormField>

          <FormField id="name_en">
            <FormField.Label>{t('fields.nameEn')}</FormField.Label>
            <FormField.Control>
              <Input
                data-testid="profile-form-input-name-en"
                value={form.name_en}
                onChange={(e) => set('name_en', e.target.value)}
                placeholder={t('placeholders.nameEn')}
              />
            </FormField.Control>
          </FormField>

          <FormField id="company" hasError={!!errors.company}>
            <FormField.Label>
              {t('fields.company')}{' '}
              <span className="text-[var(--color-state-danger)]" aria-hidden>
                *
              </span>
            </FormField.Label>
            <FormField.Control>
              <Input
                data-testid="registration-input-company"
                aria-required="true"
                value={form.company}
                error={!!errors.company}
                onChange={(e) => set('company', e.target.value)}
                onBlur={() => {
                  if (!form.company.trim())
                    setErrors((p) => ({
                      ...p,
                      company: t('validation.companyRequired'),
                    }))
                }}
                placeholder={t('placeholders.company')}
              />
            </FormField.Control>
            <FormField.Error>{errors.company}</FormField.Error>
          </FormField>

          <FormField id="role">
            <FormField.Label>{t('fields.role')}</FormField.Label>
            <FormField.Control>
              <Input
                data-testid="registration-input-role"
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
                placeholder={t('placeholders.role')}
              />
            </FormField.Control>
            <FormField.Helper>{t('hints.role')}</FormField.Helper>
          </FormField>

          <FormField id="category">
            <FormField.Label>{t('fields.category')}</FormField.Label>
            <Select
              value={form.category || undefined}
              onValueChange={(value) => set('category', value as Category)}
            >
              <SelectTrigger
                id="category"
                data-testid="profile-form-select-category"
                aria-label={t('fields.category')}
              >
                <SelectValue placeholder={t('placeholders.categorySelect')} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField id="bio">
            <FormField.Label>{t('fields.bio')}</FormField.Label>
            <FormField.Control>
              <Textarea
                data-testid="profile-form-input-bio"
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder={t('placeholders.bio')}
                rows={3}
                maxLength={200}
              />
            </FormField.Control>
            <p className="text-right text-xs text-[var(--color-text-muted)]">
              {t('bioCount', { count: form.bio.length })}
            </p>
          </FormField>
        </FormSection>

        {/* Section: Contact · Social */}
        <FormSection
          title={t('sections.contact.title')}
          description={t('sections.contact.description')}
        >
          <FormField id="contact_email" hasError={!!errors.contact_email}>
            <FormField.Label>
              {t('fields.contactEmail')}{' '}
              <span className="text-[var(--color-state-danger)]" aria-hidden>
                *
              </span>
            </FormField.Label>
            <FormField.Control>
              <Input
                type="email"
                data-testid="registration-input-contact-email"
                aria-required="true"
                value={form.contact_email}
                error={!!errors.contact_email}
                onChange={(e) => set('contact_email', e.target.value)}
                placeholder={t('placeholders.contactEmail')}
              />
            </FormField.Control>
            <FormField.Helper>{t('hints.contactEmail')}</FormField.Helper>
            <FormField.Error>{errors.contact_email}</FormField.Error>
          </FormField>

          <FormField id="email" hasError={!!errors.email}>
            <FormField.Label>{t('fields.email')}</FormField.Label>
            <FormField.Control>
              <Input
                type="email"
                data-testid="profile-form-input-email"
                value={form.email}
                error={!!errors.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder={t('placeholders.email')}
              />
            </FormField.Control>
            <FormField.Error>{errors.email}</FormField.Error>
          </FormField>

          <FormField id="phone">
            <FormField.Label>{t('fields.phone')}</FormField.Label>
            <FormField.Control>
              <Input
                type="tel"
                data-testid="profile-form-input-phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder={t('placeholders.phone')}
              />
            </FormField.Control>
          </FormField>

          <FormField id="linkedin">
            <FormField.Label>{t('fields.linkedin')}</FormField.Label>
            <FormField.Control>
              <Input
                data-testid="profile-form-input-linkedin"
                value={form.linkedin}
                onChange={(e) => set('linkedin', e.target.value)}
                placeholder={t('placeholders.linkedin')}
              />
            </FormField.Control>
          </FormField>

          <FormField id="github">
            <FormField.Label>{t('fields.github')}</FormField.Label>
            <FormField.Control>
              <Input
                data-testid="profile-form-input-github"
                value={form.github}
                onChange={(e) => set('github', e.target.value)}
                placeholder={t('placeholders.github')}
              />
            </FormField.Control>
          </FormField>

          <FormField id="discord">
            <FormField.Label>{t('fields.discord')}</FormField.Label>
            <FormField.Control>
              <Input
                data-testid="profile-form-input-discord"
                value={form.discord}
                onChange={(e) => set('discord', e.target.value)}
                placeholder={t('placeholders.discord')}
              />
            </FormField.Control>
          </FormField>

          <FormField id="blog">
            <FormField.Label>{t('fields.blog')}</FormField.Label>
            <FormField.Control>
              <Input
                data-testid="profile-form-input-blog"
                value={form.blog}
                onChange={(e) => set('blog', e.target.value)}
                placeholder={t('placeholders.blog')}
              />
            </FormField.Control>
          </FormField>

          <FormField>
            <FormField.Label id="tags-label">{t('fields.tags')}</FormField.Label>
            <div role="group" aria-labelledby="tags-label">
              <TagSelector
                selected={form.tags as InterestTag[]}
                onChange={(tags) => set('tags', tags)}
                max={10}
              />
            </div>
            <FormField.Helper>{t('hints.tags')}</FormField.Helper>
          </FormField>
        </FormSection>

        {/* Section: Visibility */}
        <FormSection
          title={t('sections.visibility.title')}
          description={t('sections.visibility.description')}
        >
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-border-default)] p-4">
            <div className="min-w-0">
              <Label htmlFor="phone_public">{t('fields.phonePublic')}</Label>
              <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                {form.phone || t('privacy.noPhoneInput')}
              </p>
            </div>
            <Switch
              id="phone_public"
              data-testid="profile-form-phone-public-switch"
              checked={form.phone_public}
              disabled={!form.phone}
              onCheckedChange={(checked) => set('phone_public', checked)}
              aria-label={t('fields.phonePublic')}
            />
          </div>
          <div className="rounded-lg bg-[var(--color-bg-surface-alt)] p-4 text-sm text-[var(--color-text-muted)]">
            <p className="mb-1 font-medium text-[var(--color-text-default)]">
              {mode === 'edit'
                ? t('privacy.editReviewNotice')
                : t('privacy.reviewNotice')}
            </p>
            <p>
              {mode === 'edit'
                ? t('privacy.editReviewDetail')
                : t('privacy.reviewDetail')}
            </p>
          </div>
        </FormSection>

        {/* Section: Agreement (create only) */}
        {mode === 'create' && (
          <FormSection
            title={t('sections.agreement.title')}
            description={t('sections.agreement.description')}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id="subscribe"
                data-testid="profile-form-subscribe-checkbox"
                checked={form.subscribe_mailing_list}
                onCheckedChange={(checked) =>
                  set('subscribe_mailing_list', checked === true)
                }
                className="mt-0.5"
              />
              <Label
                htmlFor="subscribe"
                className="font-normal leading-relaxed text-[var(--color-text-default)]"
              >
                {t('agreement.subscribe')}
                <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">
                  {t('agreement.subscribeHint')}
                </span>
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="privacy"
                data-testid="profile-form-privacy-checkbox"
                checked={privacyAgreed}
                onCheckedChange={(checked) => {
                  setPrivacyAgreed(checked === true)
                  if (checked === true)
                    setErrors((p) => {
                      const next = { ...p }
                      delete next.privacy
                      return next
                    })
                }}
                aria-invalid={!!errors.privacy}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="privacy"
                  className="font-normal leading-relaxed text-[var(--color-text-default)]"
                >
                  {t.rich('agreement.privacyConsent', {
                    link: (chunks) => (
                      <Link
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-state-primary)] underline"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}{' '}
                  <span
                    className="text-[var(--color-state-danger)]"
                    aria-hidden
                  >
                    *
                  </span>
                </Label>
                {errors.privacy && (
                  <p
                    role="alert"
                    className="text-xs font-medium text-[var(--color-state-danger)]"
                  >
                    {errors.privacy}
                  </p>
                )}
              </div>
            </div>
          </FormSection>
        )}

        {/* Submit error */}
        {submitError && (
          <p
            data-testid="profile-form-error"
            role="alert"
            className="rounded-lg bg-[var(--color-danger-100)] px-4 py-3 text-sm font-medium text-[var(--color-state-danger)]"
          >
            {submitError}
          </p>
        )}

        {/* Footer: draft status + submit */}
        <div className="flex flex-col gap-3 border-t border-[var(--color-border-subtle)] pt-6">
          {mode === 'create' && draftStatus !== 'idle' && (
            <p
              data-testid="profile-form-draft-status"
              className="text-xs text-[var(--color-text-muted)]"
              aria-live="polite"
            >
              {draftStatus === 'saving' ? t('draft.saving') : t('draft.saved')}
            </p>
          )}
          <Button
            type="submit"
            data-testid="registration-submit-btn"
            disabled={!requiredMet}
            loading={submitting}
            className="w-full"
          >
            {mode === 'edit'
              ? submitting
                ? t('nav.saving')
                : t('nav.save')
              : submitting
                ? t('nav.submitting')
                : t('nav.submit')}
          </Button>
        </div>

        {/* Withdraw (edit only) */}
        {mode === 'edit' && (
          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="profile-form-withdraw-btn"
              onClick={() => setShowWithdraw(true)}
              className="text-[var(--color-state-danger)] hover:text-[var(--color-danger-600)]"
            >
              {t('nav.withdraw')}
            </Button>
          </div>
        )}
      </form>

      {/* ── Preview column ──────────────────────────────────────── */}
      <aside
        aria-label={t('preview.title')}
        className="order-first lg:order-none lg:sticky lg:top-24 lg:self-start"
      >
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-text-default)]">
              {t('preview.title')}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              {t('preview.description')}
            </p>
          </div>
          {/* Preview is non-interactive: intercept the card's Link so the
              draft "preview" id never navigates to a real detail route. */}
          <div
            data-testid="profile-form-preview"
            onClickCapture={(e) => e.preventDefault()}
          >
            <MemberCardV2 member={previewMember} />
          </div>
        </div>
      </aside>

      {/* Withdraw dialog */}
      {mode === 'edit' && (
        <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
          <DialogContent
            data-testid="profile-form-withdraw-dialog"
            className="max-w-sm"
          >
            <DialogHeader>
              <DialogTitle>{t('withdraw.title')}</DialogTitle>
              <DialogDescription>
                {t('withdraw.description')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                data-testid="profile-form-withdraw-cancel"
                disabled={withdrawing}
                onClick={() => setShowWithdraw(false)}
              >
                {t('withdraw.cancel')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                data-testid="profile-form-withdraw-confirm"
                loading={withdrawing}
                onClick={() => void handleWithdraw()}
              >
                {withdrawing ? t('withdraw.processing') : t('withdraw.confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
