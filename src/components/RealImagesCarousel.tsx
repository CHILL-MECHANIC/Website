import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface RealImagesCarouselProps {
  images: string[];
  serviceName?: string;
}

export default function RealImagesCarousel({ images, serviceName = 'Service' }: RealImagesCarouselProps) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {images.map((image, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3">
              <div className="h-64 md:h-80 overflow-hidden rounded-lg shadow-md">
                <img
                  src={image}
                  alt={`${serviceName} - Image ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 md:-translate-x-16" />
            <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 md:translate-x-16" />
          </>
        )}
      </Carousel>
    </div>
  );
}
