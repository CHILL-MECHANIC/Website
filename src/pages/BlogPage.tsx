import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Clock3, BookOpenText, Sparkles, ArrowRight } from 'lucide-react';

const ARTICLES = [
  {
    id: 1,
    title: 'AC Not Cooling? 10 Common Causes & Solutions',
    category: 'AC Tips',
    readTime: '6 min read',
    excerpt:
      "Is your AC running but not cooling? Here are 10 common causes and fixes every Gurgaon homeowner should know — from dirty filters and low refrigerant gas to faulty compressors and thermostat issues.",
    fullArticle:
      'Start with the basics: clean AC filters, check thermostat settings, and inspect airflow around indoor and outdoor units. If cooling is still weak, the issue can be low refrigerant, a blocked condenser coil, sensor failure, or compressor inefficiency. In Gurgaon heat, delayed servicing quickly worsens these issues and increases electricity bills. Book a diagnostic if your AC runs continuously without reaching set temperature.',
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
  },
  {
    id: 6,
    title: 'AC Service Cost in Gurgaon: 2026 Price Guide',
    category: 'AC Tips',
    readTime: '5 min read',
    excerpt:
      "Power jet cleaning starts at ₹599, foam jet at ₹799, and gas refilling at ₹2,499. Get a full breakdown of AC service costs in Gurgaon and tips to get the best value.",
    fullArticle:
      'Typical pricing in Gurgaon: power jet service from ₹599, foam service from ₹799, issue diagnostics from ₹249, and gas refill around ₹2,499 depending on tonnage and leakage condition. Always ask what is included: coil cleaning depth, drain line cleaning, electrical checks, and post-service cooling validation. Upfront estimates avoid hidden charges later.',
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

export default function BlogPage() {
  const { getCartItemsCount } = useCart();
  const featured = ARTICLES[0];
  const categories = ['AC Tips', 'Refrigerator', 'RO & Water', 'Washing Machine', 'Geyser', 'Microwave'];
  const [expandedFeatured, setExpandedFeatured] = useState(false);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Appliance Repair Tips & Guides | Chill Mechanic Blog</title>
        <meta
          name="description"
          content="Expert tips on AC, refrigerator, washing machine & appliance maintenance. Guides for Gurgaon homeowners from Chill Mechanic."
        />
        <link rel="canonical" href="https://chillmechanic.com/blog" />
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
          <div className="max-w-6xl mx-auto bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border rounded-2xl p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Featured Guide</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{featured.title}</h2>
            <p className="text-muted-foreground mb-4 max-w-3xl">{featured.excerpt}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className={`px-2 py-1 rounded-full font-medium ${categoryColor[featured.category]}`}>{featured.category}</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock3 className="h-4 w-4" /> {featured.readTime}</span>
              <button
                type="button"
                onClick={() => setExpandedFeatured((prev) => !prev)}
                className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
              >
                {expandedFeatured ? 'Collapse article' : 'Read article'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {expandedFeatured && (
              <div className="mt-4 pt-4 border-t border-primary/20">
                <p className="text-sm leading-relaxed text-muted-foreground">{featured.fullArticle}</p>
              </div>
            )}
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {ARTICLES.map((article) => (
              <Card key={article.title} className="flex flex-col border hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="p-6 flex flex-col gap-3 flex-1">
                  <span
                    className={`self-start text-xs font-semibold px-2 py-1 rounded-full ${
                      categoryColor[article.category] || 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {article.category}
                  </span>
                  <h2 className="font-bold text-lg leading-snug">{article.title}</h2>
                  <p className="text-muted-foreground text-sm flex-1 line-clamp-4">{article.excerpt}</p>
                  <div className="flex items-center justify-between pt-3 border-t mt-auto">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpenText className="h-3.5 w-3.5" /> {article.readTime}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(article.id)}
                      className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      {expandedIds.includes(article.id) ? 'Collapse' : 'Read more'} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {expandedIds.includes(article.id) && (
                    <div className="pt-3 border-t">
                      <p className="text-sm leading-relaxed text-muted-foreground">{article.fullArticle}</p>
                    </div>
                  )}
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
