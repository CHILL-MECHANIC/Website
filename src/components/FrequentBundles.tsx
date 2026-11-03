import { Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// id, name and price must match ServiceDetail.tsx; `was` is the struck-off display price only.
const OFFERS = [
  { id: 'ac-power-jet-1', name: 'AC Jet Service', description: 'Power jet cleaning for single AC unit.', price: 499, was: 599 },
  { id: 'wm-top-load-service', name: 'Washing Machine Normal Service', description: 'Complete service and maintenance for top load washing machines with comprehensive cleaning.', price: 499, was: 599 },
  { id: 'wm-top-load-jet', name: 'Washing Machine Jet Service', description: 'Premium jet cleaning service for top load washing machines with deep maintenance.', price: 999, was: 1099 },
];

export default function FrequentBundles() {
  const { cartItems, addToCart } = useCart();
  const inCart = new Set(cartItems.map(i => i.id));
  const offers = OFFERS.filter(o => !inCart.has(o.id));
  if (offers.length === 0) return null;

  return (
    <section aria-labelledby="bundles-heading" className="pt-4">
      <h2 id="bundles-heading" className="mb-3 text-xl font-semibold">Frequently added</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {offers.map(o => (
          <Card key={o.id} className="festive-card h-full">
            <CardContent className="flex h-full flex-col gap-3 p-4">
              <h3 className="font-semibold leading-snug">{o.name}</h3>
              <div className="mt-auto">
                <div className="mb-3 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary tabular-nums">{rupees(o.price)}</span>
                  <span className="text-sm text-muted-foreground line-through tabular-nums">{rupees(o.was)}</span>
                  <span className="text-sm text-green-700">Save {rupees(o.was - o.price)}</span>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    addToCart([{ id: o.id, name: o.name, price: o.price, description: [o.description] }]);
                    toast({ title: 'Added', description: o.name });
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
