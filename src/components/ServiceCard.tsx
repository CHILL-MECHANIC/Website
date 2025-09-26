import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface ServiceCardProps {
  title: string;
  description: string;
  image: string;
  price: string;
  onBookNow: () => void;
  onEnquire: () => void;
}

export default function ServiceCard({
  title,
  description,
  image,
  price,
  onBookNow,
  onEnquire,
}: ServiceCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <CardHeader>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Starting from</span>
          <span className="text-2xl font-bold text-primary">{price}</span>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-3">
        <Button onClick={onBookNow} className="flex-1">
          Book Now
        </Button>
        <Button onClick={onEnquire} variant="outline" className="flex-1">
          Enquire
        </Button>
      </CardFooter>
    </Card>
  );
}