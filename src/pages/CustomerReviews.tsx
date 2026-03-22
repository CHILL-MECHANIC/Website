import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CUSTOMER_DATA = [
  { file: 'Customer1.jpeg',  name: 'Priya S.',    area: 'DLF Phase 2',       rating: 5, review: 'Excellent service! Fixed my AC in under an hour. Highly professional.' },
  { file: 'Customer2.jpeg',  name: 'Rahul M.',    area: 'Golf Course Road',  rating: 5, review: 'Quick diagnosis and honest pricing. Will definitely book again.' },
  { file: 'Customer3.jpeg',  name: 'Sneha K.',    area: 'Sector 65',         rating: 5, review: 'RO filter replaced and TDS is perfect now. Great job!' },
  { file: 'Customer4.jpeg',  name: 'Vikram T.',   area: 'Sohna Road',        rating: 5, review: 'Foam jet cleaning made my AC cool like brand new again.' },
  { file: 'Customer5.jpeg',  name: 'Anita G.',    area: 'Palam Vihar',       rating: 5, review: 'Drum cleaning service was very thorough and affordable.' },
  { file: 'Customer6.jpeg',  name: 'Deepak R.',   area: 'Cyber City',        rating: 5, review: 'Heating element replaced quickly. Hot water is back!' },
  { file: 'Customer7.jpeg',  name: 'Meera P.',    area: 'South City',        rating: 5, review: 'Same-day service is a lifesaver. Genuinely helpful team.' },
  { file: 'Customer8.jpeg',  name: 'Arjun D.',    area: 'DLF Phase 4',       rating: 5, review: 'Fixed my microwave sparking issue. Very professional work.' },
  { file: 'Customer9.jpeg',  name: 'Kavita N.',   area: 'Manesar',           rating: 5, review: 'Compressor repair done perfectly. No issues at all since.' },
  { file: 'Customer10.jpeg', name: 'Rohit J.',    area: 'Udyog Vihar',       rating: 5, review: 'Complete RO service done professionally. Water tastes great.' },
  { file: 'Customer11.jpeg', name: 'Pooja L.',    area: 'Huda City Centre',  rating: 5, review: 'Best appliance repair service I have used in Gurgaon.' },
  { file: 'Customer12.jpeg', name: 'Sanjay V.',   area: 'Sector 62',         rating: 5, review: 'Motor noise fixed perfectly. Washing machine runs so quiet now.' },
  { file: 'Customer13.jpeg', name: 'Nidhi B.',    area: 'Golf Course Ext.',  rating: 5, review: 'Geyser installed neatly with clean piping. Excellent work.' },
  { file: 'Customer14.jpeg', name: 'Karan W.',    area: 'DLF Phase 1',       rating: 5, review: 'Gas refilling done with proper pressure testing. No issues.' },
  { file: 'Customer15.jpeg', name: 'Divya C.',    area: 'Sector 63',         rating: 4, review: 'Good overall service. Filter change was quick and clean.' },
];

export default function CustomerReviews() {
  const customers = CUSTOMER_DATA.map(c => ({
    ...c,
    photoUrl: supabase.storage.from('gallery-images').getPublicUrl(c.file).data.publicUrl,
  }));

  return (
    <section className="py-16 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4">

        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Hear from Our Customers</h2>
          <p className="text-muted-foreground">Real experiences from real customers across Gurgaon</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-sm font-medium ml-1">4.8/5 on Google</span>
          </div>
        </div>

        {/* Carousel — 1.1 cards mobile, 2 tablet, 3 desktop */}
        <Carousel opts={{ align: 'start', loop: true }} className="w-full">
          <CarouselContent>
            {customers.map((c, i) => (
              <CarouselItem key={i} className="basis-[88%] sm:basis-1/2 lg:basis-1/3">
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-5 flex flex-col items-center gap-4">

                    {/* Customer Photo */}
                    <div className="relative">
                      <img
                        src={c.photoUrl}
                        alt={c.name}
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-primary"
                        onError={(e) => {
                          // fallback to initial avatar if image fails
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const next = target.nextElementSibling as HTMLElement;
                          if (next) next.style.display = 'flex';
                        }}
                      />
                      {/* Fallback avatar — hidden by default */}
                      <div
                        className="w-20 h-20 rounded-full bg-primary text-primary-foreground text-2xl font-bold items-center justify-center ring-2 ring-primary hidden"
                      >
                        {c.name.charAt(0)}
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: c.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    {/* Review */}
                    <div className="relative text-center">
                      <Quote className="h-4 w-4 text-primary/30 absolute -top-1 -left-1" />
                      <p className="text-sm text-muted-foreground italic line-clamp-3 px-3">
                        {c.review}
                      </p>
                    </div>

                    {/* Name + Area */}
                    <div className="text-center border-t w-full pt-3 mt-auto">
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.area}</p>
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
  );
}
