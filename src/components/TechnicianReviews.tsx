import { Star } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface TechnicianReview {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  rating: number;
  review: string;
  date: string;
}

const DEFAULT_TECHNICIANS: TechnicianReview[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    role: 'Senior Technician - AC Service',
    rating: 5,
    review: 'I have been servicing AC units for 12 years. Our foam power jet cleaning removes 99% of dirt and bacteria. Always prioritize guest comfort.',
    date: '2 weeks ago',
  },
  {
    id: '2',
    name: 'Amit Patel',
    role: 'Lead Technician - Refrigerator',
    rating: 5,
    review: 'With expertise in all major brands, I ensure your refrigerator runs efficiently. Proper maintenance extends your appliance life by 5+ years.',
    date: '3 weeks ago',
  },
  {
    id: '3',
    name: 'Vikram Singh',
    role: 'Certified Technician - Water Purifier',
    rating: 4,
    review: 'Clean water is essential for health. I use certified testing methods to ensure your RO/water purifier provides safe drinking water for your family.',
    date: '1 week ago',
  },
  {
    id: '4',
    name: 'Suresh Nair',
    role: 'Expert Technician - Washing Machine',
    rating: 5,
    review: 'Every washing machine is unique. I provide personalized service ensuring optimal performance and extending machine lifespan significantly.',
    date: '4 days ago',
  },
  {
    id: '5',
    name: 'Deepak Yadav',
    role: 'Master Technician - Geyser',
    rating: 5,
    review: 'Hot water safety is crucial. I perform comprehensive checks for heating elements, thermostats, and safety valves in every service.',
    date: '5 days ago',
  },
  {
    id: '6',
    name: 'Pradeep Kumar',
    role: 'Professional Technician - Microwave',
    rating: 5,
    review: 'Microwave maintenance is often overlooked. Regular service prevents breakdowns and ensures food is heated safely and evenly.',
    date: '1 day ago',
  },
];

interface TechnicianReviewsProps {
  reviews?: TechnicianReview[];
  serviceType?: string;
}

export default function TechnicianReviews({ reviews = DEFAULT_TECHNICIANS, serviceType }: TechnicianReviewsProps) {
  return (
    <section className="py-12 bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Meet Our Technicians</h2>
          <p className="text-muted-foreground">Certified professionals with years of expertise</p>
        </div>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {reviews.map((technician) => (
              <CarouselItem key={technician.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Star Rating */}
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < technician.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>

                    {/* Review Text */}
                    <p className="text-sm text-muted-foreground mb-6 flex-grow italic">
                      "{technician.review}"
                    </p>

                    {/* Technician Info */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={technician.avatar} alt={technician.name} />
                        <AvatarFallback className="bg-primary text-white">
                          {technician.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{technician.name}</h3>
                        <p className="text-xs text-muted-foreground">{technician.role}</p>
                        <p className="text-xs text-gray-400 mt-1">{technician.date}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 md:-translate-x-16" />
          <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 md:translate-x-16" />
        </Carousel>
      </div>
    </section>
  );
}
