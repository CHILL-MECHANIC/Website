import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock3, Sparkles, Share2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Article, ARTICLES, categoryColor } from "@/data/blogData";

export default function BlogArticle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCartItemsCount } = useCart();
  const { toast } = useToast();

  const article = ARTICLES.find(a => a.id === parseInt(id || ''));

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemsCount={getCartItemsCount()} />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <Button onClick={() => navigate("/blog")} variant="outline">
            Back to Blog
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const canonicalUrl = `https://www.chillmechanic.com/blog/${id}`;

  return (
    <>
      <Helmet>
        <title>{article.title} | Chill Mechanic Blog</title>
        <meta name="description" content={article.seoDescription} />
        <meta name="keywords" content={article.keywords} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${article.title} | Chill Mechanic Blog`} />
        <meta property="og:description" content={article.seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta name="article:published_time" content={new Date(article.publishedDate).toISOString()} />
        <meta name="article:author" content="Chill Mechanic" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header cartItemsCount={getCartItemsCount()} />

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 py-12 border-b">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/blog")}
              className="mb-6 -ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>

            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full font-medium text-sm ${categoryColor[article.category] || 'bg-muted text-muted-foreground'}`}>
                  {article.category}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">{article.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-4 w-4" />
                  {article.readTime}
                </span>
                {article.updatedDate && (
                  <span>Updated {new Date(article.updatedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Card className="shadow-lg">
                <CardContent className="p-8">
                  <div className="prose prose-lg max-w-none">
                    <p className="text-lg leading-relaxed text-muted-foreground mb-6 pb-6 border-b">
                      {article.excerpt}
                    </p>

                    <div className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {article.fullArticle}
                    </div>
                  </div>

                  {/* Share Section */}
                  <div className="mt-8 pt-8 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Share this article:</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const url = canonicalUrl;
                            const text = article.title;
                            if (navigator.share) {
                              try {
                                await navigator.share({ title: text, url });
                                toast({
                                  title: "Shared successfully",
                                  description: "Article shared!"
                                });
                              } catch (error) {
                                if ((error as Error).name !== 'AbortError') {
                                  console.error('Share failed:', error);
                                  toast({
                                    title: "Share failed",
                                    description: "Could not share article. Trying clipboard...",
                                    variant: "destructive"
                                  });
                                }
                              }
                            } else {
                              try {
                                await navigator.clipboard.writeText(url);
                                toast({
                                  title: "Copied to clipboard",
                                  description: "Article URL copied!"
                                });
                              } catch (error) {
                                console.error('Clipboard failed:', error);
                                toast({
                                  title: "Copy failed",
                                  description: "Could not copy URL. Please try again.",
                                  variant: "destructive"
                                });
                              }
                            }
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Articles */}
              <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6">More from {article.category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ARTICLES.filter(a => a.category === article.category && a.id !== article.id).slice(0, 2).map(relatedArticle => (
                    <Card
                      key={relatedArticle.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/blog/${relatedArticle.id}`)}
                    >
                      <CardContent className="p-6">
                        <h4 className="font-semibold mb-2 line-clamp-2">{relatedArticle.title}</h4>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{relatedArticle.excerpt}</p>
                        <span className="text-xs text-muted-foreground">{relatedArticle.readTime}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-secondary/10 py-12 border-y">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Our certified technicians are ready to help with professional service and expert advice.
            </p>
            <Button size="lg" onClick={() => navigate('/services')}>
              Schedule a Service
            </Button>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
