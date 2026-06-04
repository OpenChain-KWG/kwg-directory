import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import {
  DirectoryListProvider,
  persistDirectoryIds,
  readPersistedDirectoryIds,
  useDirectoryList,
} from '@/components/directory'

function Probe() {
  const ctx = useDirectoryList()
  return <div data-testid="probe">{(ctx?.ids ?? []).join(',')}</div>
}

describe('DirectoryListContext', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('Provider로 감싸지 않으면 null을 반환한다', () => {
    render(<Probe />)
    expect(screen.getByTestId('probe')).toHaveTextContent('')
  })

  it('Provider로 ids 배열을 전달하면 컨텍스트로 노출된다', () => {
    render(
      <DirectoryListProvider ids={['a', 'b', 'c']}>
        <Probe />
      </DirectoryListProvider>,
    )
    expect(screen.getByTestId('probe')).toHaveTextContent('a,b,c')
  })

  it('persistDirectoryIds + read는 round-trip이 가능하다', () => {
    persistDirectoryIds(['x', 'y'])
    expect(readPersistedDirectoryIds()).toEqual(['x', 'y'])
  })

  it('비-배열 sessionStorage 값은 null로 처리된다', () => {
    window.sessionStorage.setItem('kwg.directoryList.ids', '"not-array"')
    expect(readPersistedDirectoryIds()).toBeNull()
  })
})
