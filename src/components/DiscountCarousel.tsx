import { Card, CardContent } from "@/components/ui/card";
import { Tag } from "lucide-react";

export default function DiscountCarousel() {
  const discounts = [
    {
      code: "AC15",
      title: "15% Off On AC Services",
      description: "Use code AC15 to get 15% off on AC services",
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Available Discounts</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {discounts.map((discount) => (
          <Card key={discount.code} className="min-w-[200px] flex-shrink-0">
            <CardContent className="p-4">
              <div className="font-bold text-primary text-lg">{discount.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{discount.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

