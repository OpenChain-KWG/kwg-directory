const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function uploadAvatar(
  file: File,
  userId: string,
  prevUrl?: string
): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error('파일 크기는 2MB 이하여야 합니다')
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('JPEG, PNG, WebP 파일만 업로드 가능합니다')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('userId', userId)
  if (prevUrl) formData.append('prevUrl', prevUrl)

  const res = await fetch('/api/upload/avatar', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? '업로드 실패')
  }

  const data = await res.json()
  return data.url as string
}
