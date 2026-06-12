import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { SeoHead } from '@/components/seo/SeoHead';
import { Link } from 'react-router-dom';

const categories = ['All', 'Shopping Tips', 'Tech', 'Fashion', 'Home', 'News'];

const posts = [
  { id: 0, title: "The Ultimate Guide to Men's Ties and Formal Accessories in Bangladesh", cat: 'Fashion', date: 'Jun 12, 2026', author: 'Team Eylace', excerpt: "Styles, fabrics, knots and tie price in BD — plus the cufflinks, pocket squares and tie clips every man should own.", img: '👔', href: '/blog/mens-fashion-tie-guide' },
  { id: 1, title: 'Top 10 Smartphones Under ৳20,000 in 2026', cat: 'Tech', date: 'Mar 15, 2026', author: 'Rafiq Ahmed', excerpt: 'Looking for the best budget smartphones? We have reviewed the top options available on Eylace right now.', img: '📱' },
  { id: 2, title: 'Summer Fashion Trends You Cannot Miss', cat: 'Fashion', date: 'Mar 12, 2026', author: 'Tasnim Akter', excerpt: 'From bold prints to pastel palettes — discover what is trending this summer season.', img: '👗' },
  { id: 3, title: 'How to Save Big on Online Shopping', cat: 'Shopping Tips', date: 'Mar 10, 2026', author: 'Nusrat Jahan', excerpt: 'Smart strategies to make the most of flash sales, coupons, and cashback offers.', img: '🛒' },
  { id: 4, title: 'Best Kitchen Gadgets for Your Home', cat: 'Home', date: 'Mar 8, 2026', author: 'Ariful Islam', excerpt: 'Upgrade your kitchen with these must-have gadgets that make cooking easier and more fun.', img: '🍳' },
  { id: 5, title: 'Eylace Launches Same-Day Delivery in Dhaka', cat: 'News', date: 'Mar 5, 2026', author: 'Team Eylace', excerpt: 'We are excited to announce same-day delivery across Dhaka city for select products.', img: '🚀' },
  { id: 6, title: 'Guide to Choosing the Right Laptop', cat: 'Tech', date: 'Mar 1, 2026', author: 'Rafiq Ahmed', excerpt: 'Whether for work, study, or gaming — find the perfect laptop with our comprehensive guide.', img: '💻' },
];

const Blog = () => {
  const [active, setActive] = useState('All');
  const filtered = active === 'All' ? posts : posts.filter(p => p.cat === active);

  return (
    <Layout>
      <SeoHead
        title="Eylace Blog — Shopping Tips, Tech & Fashion News"
        description="Reviews, buying guides, fashion trends and the latest e-commerce news from the Eylace editorial team."
        path="/blog"
      />
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-main text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Eylace Blog</h1>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">Tips, trends, and news from the world of online shopping.</p>
        </div>
      </section>

      <section className="container-main py-8">
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map(c => (
            <Button key={c} size="sm" variant={active === c ? 'default' : 'outline'} onClick={() => setActive(c)}>{c}</Button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(post => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-muted flex items-center justify-center text-5xl">{post.img}</div>
              <CardContent className="pt-4">
                <Badge variant="secondary" className="mb-2">{post.cat}</Badge>
                <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{post.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                </div>
                <Button variant="link" className="px-0 mt-2 text-sm">Read More <ArrowRight className="h-3 w-3 ml-1" /></Button>
                {post.href && (
                  <Button asChild variant="link" className="px-0 mt-2 text-sm">
                    <Link to={post.href}>Read full guide <ArrowRight className="h-3 w-3 ml-1" /></Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
