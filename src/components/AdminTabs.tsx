'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import PendingMembersTable from '@/components/admin/PendingMembersTable'
import ActivityFeed from '@/components/admin/ActivityFeed'
import AdminManagement from '@/components/AdminManagement'
import { Member } from '@/types/member'
import type { AdminInfo } from '@/components/AdminManagement'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'

interface Props {
  initialPending: Member[]
  initialAdmins: AdminInfo[]
  approvedMembers: Pick<Member, 'user_id' | 'name_ko' | 'company' | 'avatar_url'>[]
  currentUserId: string
  initialUnreadCount?: number
}

type Tab = 'pending' | 'admins' | 'activity'

export default function AdminTabs({
  initialPending,
  initialAdmins,
  approvedMembers,
  currentUserId,
  initialUnreadCount,
}: Props) {
  const t = useTranslations('admin')
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount ?? 0)

  async function handleTabChange(value: string) {
    const tab = value as Tab
    setActiveTab(tab)
    if (tab === 'pending' && unreadCount > 0) {
      setUnreadCount(0)
      await fetch('/api/admin/notifications', { method: 'PATCH' }).catch(() => undefined)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="pending" data-testid="admin-tab-pending">
          {t('tabs.pending')}
          {initialPending.length > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-state-primary)] px-1.5 text-xs text-[var(--color-text-on-brand)]">
              {initialPending.length}
            </span>
          )}
          {unreadCount > 0 && (
            <span
              className="ml-1.5 inline-flex h-4 items-center justify-center rounded-full bg-[var(--color-state-danger)] px-1.5 text-xs font-bold text-[var(--color-text-on-brand)]"
              aria-label={t('tabs.newAlert', { count: unreadCount })}
            >
              {t('tabs.newBadge')}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="admins" data-testid="admin-tab-admins">
          {t('tabs.admins')}
        </TabsTrigger>
        <TabsTrigger value="activity" data-testid="admin-tab-activity">
          {t('tabs.activity')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <PendingMembersTable initialPending={initialPending} />
      </TabsContent>
      <TabsContent value="admins">
        <AdminManagement
          initialAdmins={initialAdmins}
          approvedMembers={approvedMembers}
          currentUserId={currentUserId}
        />
      </TabsContent>
      <TabsContent value="activity">
        {activeTab === 'activity' && <ActivityFeed />}
      </TabsContent>
    </Tabs>
  )
}
