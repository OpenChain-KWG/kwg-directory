/**
 * openapi.ts — KWG Directory REST API 의 캐노니컬 OpenAPI 3.1 문서.
 *
 * 이 객체가 단일 진실원천이다:
 *  - `docs/api/openapi.yaml` 는 `scripts/gen-openapi.mjs` 가 이 객체에서 생성한다.
 *  - 계약 테스트(`src/tests/unit/openapi-contract.test.ts`)가 실제 라우트 파일·zod
 *    스키마와의 드리프트를 검증한다.
 *  - 향후 `/docs/api` Swagger UI 가 이 객체를 그대로 소비한다.
 *
 * 라우트 핸들러를 추가·변경하면 이 문서도 함께 갱신해야 한다(계약 테스트가 강제).
 */

// OpenAPI 전체 타입을 끌어오지 않고 최소 구조만 명시한다(추가 의존성 회피).
type Json = string | number | boolean | null | Json[] | { [k: string]: Json }
export interface OpenApiOperation {
  summary: string
  tags?: string[]
  /** 인증/인가 요구. 계약 테스트가 라우트 핸들러의 auth() 사용과 대조하지 않지만 문서 정합성용. */
  security?: Array<Record<string, string[]>>
  parameters?: Json
  requestBody?: Json
  responses: Record<string, { description: string; content?: Json }>
}
export type HttpMethod = 'get' | 'post' | 'patch' | 'put' | 'delete'
export type OpenApiPaths = Record<string, Partial<Record<HttpMethod, OpenApiOperation>>>

const ERROR_RESPONSE = {
  description: '오류',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
} as const

