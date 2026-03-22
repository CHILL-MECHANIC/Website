import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Play, Users, MessageSquare, MapPin, Star, Briefcase, BadgeCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/* ------------------------------------------------------------------ */
/*  Section 1 — Our Work (video placeholders)                         */
/* ------------------------------------------------------------------ */
const supabaseUrl = (filename: string, bucket: string) =>
  supabase.storage.from(bucket).getPublicUrl(filename).data.publicUrl;

const VIDEOS = [
  { id: 1, title: 'AC Deep Cleaning Service',      videoUrl: supabaseUrl('MainVD1.mp4', 'gallery-videos'), serviceType: 'AC' },
  { id: 2, title: 'Appliance Repair in Action',    videoUrl: supabaseUrl('MainVD2.mp4', 'gallery-videos'), serviceType: 'AC' },
  { id: 3, title: 'Refrigerator Repair',           videoUrl: supabaseUrl('Video2.mp4',  'gallery-videos'), serviceType: 'Refrigerator' },
  { id: 4, title: 'Washing Machine Service',       videoUrl: supabaseUrl('Video3.mp4',  'gallery-videos'), serviceType: 'Washing Machine' },
  { id: 5, title: 'Geyser & Appliance Repair',     videoUrl: supabaseUrl('Video4.mp4',  'gallery-videos'), serviceType: 'Geyser' },
];

/* ------------------------------------------------------------------ */
/*  Section 2 — Technicians                                           */
/* ------------------------------------------------------------------ */
const TECHNICIANS = [
  { id: 1, name: 'Rajesh Kumar', specialization: 'AC & Refrigeration Expert', experience: '8+ Years', rating: 4.9 },
  { id: 2, name: 'Sunil Yadav', specialization: 'Washing Machine Specialist', experience: '6+ Years', rating: 4.8 },
  { id: 3, name: 'Manoj Singh', specialization: 'RO & Water Purifier Expert', experience: '5+ Years', rating: 4.9 },
  { id: 4, name: 'Amit Sharma', specialization: 'Geyser & Microwave Pro', experience: '7+ Years', rating: 4.7 },
];

/* ------------------------------------------------------------------ */
/*  Section 3 — Reviews                                               */
/* ------------------------------------------------------------------ */
const REVIEWS = [
  { id: 1, name: 'Priya S.', area: 'DLF Phase 2', service: 'AC Service', rating: 5, review: 'Excellent service! The technician fixed my AC in under an hour.', date: 'March 2026' },
  { id: 2, name: 'Rahul M.', area: 'Golf Course Road', service: 'Refrigerator', rating: 5, review: 'Quick diagnosis and honest pricing. Highly recommend!', date: 'Feb 2026' },
  { id: 3, name: 'Sneha K.', area: 'Sector 65', service: 'RO Service', rating: 5, review: 'Filter replaced and TDS perfect now. Great job!', date: 'March 2026' },
  { id: 4, name: 'Vikram T.', area: 'Sohna Road', service: 'AC Service', rating: 5, review: 'Foam jet cleaning made my AC cool like new again.', date: 'Feb 2026' },
  { id: 5, name: 'Anita G.', area: 'Palam Vihar', service: 'Washing Machine', rating: 5, review: 'The drum cleaning service was thorough and affordable.', date: 'Jan 2026' },
  { id: 6, name: 'Deepak R.', area: 'Cyber City', service: 'Geyser', rating: 5, review: 'Heating element replaced quickly. Water is hot again!', date: 'March 2026' },
  { id: 7, name: 'Meera P.', area: 'South City', service: 'AC Service', rating: 5, review: 'Same-day service and genuinely helpful technician.', date: 'Feb 2026' },
  { id: 8, name: 'Arjun D.', area: 'DLF Phase 4', service: 'Microwave', rating: 5, review: 'Fixed my microwave sparking issue. Professional work.', date: 'Jan 2026' },
  { id: 9, name: 'Kavita N.', area: 'Manesar', service: 'Refrigerator', rating: 5, review: 'Compressor repair done perfectly. No issues since.', date: 'March 2026' },
  { id: 10, name: 'Rohit J.', area: 'Udyog Vihar', service: 'RO Service', rating: 5, review: 'Complete RO service done professionally. Tastes great now.', date: 'Feb 2026' },
  { id: 11, name: 'Pooja L.', area: 'Huda City Centre', service: 'AC Service', rating: 5, review: 'Best AC service I have ever used in Gurgaon.', date: 'Jan 2026' },
  { id: 12, name: 'Sanjay V.', area: 'Sector 62', service: 'Washing Machine', rating: 5, review: 'Motor noise fixed perfectly. Runs quiet now!', date: 'March 2026' },
  { id: 13, name: 'Nidhi B.', area: 'Golf Course Ext', service: 'Geyser', rating: 5, review: 'New geyser installed with clean piping. Great work.', date: 'Feb 2026' },
  { id: 14, name: 'Karan W.', area: 'DLF Phase 1', service: 'AC Service', rating: 5, review: 'Gas refilling done with proper pressure testing.', date: 'Jan 2026' },
  { id: 15, name: 'Divya C.', area: 'Sector 63', service: 'RO Service', rating: 4, review: 'Good service overall. Filter change was quick.', date: 'March 2026' },
  { id: 16, name: 'Mohan S.', area: 'Sector 67', service: 'Refrigerator', rating: 5, review: 'Door seal replaced, fridge cooling perfectly now.', date: 'Feb 2026' },
  { id: 17, name: 'Ritu A.', area: 'DLF Phase 3', service: 'Microwave', rating: 5, review: 'Magnetron replaced. Heats evenly again. Thank you!', date: 'Jan 2026' },
  { id: 18, name: 'Anil P.', area: 'Sector 64', service: 'AC Service', rating: 5, review: 'Very professional. On time and cleaned up after work.', date: 'March 2026' },
];

