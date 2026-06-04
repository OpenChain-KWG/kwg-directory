-- Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- 공개 읽기
CREATE POLICY "공개 읽기 허용"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 인증 사용자 업로드
CREATE POLICY "인증 사용자 업로드 허용"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 본인 파일 수정 (owner 컬럼 사용)
CREATE POLICY "본인 파일 수정 허용"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND owner = auth.uid()
);

-- 본인 파일 삭제 (owner 컬럼 사용)
CREATE POLICY "본인 파일 삭제 허용"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND owner = auth.uid()
);

ALTER TABLE members ADD COLUMN IF NOT EXISTS avatar_url TEXT;