const ok = (description: string, schemaRef?: string) => ({
  description,
  ...(schemaRef
    ? { content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaRef}` } } } }
    : {}),
})

const bearer = [{ sessionCookie: [] }]

export const openApiPaths: OpenApiPaths = {
  '/api/health': {
    get: {
      summary: '헬스 체크 — 가용성 모니터링용',
      tags: ['system'],
      responses: { '200': ok('정상', 'Health') },
    },
  },

  '/api/members': {
    get: {
      summary: '승인된 멤버 목록(페이지네이션). 비로그인 시 연락처 redact.',
      tags: ['members'],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
        { name: 'category', in: 'query', schema: { type: 'string' } },
        { name: 'tags', in: 'query', schema: { type: 'string' } },
      ],
      responses: { '200': ok('멤버 목록', 'MemberListPaged'), '500': ERROR_RESPONSE },
    },
    post: {
      summary: '내 프로필 생성(가입). 로그인 필요.',
      tags: ['members'],
      security: bearer,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/MemberCreate' } } },
      },
      responses: {
        '201': ok('생성됨', 'Member'),
        '400': ERROR_RESPONSE,
        '401': ERROR_RESPONSE,
        '409': ERROR_RESPONSE,
        '429': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
  },

  '/api/members/search': {
    get: {
      summary: '멤버 검색·필터·정렬(페이지네이션).',
      tags: ['members'],
      parameters: [
        { name: 'q', in: 'query', schema: { type: 'string', maxLength: 100 } },
        { name: 'category', in: 'query', schema: { type: 'string' } },
        { name: 'sort', in: 'query', schema: { type: 'string', enum: ['name', 'recent', 'random'] } },
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
        { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
      ],
      responses: {
        '200': ok('검색 결과', 'MemberSearchResult'),
        '400': ERROR_RESPONSE,
        '429': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
  },

  '/api/members/{id}': {
    get: {
      summary: '멤버 단건 조회. 비로그인 시 연락처 redact.',
      tags: ['members'],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: { '200': ok('멤버', 'Member'), '404': ERROR_RESPONSE, '500': ERROR_RESPONSE },
    },
    patch: {
      summary: '멤버 부분 수정. 본인만.',
      tags: ['members'],
      security: bearer,
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/MemberPatch' } } },
      },
      responses: {
        '200': ok('수정됨', 'Member'),
        '400': ERROR_RESPONSE,
        '401': ERROR_RESPONSE,
        '403': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
    delete: {
      summary: '멤버 삭제. 본인만.',
      tags: ['members'],
      security: bearer,
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '200': ok('삭제됨', 'Success'),
        '401': ERROR_RESPONSE,
        '403': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
  },

  '/api/members/me': {
    get: {
      summary: '내 프로필 조회. 미등록 시 404/null.',
      tags: ['members'],
      security: bearer,
      responses: {
        '200': ok('내 프로필', 'Member'),
        '401': ERROR_RESPONSE,
        '404': ok('미등록'),
        '500': ERROR_RESPONSE,
      },
    },
    patch: {
      summary: '내 프로필 전체 수정.',
      tags: ['members'],
      security: bearer,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/MemberUpdate' } } },
      },
      responses: {
        '200': ok('수정됨', 'Member'),
        '400': ERROR_RESPONSE,
        '401': ERROR_RESPONSE,
        '404': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
    delete: {
      summary: '내 프로필 삭제(탈퇴).',
      tags: ['members'],
      security: bearer,
      responses: {
        '200': ok('삭제됨', 'Success'),
        '401': ERROR_RESPONSE,
        '404': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
  },

  '/api/me/export': {
    get: {
      summary: 'GDPR — 내 데이터 내보내기(JSON 다운로드). rate-limited.',
      tags: ['me'],
      security: bearer,
      responses: {
        '200': ok('데이터 export(application/json 첨부)'),
        '401': ERROR_RESPONSE,
        '429': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
  },

  '/api/me/delete': {
    delete: {
      summary: 'GDPR — 계정·데이터 영구 삭제. rate-limited(일 1회).',
      tags: ['me'],
      security: bearer,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountDeleteRequest' } } },
      },
      responses: {
        '204': ok('삭제됨(본문 없음)'),
        '400': ERROR_RESPONSE,
        '401': ERROR_RESPONSE,
        '429': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
  },

  '/api/upload/avatar': {
    post: {
      summary: '아바타 이미지 업로드(multipart). 2MB·JPEG/PNG/WebP.',
      tags: ['upload'],
      security: bearer,
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
          },
        },
      },
      responses: {
        '200': ok('업로드됨', 'AvatarUploadResult'),
        '400': ERROR_RESPONSE,
        '401': ERROR_RESPONSE,
        '429': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
  },

  '/api/admin/members': {
    get: {
      summary: '[admin] 전체 멤버(대기 포함) 목록.',
      tags: ['admin'],
      security: bearer,
      responses: { '200': ok('멤버 목록', 'MemberList'), '401': ERROR_RESPONSE, '403': ERROR_RESPONSE, '500': ERROR_RESPONSE },
    },
    patch: {
      summary: '[admin] 멤버 승인/거절 토글.',
      tags: ['admin'],
      security: bearer,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminMembers' } } },
      },
      responses: {
        '200': ok('처리됨', 'AdminActionResult'),
        '400': ERROR_RESPONSE,
        '401': ERROR_RESPONSE,
        '403': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
  },

  '/api/admin/approve': {
    post: {
      summary: '[admin] 가입 승인 + 메일링 초대.',
      tags: ['admin'],
      security: bearer,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminId' } } },
      },
      responses: {
        '200': ok('승인됨'),
        '400': ERROR_RESPONSE,
        '401': ERROR_RESPONSE,
        '403': ERROR_RESPONSE,
        '404': ERROR_RESPONSE,
        '429': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
  },

  '/api/admin/reject': {
    post: {
      summary: '[admin] 가입 거절(사유 필수).',
      tags: ['admin'],
      security: bearer,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminReject' } } },
      },
      responses: {
        '200': ok('거절됨', 'Success'),
        '400': ERROR_RESPONSE,
        '401': ERROR_RESPONSE,
        '403': ERROR_RESPONSE,
        '404': ERROR_RESPONSE,
        '429': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
  },

  '/api/admin/reinvite': {
    post: {
      summary: '[admin] 메일링 초대 재발송.',
      tags: ['admin'],
      security: bearer,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminId' } } },
      },
      responses: {
        '200': ok('재발송됨'),
        '400': ERROR_RESPONSE,
        '401': ERROR_RESPONSE,
        '403': ERROR_RESPONSE,
        '404': ERROR_RESPONSE,
        '429': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
  },

  '/api/admin/admins': {
    get: {
      summary: '[admin] 어드민 목록.',
      tags: ['admin'],
      security: bearer,
      responses: { '200': ok('어드민 목록', 'MemberList'), '401': ERROR_RESPONSE, '403': ERROR_RESPONSE, '500': ERROR_RESPONSE },
    },
    patch: {
      summary: '[admin] 어드민 추가/제거.',
      tags: ['admin'],
      security: bearer,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminAdmins' } } },
      },
      responses: {
        '200': ok('처리됨', 'AdminActionResult'),
        '400': ERROR_RESPONSE,
        '401': ERROR_RESPONSE,
        '403': ERROR_RESPONSE,
        '409': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
  },

  '/api/admin/activity': {
    get: {
      summary: '[admin] 감사 활동 로그.',
      tags: ['admin'],
      security: bearer,
      responses: { '200': ok('활동 로그', 'ActivityLog'), '401': ERROR_RESPONSE, '403': ERROR_RESPONSE, '500': ERROR_RESPONSE },
    },
  },

  '/api/admin/notifications': {
    get: {
      summary: '[admin] 알림 목록.',
      tags: ['admin'],
      security: bearer,
      responses: { '200': ok('알림 목록', 'NotificationList'), '401': ERROR_RESPONSE, '403': ERROR_RESPONSE, '500': ERROR_RESPONSE },
    },
    patch: {
      summary: '[admin] 알림 읽음 처리.',
      tags: ['admin'],
      security: bearer,
      responses: { '200': ok('처리됨'), '401': ERROR_RESPONSE, '403': ERROR_RESPONSE, '500': ERROR_RESPONSE },
    },
  },

  '/api/admin/export/csv': {
    get: {
      summary: '[admin] 멤버 CSV 내보내기.',
      tags: ['admin'],
      security: bearer,
      responses: {
        '200': { description: 'CSV', content: { 'text/csv': { schema: { type: 'string' } } } },
        '401': ERROR_RESPONSE,
        '403': ERROR_RESPONSE,
        '500': ERROR_RESPONSE,
      },
    },
  },
}

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'KWG Directory API',
    version: '0.1.0',
    description:
      'OpenChain Korea Work Group 멤버 주소록 REST API. 인증은 next-auth 세션 쿠키 기반. ' +
      '/api/auth/* 는 next-auth 내부 핸들러로 본 문서 범위 밖.',
    license: { name: 'Apache-2.0' },
  },
  servers: [{ url: '/', description: '동일 오리진' }],
  tags: [
    { name: 'system', description: '시스템·헬스' },
    { name: 'members', description: '멤버 디렉토리' },
    { name: 'me', description: '내 데이터(GDPR)' },
    { name: 'upload', description: '파일 업로드' },
    { name: 'admin', description: '운영진 전용' },
  ],
  paths: openApiPaths,
  components: {
    securitySchemes: {
      sessionCookie: { type: 'apiKey', in: 'cookie', name: 'authjs.session-token' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
        required: ['error'],
      },
      Success: {
        type: 'object',
        properties: { success: { type: 'boolean' } },
        required: ['success'],
      },
      Health: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          uptime: { type: 'integer' },
          timestamp: { type: 'string', format: 'date-time' },
          version: { type: 'string' },
        },
        required: ['status', 'uptime', 'timestamp', 'version'],
      },
      Member: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string' },
          name_ko: { type: 'string' },
          name_en: { type: 'string', nullable: true },
          company: { type: 'string' },
          role: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          category: { type: 'string', enum: ['기업', '연구/공공', '학계'], nullable: true },
          email: { type: 'string', nullable: true, description: '비로그인 시 redact' },
          email_public: { type: 'boolean' },
          linkedin: { type: 'string', nullable: true },
          github: { type: 'string', nullable: true },
          discord: { type: 'string', nullable: true },
          blog: { type: 'string', nullable: true },
          avatar_url: { type: 'string', nullable: true },
          tags: { type: 'array', items: { type: 'string' } },
          approved: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'name_ko', 'company', 'approved'],
      },
      MemberList: { type: 'array', items: { $ref: '#/components/schemas/Member' } },
      MemberListPaged: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/MemberList' },
          total: { type: 'integer' },
          page: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
        required: ['data', 'total', 'page', 'totalPages'],
      },
      MemberSearchResult: {
        type: 'object',
        properties: {
          members: { $ref: '#/components/schemas/MemberList' },
          total: { type: 'integer' },
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
        required: ['members', 'total', 'page', 'pageSize', 'totalPages'],
      },
      MemberCreate: {
        type: 'object',
        description: 'zod MemberCreateSchema 와 동기화(계약 테스트가 강제).',
        properties: {
          name_ko: { type: 'string', minLength: 1, maxLength: 50 },
          name_en: { type: 'string', maxLength: 100 },
          company: { type: 'string', minLength: 1, maxLength: 100 },
          role: { type: 'string', maxLength: 100 },
          bio: { type: 'string', maxLength: 200 },
          category: { type: 'string', enum: ['기업', '연구/공공', '학계'] },
          email: { type: 'string', format: 'email' },
          email_public: { type: 'boolean' },
          phone: { type: 'string', maxLength: 20 },
          phone_public: { type: 'boolean' },
          linkedin: { type: 'string', maxLength: 500 },
          github: { type: 'string', maxLength: 500 },
          discord: { type: 'string', maxLength: 100 },
          blog: { type: 'string', maxLength: 500 },
          avatar_url: { type: 'string', maxLength: 1000 },
          tags: { type: 'array', items: { type: 'string', maxLength: 30 }, maxItems: 10 },
          contact_email: { type: 'string', format: 'email' },
          subscribe_mailing_list: { type: 'boolean' },
          privacy_agreed_at: { type: 'string', minLength: 1 },
        },
        required: ['name_ko', 'company', 'contact_email', 'subscribe_mailing_list', 'privacy_agreed_at'],
      },
      MemberUpdate: {
        type: 'object',
        description: 'zod MemberUpdateSchema 와 동기화.',
        properties: {
          name_ko: { type: 'string', minLength: 1, maxLength: 50 },
          name_en: { type: 'string', maxLength: 100 },
          company: { type: 'string', minLength: 1, maxLength: 100 },
          role: { type: 'string', maxLength: 100 },
          bio: { type: 'string', maxLength: 200 },
          category: { type: 'string', enum: ['기업', '연구/공공', '학계'] },
          email: { type: 'string', format: 'email' },
          email_public: { type: 'boolean' },
          phone: { type: 'string', maxLength: 20 },
          phone_public: { type: 'boolean' },
          linkedin: { type: 'string', maxLength: 500 },
          github: { type: 'string', maxLength: 500 },
          discord: { type: 'string', maxLength: 100 },
          blog: { type: 'string', maxLength: 500 },
          avatar_url: { type: 'string', maxLength: 1000 },
          tags: { type: 'array', items: { type: 'string', maxLength: 30 }, maxItems: 10 },
          contact_email: { type: 'string', format: 'email' },
          subscribe_mailing_list: { type: 'boolean' },
        },
        required: ['name_ko', 'company'],
      },
      MemberPatch: {
        type: 'object',
        description: 'zod MemberPatchSchema 와 동기화.',
        properties: {
          name_ko: { type: 'string', minLength: 1, maxLength: 50 },
          name_en: { type: 'string', maxLength: 100 },
          company: { type: 'string', minLength: 1, maxLength: 100 },
          role: { type: 'string', maxLength: 100 },
          bio: { type: 'string', maxLength: 200 },
          category: { type: 'string', enum: ['기업', '연구/공공', '학계'] },
          email: { type: 'string', format: 'email' },
          email_public: { type: 'boolean' },
          linkedin: { type: 'string', maxLength: 500 },
          github: { type: 'string', maxLength: 500 },
          discord: { type: 'string', maxLength: 100 },
          blog: { type: 'string', maxLength: 500 },
        },
      },
      AccountDeleteRequest: {
        type: 'object',
        properties: {
          confirmation: {
            type: 'string',
            enum: ['DELETE-MY-ACCOUNT'],
            description: '삭제 확인 토큰. 정확히 "DELETE-MY-ACCOUNT" 이어야 함.',
          },
        },
        required: ['confirmation'],
      },
      AvatarUploadResult: {
        type: 'object',
        properties: { url: { type: 'string', format: 'uri' } },
        required: ['url'],
      },
      AdminId: {
        type: 'object',
        description: 'zod AdminIdSchema 와 동기화.',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
      AdminReject: {
        type: 'object',
        description: 'zod AdminRejectSchema 와 동기화.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          reason: { type: 'string', minLength: 1, maxLength: 500 },
        },
        required: ['id', 'reason'],
      },
      AdminMembers: {
        type: 'object',
        description: 'zod AdminMembersSchema 와 동기화.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          approved: { type: 'boolean' },
        },
        required: ['id', 'approved'],
      },
      AdminAdmins: {
        type: 'object',
        description: 'zod AdminAdminsSchema 와 동기화.',
        properties: {
          action: { type: 'string', enum: ['add', 'remove'] },
          user_id: { type: 'string', format: 'uuid' },
        },
        required: ['action', 'user_id'],
      },
      AdminActionResult: {
        type: 'object',
        properties: { success: { type: 'boolean' }, action: { type: 'string' } },
        required: ['success', 'action'],
      },
      ActivityLog: { type: 'array', items: { type: 'object' } },
      NotificationList: { type: 'array', items: { type: 'object' } },
    },
  },
} as const
