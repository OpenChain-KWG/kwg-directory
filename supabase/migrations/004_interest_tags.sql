ALTER TABLE members
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 태그 값 유효성 검사
ALTER TABLE members ADD CONSTRAINT members_tags_check
  CHECK (
    tags <@ ARRAY[
      'License','SBOM','Policy','Supply Chain',
      'Security','Vulnerability','Legal','IP',
      'Tooling','DevSecOps','SCA',
      'OSPO','Governance','Education',
      'ISO5230','AI & OSS','Contribution'
    ]::TEXT[]
  );
