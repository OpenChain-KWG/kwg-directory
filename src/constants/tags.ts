export const INTEREST_TAGS = [
  'License', 'SBOM', 'Policy', 'Supply Chain',
  'Security', 'Vulnerability',
  'Legal', 'IP',
  'Tooling', 'DevSecOps', 'SCA',
  'OSPO', 'Governance', 'Education',
  'ISO5230', 'AI & OSS', 'Contribution',
] as const

export type InterestTag = typeof INTEREST_TAGS[number]

export const TAG_CATEGORIES: { label: string; tags: InterestTag[] }[] = [
  {
    label: '컴플라이언스',
    tags: ['License', 'SBOM', 'Policy', 'Supply Chain'],
  },
  {
    label: '보안',
    tags: ['Security', 'Vulnerability'],
  },
  {
    label: '법무',
    tags: ['Legal', 'IP'],
  },
  {
    label: '기술/도구',
    tags: ['Tooling', 'DevSecOps', 'SCA'],
  },
  {
    label: '거버넌스',
    tags: ['OSPO', 'Governance', 'Education'],
  },
  {
    label: '표준·규제',
    tags: ['ISO5230', 'AI & OSS', 'Contribution'],
  },
]
