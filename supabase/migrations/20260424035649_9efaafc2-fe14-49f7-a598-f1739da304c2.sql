
-- 1. Validation trigger for SEO fields on products
CREATE OR REPLACE FUNCTION public.validate_product_seo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.meta_title IS NOT NULL AND char_length(NEW.meta_title) > 70 THEN
    RAISE EXCEPTION 'Meta title must be 70 characters or less (got %).', char_length(NEW.meta_title)
      USING ERRCODE = '22023';
  END IF;

  IF NEW.meta_description IS NOT NULL AND char_length(NEW.meta_description) > 200 THEN
    RAISE EXCEPTION 'Meta description must be 200 characters or less (got %).', char_length(NEW.meta_description)
      USING ERRCODE = '22023';
  END IF;

  IF NEW.canonical_url IS NOT NULL
     AND length(trim(NEW.canonical_url)) > 0
     AND NEW.canonical_url !~* '^https?://' THEN
    RAISE EXCEPTION 'Canonical URL must start with http:// or https://'
      USING ERRCODE = '22023';
  END IF;

  IF NEW.tags IS NOT NULL AND array_length(NEW.tags, 1) > 30 THEN
    RAISE EXCEPTION 'Tags list cannot contain more than 30 entries (got %).', array_length(NEW.tags, 1)
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_product_seo ON public.products;
CREATE TRIGGER trg_validate_product_seo
BEFORE INSERT OR UPDATE OF meta_title, meta_description, canonical_url, tags
ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.validate_product_seo();

-- 2. Duplicate-SEO detection RPC
CREATE OR REPLACE FUNCTION public.find_seo_duplicates(
  _product_id uuid,
  _meta_title text,
  _meta_description text,
  _canonical_url text
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  match_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.slug, 'canonical_url'::text AS match_type
  FROM public.products p
  WHERE _canonical_url IS NOT NULL
    AND length(trim(_canonical_url)) > 0
    AND p.canonical_url = _canonical_url
    AND (_product_id IS NULL OR p.id <> _product_id)
  UNION
  SELECT p.id, p.name, p.slug, 'meta_title'::text
  FROM public.products p
  WHERE _meta_title IS NOT NULL
    AND length(trim(_meta_title)) > 0
    AND p.meta_title = _meta_title
    AND (_product_id IS NULL OR p.id <> _product_id)
  UNION
  SELECT p.id, p.name, p.slug, 'meta_description'::text
  FROM public.products p
  WHERE _meta_description IS NOT NULL
    AND length(trim(_meta_description)) > 0
    AND p.meta_description = _meta_description
    AND (_product_id IS NULL OR p.id <> _product_id)
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.find_seo_duplicates(uuid, text, text, text) TO authenticated;
