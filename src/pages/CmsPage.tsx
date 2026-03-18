import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/skeleton';

const CmsPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading } = useQuery({
    queryKey: ['cms-page', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .eq('slug', slug!)
        .eq('is_published', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container-main py-12 max-w-4xl">
          <Skeleton className="h-10 w-1/2 mb-6" />
          <Skeleton className="h-4 w-full mb-3" />
          <Skeleton className="h-4 w-3/4 mb-3" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </Layout>
    );
  }

  if (!page) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">The page you're looking for doesn't exist or has been unpublished.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-12 max-w-4xl">
        <article className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert
          prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground
          prose-a:text-primary prose-strong:text-foreground">
          <h1>{page.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: page.content }} />
        </article>
      </div>
    </Layout>
  );
};

export default CmsPage;
