import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ARTICLES = [
  {
    title: 'AC Not Cooling? 10 Common Causes & Solutions',
    category: 'AC Tips',
    excerpt: "Is your AC running but not cooling? Here are 10 common causes and fixes every Gurgaon homeowner should know.",
  },
  {
    title: 'How Often Should You Service Your AC in Gurgaon?',
    category: 'AC Tips',
    excerpt: "Gurgaon's extreme heat demands regular AC maintenance. Learn the ideal service schedule.",
  },
  {
    title: 'Refrigerator Not Cooling: DIY Fixes vs Professional Help',
    category: 'Refrigerator',
    excerpt: "Know when to try a quick fix at home and when to call a professional for fridge repair.",
  },
];

const categoryColor: Record<string, string> = {
  'AC Tips': 'bg-primary/10 text-primary',
  Refrigerator: 'bg-green-100 text-green-700',
};

export default function BlogPreview() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">OUR BLOGS</h2>
          <p className="text-muted-foreground">Expert tips on appliance maintenance for Gurgaon homeowners</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ARTICLES.map((article) => (
            <Card key={article.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col gap-3">
                <span
                  className={`self-start text-xs font-semibold px-2 py-1 rounded-full ${
                    categoryColor[article.category] || 'bg-muted text-muted-foreground'
                  }`}
                >
                  {article.category}
                </span>
                <h3 className="font-bold text-lg line-clamp-2">{article.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3">{article.excerpt}</p>
                <Link to="/blog" className="text-primary text-sm font-medium inline-flex items-center gap-1 mt-auto">
                  Read More <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <Link to="/blog">
              View All Posts <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
