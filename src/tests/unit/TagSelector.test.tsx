import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TagSelector from '@/components/TagSelector'
import { InterestTag } from '@/constants/tags'

describe('TagSelector', () => {
  it('태그 클릭 시 selected 배열에 추가', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TagSelector selected={[]} onChange={onChange} />)

    const licenseBtn = screen.getByRole('button', { name: /^License/ })
    await user.click(licenseBtn)

    expect(onChange).toHaveBeenCalledWith(['License'])
  })

  it('동일 태그 재클릭 시 제거 (토글)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TagSelector selected={['License'] as InterestTag[]} onChange={onChange} />)

    const licenseBtn = screen.getByRole('button', { name: /License/ })
    await user.click(licenseBtn)

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('max(기본 10개) 초과 선택 불가', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const maxSelected: InterestTag[] = [
      'License', 'SBOM', 'Policy', 'Supply Chain', 'Security',
      'Vulnerability', 'Legal', 'IP', 'Tooling', 'DevSecOps',
    ]
    render(<TagSelector selected={maxSelected} onChange={onChange} />)

    // 미선택 태그 클릭 시도
    const scaBtn = screen.getByRole('button', { name: /^SCA/ })
    await user.click(scaBtn)

    // onChange 호출 안 됨 (툴팁만 표시)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('max prop 변경 시 제한 반영', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const selected: InterestTag[] = ['License', 'SBOM', 'Policy']
    render(<TagSelector selected={selected} onChange={onChange} max={3} />)

    const securityBtn = screen.getByRole('button', { name: /^Security/ })
    await user.click(securityBtn)

    // max=3이라 3개 초과 불가
    expect(onChange).not.toHaveBeenCalled()
  })

  it('선택 카운터가 정확히 표시됨', () => {
    const selected: InterestTag[] = ['License', 'SBOM']
    render(<TagSelector selected={selected} onChange={vi.fn()} />)
    expect(screen.getByText('2 / 10')).toBeInTheDocument()
  })

  it('선택된 태그에 체크 아이콘 표시 (aria-pressed)', () => {
    const selected: InterestTag[] = ['License']
    render(<TagSelector selected={selected} onChange={vi.fn()} />)
    const licenseBtn = screen.getByRole('button', { name: /License/ })
    expect(licenseBtn).toHaveAttribute('aria-pressed', 'true')
  })
})
