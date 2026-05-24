import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock3, Sparkles, Share2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface Article {
  id: number;
  title: string;
  category: string;
  readTime: string;
  excerpt: string;
  fullArticle: string;
  seoDescription: string;
  keywords: string;
}

const ARTICLES: Article[] = [
  {
    id: 1,
    title: 'AC Not Cooling? 10 Common Causes & Solutions',
    category: 'AC Tips',
    readTime: '6 min read',
    excerpt:
      "Is your AC running but not cooling? Here are 10 common causes and fixes every Gurgaon homeowner should know — from dirty filters and low refrigerant gas to faulty compressors and thermostat issues.",
    fullArticle:
      'Start with the basics: clean AC filters, check thermostat settings, and inspect airflow around indoor and outdoor units. If cooling is still weak, the issue can be low refrigerant, a blocked condenser coil, sensor failure, or compressor inefficiency. In Gurgaon heat, delayed servicing quickly worsens these issues and increases electricity bills. Book a diagnostic if your AC runs continuously without reaching set temperature.',
    seoDescription: 'AC not cooling? Learn 10 common causes including dirty filters, low refrigerant, and compressor issues. Expert fixes for Gurgaon homeowners from Chill Mechanic.',
    keywords: 'AC not cooling, AC repair, air conditioner troubleshooting, Gurgaon',
  },
  {
    id: 2,
    title: 'How Often Should You Service Your AC in Gurgaon?',
    category: 'AC Tips',
    readTime: '5 min read',
    excerpt:
      "Gurgaon's extreme heat and dusty environment demand regular AC maintenance. Experts recommend servicing every 3–4 months. Learn why skipping service costs more in the long run.",
    fullArticle:
      'For Gurgaon households, servicing every 3–4 months is ideal. Peak summer usage causes faster dust buildup, drain blockages, and reduced cooling efficiency. A preventive schedule keeps your AC efficient, lowers power consumption, and reduces emergency repairs. Foam service every 6 months plus regular filter cleaning is a practical combination for most homes.',
    seoDescription: 'AC service schedule for Gurgaon: How often to service your air conditioner. Maintenance tips, seasonal schedule, and cost-saving strategies.',
    keywords: 'AC service frequency, air conditioner maintenance, Gurgaon AC service schedule',
  },
  {
    id: 3,
    title: 'Refrigerator Not Cooling: DIY Fixes vs Professional Help',
    category: 'Refrigerator',
    readTime: '7 min read',
    excerpt:
      "Some fridge problems are easy to fix yourself — like cleaning condenser coils. Others, such as compressor issues, require a trained technician. Here's how to tell the difference.",
    fullArticle:
      'DIY checks include thermostat setting, door seal condition, condenser coil dust, and ventilation space around the unit. If you hear repeated clicking, observe uneven cooling, or notice compressor overheating, professional diagnosis is needed. Compressor, relay, and refrigerant work should always be handled by certified technicians to avoid safety and warranty issues.',
    seoDescription: 'Refrigerator not cooling? Learn which repairs you can DIY and which need professional help. Complete troubleshooting guide from Chill Mechanic.',
    keywords: 'refrigerator not cooling, fridge repair, DIY refrigerator fixes, cooling issues',
  },
  {
    id: 4,
    title: 'RO Water Purifier Maintenance: Complete Guide',
    category: 'RO & Water',
    readTime: '8 min read',
    excerpt:
      "Your RO purifier needs regular filter changes to keep water safe. Sediment filter every 6 months, carbon filter every 6–8 months, and membrane every 12–18 months based on water quality.",
    fullArticle:
      'A good RO maintenance cycle: sediment filter every 6 months, carbon filter every 6–8 months, and membrane around 12–18 months based on TDS and usage. Also sanitize the tank and check for pressure drops and leaks during service. Poor taste, low flow, and bad odor are common signs that at least one filter stage is overdue for replacement.',
    seoDescription: 'RO water purifier maintenance guide: Filter replacement schedule, TDS levels, and when to service. Keep your water safe with proper maintenance.',
    keywords: 'RO maintenance, water purifier service, filter replacement, RO purifier care',
  },
  {
    id: 5,
    title: "Washing Machine Making Noise? Here's What to Do",
    category: 'Washing Machine',
    readTime: '6 min read',
    excerpt:
      "Loud banging, grinding, or squealing? These sounds often point to worn bearings, loose drums, foreign objects, or motor issues. Identify the noise type and know when to call a professional.",
    fullArticle:
      'Banging often indicates unbalanced load or suspension wear, grinding can mean bearing damage, and squealing usually points to belt or motor stress. First pause the cycle, rebalance clothes, and inspect for trapped objects. Persistent noise across cycles needs a technician inspection to prevent drum or motor damage and costly replacements.',
    seoDescription: 'Washing machine noise? Learn what different sounds mean and how to fix them. Expert diagnosis for banging, grinding, and squealing noises.',
    keywords: 'washing machine noise, loud washing machine, washing machine repair, noise diagnosis',
  },
  {
    id: 6,
    title: 'AC Service Cost in Gurgaon: 2026 Price Guide',
    category: 'AC Tips',
    readTime: '5 min read',
    excerpt:
      "Power jet cleaning starts at ₹499, foam jet at ₹599, and gas refilling at ₹1,999. Get a full breakdown of AC service costs in Gurgaon and tips to get the best value.",
    fullArticle:
      'Typical pricing in Gurgaon: power jet service from ₹499, foam service from ₹599, issue diagnostics from ₹249, and gas refill around ₹1,999 depending on tonnage and leakage condition. Always ask what is included: coil cleaning depth, drain line cleaning, electrical checks, and post-service cooling validation. Upfront estimates avoid hidden charges later.',
    seoDescription: 'AC service cost in Gurgaon 2026: Prices for cleaning, gas refill, repairs. Get transparent pricing and find the best value for your air conditioner.',
    keywords: 'AC service cost Gurgaon, air conditioner price, service charges, AC maintenance cost',
  },
  {
    id: 7,
    title: 'Signs Your Refrigerator Needs Immediate Repair',
    category: 'Refrigerator',
    readTime: '4 min read',
    excerpt:
      "Unusual warm spots, constant running, frost buildup inside, water pooling underneath — these warning signs mean your fridge needs professional attention before a full breakdown.",
    fullArticle:
      'Watch for frequent compressor cycling, melted freezer items, unusual rear-panel heat, and water leakage. These symptoms often indicate airflow issues, sensor faults, or sealed system problems. Early service prevents food spoilage and compressor failure. If your unit runs all day with weak cooling, schedule immediate inspection.',
    seoDescription: 'Refrigerator repair signs: When your fridge needs professional help. Warning symptoms that indicate urgent repair requirements.',
    keywords: 'refrigerator repair signs, fridge problems, cooling issues, emergency repair',
  },
  {
    id: 8,
    title: 'Geyser Not Heating? Common Problems & Solutions',
    category: 'Geyser',
    readTime: '4 min read',
    excerpt:
      "Faulty heating elements, thermostat failures, and sediment buildup are the most common geyser issues. Learn when a quick fix works and when you need a replacement.",
    fullArticle:
      'If your geyser is not heating, check power supply and MCB first. Common failures include burned heating element, thermostat malfunction, and tank sediment reducing heat transfer. Minor thermostat or connection issues can be repaired quickly, but old, corroded tanks often justify replacement. Regular descaling extends geyser life and heating performance.',
    seoDescription: 'Geyser not heating? Troubleshoot common problems like heating element failure and thermostat issues. Professional geyser repair solutions.',
    keywords: 'geyser repair, water heater not working, geyser troubleshooting, heating element',
  },
  {
    id: 9,
    title: 'How to Choose the Best AC Repair Service in Gurgaon',
    category: 'AC Tips',
    readTime: '6 min read',
    excerpt:
      "Look for certified technicians, transparent pricing, warranty on repairs, and genuine parts. Avoid services that give quotes without inspection or charge hidden fees.",
    fullArticle:
      'Choose services that offer technician verification, diagnostic-first pricing, proper invoices, and repair warranty. Ask whether genuine parts are used and if post-repair performance checks are included. Strong local support and quick callback times matter in summer. Online reviews are helpful, but transparent scope and warranty terms are the real trust indicators.',
    seoDescription: 'How to choose an AC repair service: Tips for finding certified technicians, transparent pricing, and warranty guarantees in Gurgaon.',
    keywords: 'AC repair service, technician selection, repair warranty, air conditioner service',
  },
  {
    id: 10,
    title: 'Microwave Repair vs Replacement: Making the Right Choice',
    category: 'Microwave',
    readTime: '5 min read',
    excerpt:
      "If your microwave is under 5 years old and the repair cost is below 40% of a new unit, repair is usually the smarter choice. Here's a complete decision framework.",
    fullArticle:
      'A practical rule: repair when the microwave is under 5 years old and repair cost is below 40% of replacement value. Replace when repeated faults occur, cavity rust is severe, or spare parts are obsolete. Safety checks are essential with high-voltage components like capacitor and magnetron, so always use qualified technicians for diagnosis.',
    seoDescription: 'Microwave repair vs replacement: Decision guide to save money. When to repair and when to replace your microwave.',
    keywords: 'microwave repair, microwave replacement, repair cost, microwave maintenance',
  },
];

const categoryColor: Record<string, string> = {
  'AC Tips': 'bg-primary/10 text-primary',
  Refrigerator: 'bg-green-100 text-green-700',
  'RO & Water': 'bg-sky-100 text-sky-700',
  'Washing Machine': 'bg-orange-100 text-orange-700',
  Geyser: 'bg-red-100 text-red-700',
  Microwave: 'bg-purple-100 text-purple-700',
};

export default function BlogArticle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCartItemsCount } = useCart();

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

  const canonicalUrl = `https://chillmechanic.com/blog/${id}`;

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
        <meta name="article:published_time" content={new Date().toISOString()} />
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
                <span>Updated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
                          onClick={() => {
                            const url = canonicalUrl;
                            const text = article.title;
                            if (navigator.share) {
                              navigator.share({ title: text, url });
                            } else {
                              navigator.clipboard.writeText(url);
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
            <Button size="lg">
              Schedule a Service
            </Button>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