const serviceColor: Record<string, string> = {
  'AC Service': 'bg-primary/10 text-primary',
  Refrigerator: 'bg-green-100 text-green-700',
  'RO Service': 'bg-sky-100 text-sky-700',
  'Washing Machine': 'bg-orange-100 text-orange-700',
  Geyser: 'bg-red-100 text-red-700',
  Microwave: 'bg-purple-100 text-purple-700',
};

/* ------------------------------------------------------------------ */
/*  Section 4 — Areas                                                 */
/* ------------------------------------------------------------------ */
const AREAS = [
  'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'DLF Phase 4', 'DLF Phase 5',
  'Golf Course Road', 'Golf Course Extension', 'Sohna Road',
  'Sector 62', 'Sector 63', 'Sector 64', 'Sector 65', 'Sector 66', 'Sector 67',
  'Manesar', 'Palam Vihar', 'South City', 'Udyog Vihar', 'Cyber City', 'Huda City Centre',
];

/* ================================================================== */

export default function GalleryPage() {
  const { getCartItemsCount } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Gallery | Before & After Results | Chill Mechanic Gurgaon</title>
        <meta
          name="description"
          content="See real results from Chill Mechanic's appliance repair work. Video gallery, technician profiles, and customer reviews. Gurgaon's trusted repair service."
        />
        <link rel="canonical" href="https://chillmechanic.com/gallery" />
      </Helmet>

      <Header cartItemsCount={getCartItemsCount()} />

      {/* ── Section 1: Our Work ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Play className="h-6 w-6 text-secondary" />
            <h2 className="text-3xl md:text-4xl font-bold">Our Work</h2>
          </div>
          <p className="text-center text-muted-foreground mb-10">Real repairs, real results</p>

          <Carousel opts={{ align: 'start', loop: true }} className="w-full max-w-6xl mx-auto">
            <CarouselContent>
              {VIDEOS.map((v) => (
                <CarouselItem key={v.id} className="basis-[82%] sm:basis-1/2 lg:basis-1/3">
                  <div className="rounded-2xl overflow-hidden border bg-black aspect-[9/16]">
                    <video
                      src={v.videoUrl}
                      preload="none"
                      playsInline
                      controls
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </section>

      {/* ── Section 2: Meet Our Technicians ── */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-6 w-6 text-secondary" />
            <h2 className="text-3xl md:text-4xl font-bold">Meet Our Technicians</h2>
          </div>
          <p className="text-center text-muted-foreground mb-10">Skilled professionals you can trust</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TECHNICIANS.map((t) => (
              <Card key={t.id} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center gap-3">
                  {/* Avatar placeholder */}
                  <div className="w-24 h-24 rounded-full bg-primary ring-2 ring-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <h3 className="font-semibold text-lg">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">{t.specialization}</p>
                  <div className="flex flex-col gap-1 text-sm mt-2">
                    <span className="flex items-center justify-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> {t.experience}
                    </span>
                    <span className="flex items-center justify-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> {t.rating} / 5
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 mt-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="h-3 w-3" /> Certified
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Customer Reviews ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageSquare className="h-6 w-6 text-secondary" />
            <h2 className="text-3xl md:text-4xl font-bold">What Our Customers Say</h2>
          </div>
          <p className="text-center text-muted-foreground mb-1">10,000+ happy customers across Gurgaon</p>
          <p className="text-center text-sm mb-10">
            <Star className="inline h-4 w-4 fill-yellow-400 text-yellow-400 -mt-0.5" /> 4.8/5 on Google
          </p>

          <Carousel opts={{ align: 'start', loop: true }} className="w-full max-w-6xl mx-auto">
            <CarouselContent>
              {REVIEWS.map((r) => (
                <CarouselItem key={r.id} className="basis-[88%] sm:basis-1/2 lg:basis-1/3">
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <CardContent className="p-5 flex flex-col gap-3 h-full">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground italic line-clamp-4">"{r.review}"</p>
                      <div className="flex items-center gap-2 pt-2 border-t mt-auto">
                        <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {r.name.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.area}</p>
                        </div>
                        <span
                          className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                            serviceColor[r.service] || 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {r.service}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </section>

      {/* ── Section 4: Areas We Serve ── */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <MapPin className="h-10 w-10 text-primary mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-3">We Serve All of Gurgaon</h2>
              <p className="text-muted-foreground mb-6">Covering 20+ areas with same-day service</p>
              <a
                href="tel:9211970030"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Book a Service →
              </a>
            </div>
            <div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {AREAS.map((area) => (
                  <span
                    key={area}
                    className="px-3 py-1 rounded-full bg-white border border-primary/30 text-primary text-sm font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center md:text-left">
                Don't see your area?{' '}
                <a href="tel:9211970030" className="text-primary font-medium underline">
                  Call us
                </a>{' '}
                — we likely cover it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
