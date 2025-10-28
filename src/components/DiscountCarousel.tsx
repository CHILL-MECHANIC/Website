import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
  } from "@/components/ui/carousel";
  import { Card, CardContent } from "@/components/ui/card";
  import { Tag } from "lucide-react";
  
  interface Discount {
    code: string;
    description: string;
    value: string;
  }
  
  const discounts: Discount[] = [
    {
      code: "AC10",
      description: "10% off on all AC services",
      value: "10% OFF"
    },
    {
      code: "PREMIUM10",
      description: "10% off on services above ₹1000",
      value: "10% OFF"
    },
    {
      code: "FIRST50",
      description: "₹50 off on your first service",
      value: "₹50 OFF"
    }
  ];
  
  export default function DiscountCarousel() {
    return (
      <div className="w-full mb-6">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {discounts.map((discount, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Tag className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-primary text-sm">{discount.code}</div>
                        <div className="text-xs text-muted-foreground">{discount.description}</div>
                      </div>
                      <div className="font-bold text-primary text-lg">{discount.value}</div>
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
    );
  }
  