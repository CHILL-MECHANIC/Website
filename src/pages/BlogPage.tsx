import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Clock3, BookOpenText, Sparkles, ArrowRight } from 'lucide-react';
import { ARTICLES, categoryColor } from '@/data/blogData';

export default function BlogPage() {
  const navigate = useNavigate();
  const { getCartItemsCount } = useCart();
  const featured = ARTICLES[0];
  const categories = ['AC Tips', 'Refrigerator', 'RO & Water', 'Washing Machine', 'Geyser', 'Microwave'];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Appliance Repair Tips & Guides | Chill Mechanic Blog</title>
        <meta
          name="description"
          content="Expert tips on AC, refrigerator, washing machine & appliance maintenance. Guides for Gurgaon homeowners from Chill Mechanic."
        />
        <link rel="canonical" href="https://www.chillmechanic.com/blog" />
      </Helmet>

      <Header cartItemsCount={getCartItemsCount()} />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16 relative overflow-hidden">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-secondary/20 blur-2xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-secondary/20 blur-2xl" />
        <div className="container mx-auto px-4 text-center">
          <p className="inline-flex items-center gap-2 bg-secondary text-secondaryforeground/10 px-4 py-1 rounded-full mb-4 text-sm">
            <Sparkles className="h-4 w-4 text-primary" /> Appliance Care Knowledge Hub
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Chill Mechanic Blog</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Expert tips on AC, refrigerator, washing machine & appliance maintenance for Gurgaon homeowners.
          </p>
        </div>
      </section>

      {/* Featured */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <button
            type="button"
            onClick={() => navigate(`/blog/${featured.id}`)}
            className="w-full max-w-6xl mx-auto bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border rounded-2xl p-6 md:p-8 text-left hover:shadow-lg transition-shadow"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Featured Guide</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{featured.title}</h2>
            <p className="text-muted-foreground mb-4 max-w-3xl">{featured.excerpt}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className={`px-2 py-1 rounded-full font-medium ${categoryColor[featured.category]}`}>{featured.category}</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock3 className="h-4 w-4" /> {featured.readTime}</span>
              <span className="inline-flex items-center gap-1 text-primary font-medium">
                Read article <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-6">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c} className={`text-xs md:text-sm px-3 py-1 rounded-full border ${categoryColor[c] || 'bg-muted text-muted-foreground'}`}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="pt-6 pb-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 max-w-6xl mx-auto">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {ARTICLES.map((article) => (
              <Card
                key={article.title}
                className="flex flex-col border hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate(`/blog/${article.id}`)}
              >
                <CardContent className="p-6 flex flex-col gap-3 flex-1">
                  <span
                    className={`self-start text-xs font-semibold px-2 py-1 rounded-full ${
                      categoryColor[article.category] || 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {article.category}
                  </span>
                  <h3 className="font-bold text-lg leading-snug">{article.title}</h3>
                  <p className="text-muted-foreground text-sm flex-1 line-clamp-4">{article.excerpt}</p>
                  <div className="flex items-center justify-between pt-3 border-t mt-auto">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpenText className="h-3.5 w-3.5" /> {article.readTime}
                    </span>
                    <span className="text-sm font-medium text-primary inline-flex items-center gap-1">
                      Read more <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary/10 py-12 border-y">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Need Expert Help?</h2>
          <p className="text-muted-foreground mb-6">
            Our certified technicians are just a call away for same-day appliance repair.
          </p>
          <a
            href="tel:9211970030"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <Phone className="h-5 w-5" /> Call 9211970030
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
