CREATE OR REPLACE FUNCTION public.find_seo_duplicates(_product_id uuid, _meta_title text, _meta_description text, _canonical_url text)
RETURNS TABLE(id uuid, name text, slug text, match_type text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.name, p.slug, 'canonical_url'::text AS match_type
  FROM public.products p
  WHERE public.can_manage_admin_products(auth.uid())
    AND p.is_active IS TRUE
    AND _canonical_url IS NOT NULL
    AND length(trim(_canonical_url)) > 0
    AND p.canonical_url = _canonical_url
    AND (_product_id IS NULL OR p.id <> _product_id)
  UNION
  SELECT p.id, p.name, p.slug, 'meta_title'::text
  FROM public.products p
  WHERE public.can_manage_admin_products(auth.uid())
    AND p.is_active IS TRUE
    AND _meta_title IS NOT NULL
    AND length(trim(_meta_title)) > 0
    AND p.meta_title = _meta_title
    AND (_product_id IS NULL OR p.id <> _product_id)
  UNION
  SELECT p.id, p.name, p.slug, 'meta_description'::text
  FROM public.products p
  WHERE public.can_manage_admin_products(auth.uid())
    AND p.is_active IS TRUE
    AND _meta_description IS NOT NULL
    AND length(trim(_meta_description)) > 0
    AND p.meta_description = _meta_description
    AND (_product_id IS NULL OR p.id <> _product_id)
  LIMIT 50;
$function$;