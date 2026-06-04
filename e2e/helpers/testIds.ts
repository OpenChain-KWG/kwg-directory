// 컴포넌트에 data-testid를 추가하고 이 파일에서 상수로 관리
// 새 testId 추가 시 반드시 이 파일에도 등록

export const T = {
  // Layout
  mainHeading:         'main-heading',

  // Navbar
  mobileLogo:                'mobile-logo',
  logoutBtn:                 'logout-btn',
  registerProfileLink:       'register-profile-link',
  editProfileLink:           'edit-profile-link',
  // Navbar (Phase 4 트랙 D — chunk 1)
  navbarMobileMenuBtn:       'navbar-mobile-menu-btn',
  navbarMobileMenu:          'navbar-mobile-menu',
  navbarMobileDirectory:     'navbar-mobile-directory',
  navbarMobilePrivacy:       'navbar-mobile-privacy',
  navbarMobileEditProfile:   'navbar-mobile-edit-profile',
  navbarMobileRegisterProfile: 'navbar-mobile-register-profile',
  navbarMobileAdmin:         'navbar-mobile-admin',
  navbarPrivacyLink:         'navbar-privacy-link',
  navbarAdminLink:           'navbar-admin-link',
  navbarLoginGitHubBtn:      'navbar-login-github-btn',
  navbarLoginGoogleBtn:      'navbar-login-google-btn',
  localeSwitcher:            'locale-switcher',
  themeToggle:               'theme-toggle',

  // Footer (Phase 4 트랙 D — chunk 1)
  siteFooter:                'site-footer',
  footerDirectoryLink:       'footer-directory-link',
  footerKwgSiteLink:         'footer-kwg-site-link',
  footerGitHubLink:          'footer-github-link',
  footerPrivacyLink:         'footer-privacy-link',

  // Privacy page (Phase 4 트랙 D — chunk 1)
  privacyPageHeader:         'privacy-page-header',
  privacyToc:                'privacy-toc',
  privacyLastUpdated:        'privacy-last-updated',
  privacySectionCollection:  'privacy-section-collection',
  privacySectionPurpose:     'privacy-section-purpose',
  privacySectionRetention:   'privacy-section-retention',
  privacySectionThirdParty:  'privacy-section-thirdParty',
  privacySectionProcessors:  'privacy-section-processors',
  privacySectionRights:      'privacy-section-rights',
  privacySectionWithdraw:    'privacy-section-withdraw',
  privacySectionOfficer:     'privacy-section-officer',
  privacySectionChanges:     'privacy-section-changes',

  // Loading / error route screens (Phase 4 트랙 D — chunk 1)
  loadingDefault:            'loading-default',
  loadingAdmin:              'loading-admin',
  loadingProfileNew:         'loading-profile-new',
  loadingProfileEdit:        'loading-profile-edit',
  loadingPrivacy:            'loading-privacy',
  loadingMemberDetail:       'loading-memberDetail',
  errorDefault:              'error-default',
  errorAdmin:                'error-admin',
  errorProfileNew:           'error-profile-new',
  errorProfileEdit:          'error-profile-edit',
  errorPrivacy:              'error-privacy',
  errorMemberDetail:         'error-member-detail',
  errorRetryBtn:             'error-retry-btn',
  errorBackHomeBtn:          'error-back-home-btn',

  // Profile Form
  profileFormHeading:            'profile-form-heading',
  registrationSubmitBtn:         'registration-submit-btn',
  registrationSuccess:           'registration-success',
  registrationInputNameKo:       'registration-input-name-ko',
  registrationInputCompany:      'registration-input-company',
  registrationInputRole:         'registration-input-role',
  registrationInputContactEmail: 'registration-input-contact-email',

  // Profile Form V2 (Phase 4 트랙 ? — chunk 2: 단일 페이지 재설계)
  profileForm:                   'profile-form',
  profileFormInputNameEn:        'profile-form-input-name-en',
  profileFormInputBio:           'profile-form-input-bio',
  profileFormSelectCategory:     'profile-form-select-category',
  profileFormInputEmail:         'profile-form-input-email',
  profileFormInputPhone:         'profile-form-input-phone',
  profileFormInputLinkedin:      'profile-form-input-linkedin',
  profileFormInputGithub:        'profile-form-input-github',
  profileFormInputDiscord:       'profile-form-input-discord',
  profileFormInputBlog:          'profile-form-input-blog',
  profileFormSubscribeCheckbox:  'profile-form-subscribe-checkbox',
  profileFormPrivacyCheckbox:    'profile-form-privacy-checkbox',
  profileFormPhonePublicSwitch:  'profile-form-phone-public-switch',
  profileFormError:              'profile-form-error',
  profileFormPreview:            'profile-form-preview',
  profileFormDraftStatus:        'profile-form-draft-status',
  profileFormWithdrawBtn:        'profile-form-withdraw-btn',
  profileFormWithdrawDialog:     'profile-form-withdraw-dialog',
  profileFormWithdrawConfirm:    'profile-form-withdraw-confirm',
  profileFormWithdrawCancel:     'profile-form-withdraw-cancel',

  // Account / GDPR (자기정보 — export/delete)
  accountDataSection:            'account-data-section',
  accountExportBtn:              'account-export-btn',
  accountDeleteBtn:              'account-delete-btn',
  accountDeleteDialog:           'account-delete-dialog',
  accountDeleteConfirmInput:     'account-delete-confirm-input',
  accountDeleteConfirmBtn:       'account-delete-confirm-btn',

  // Directory screens
  notRegisteredScreen:   'not-registered-screen',
  pendingApprovalScreen: 'pending-approval-screen',

  // Admin
  adminTable:      'admin-table',
  adminManagement: 'admin-management',
  mailingListStatus: 'mailing-list-status',

  // Admin — Phase 4 chunk 3 (DataTable 재설계)
  adminTabPending:        'admin-tab-pending',
  adminTabAdmins:         'admin-tab-admins',
  adminTabActivity:       'admin-tab-activity',
  adminBulkBar:           'admin-bulk-bar',
  adminBulkApproveBtn:    'admin-bulk-approve-btn',
  adminBulkRejectBtn:     'admin-bulk-reject-btn',
  adminBulkClearBtn:      'admin-bulk-clear-btn',
  adminRejectDialog:      'admin-reject-dialog',
  adminRejectSelect:      'admin-reject-select',
  adminRejectConfirmBtn:  'admin-reject-confirm-btn',
  adminMemberDetailSheet: 'admin-member-detail-sheet',
  adminActivityFeed:      'admin-activity-feed',
  adminActivityItem:      'admin-activity-item',
  adminBulkResult:        'admin-bulk-result',


  // Directory v2 (Phase 3 트랙 D — chunk 1)
  directoryV2Page:        'directory-v2-page',
  directoryV2Hero:        'directory-v2-hero',
  directoryV2HeroTitle:   'directory-v2-hero-title',
  directoryV2SearchInput: 'directory-v2-search-input',
  directoryV2SearchClear: 'directory-v2-search-clear',
  directoryV2Filters:     'directory-v2-filters',
  directoryV2FilterChip:  'directory-v2-filter-chip',
  directoryV2SortSelect:  'directory-v2-sort-select',
  directoryV2ResultCount: 'directory-v2-result-count',
  directoryV2Grid:        'directory-v2-grid',
  directoryV2Card:        'directory-v2-card',
  directoryV2EmptyState:  'directory-v2-empty-state',
  directoryV2EmptyReset:  'directory-v2-empty-reset',
  directoryV2Skeleton:    'directory-v2-skeleton',

  // Directory v2 (Phase 3 트랙 D — chunk 2)
  directoryV2VirtualGrid:        'directory-v2-virtual-grid',
  directoryV2VirtualRow:         'directory-v2-virtual-row',
  directoryV2VirtualCell:        'directory-v2-virtual-cell',
  directoryV2Pagination:         'directory-v2-pagination',
  directoryV2PaginationPrev:     'directory-v2-pagination-prev',
  directoryV2PaginationNext:     'directory-v2-pagination-next',
  memberDetailSheet:             'member-detail-sheet',
  memberDetailSheetTitle:        'member-detail-sheet-title',
  memberDetailSheetNav:          'member-detail-sheet-nav',
  memberDetailPrevBtn:           'member-detail-prev-btn',
  memberDetailNextBtn:           'member-detail-next-btn',
  directoryCommandMenu:          'directory-command-menu',
  directoryCommandMenuInput:     'directory-command-menu-input',
  directoryCommandMenuList:      'directory-command-menu-list',
  directoryCommandMenuResult:    'directory-command-menu-result',
  directoryCommandMenuEditProfile: 'directory-command-menu-edit-profile',
  directoryCommandMenuAdmin:     'directory-command-menu-admin',
  directoryCommandMenuTheme:     'directory-command-menu-theme',
  directoryCommandMenuLogout:    'directory-command-menu-logout',
  directoryCommandMenuPrivacy:   'directory-command-menu-privacy',
} as const

/** @deprecated TEST_IDS는 T로 교체되었습니다. */
export const TEST_IDS = T
