import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { BUNDLES, BUNDLE_ITEMS, bundleOriginalTotal, bundleSaving } from '@/data/bundles';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { toast } from '@/hooks/use-toast';

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// Dev only: every bundle id must be a real service with the same name and price as ServiceDetail.tsx.
// Loaded lazily to avoid an import cycle, and removed from the production build.
async function checkBundlesAgainstCatalog() {
  const { serviceDetails } = await import('@/pages/ServiceDetail');
  const catalog = new Map<string, { name: string; price: number }>();
  Object.values(serviceDetails).forEach(c => c.services.forEach(s => catalog.set(s.id, s)));
  const problems: string[] = [];
  BUNDLES.forEach(b => b.itemIds.forEach(id => {
    if (!BUNDLE_ITEMS[id]) problems.push(`Bundle "${b.id}" uses "${id}", which is not in BUNDLE_ITEMS.`);
  }));
  Object.entries(BUNDLE_ITEMS).forEach(([id, item]) => {
    const real = catalog.get(id);
    if (!real) problems.push(`"${id}" does not exist in ServiceDetail.tsx.`);
    else if (real.price !== item.price || real.name !== item.name) {
      problems.push(`"${id}" differs from ServiceDetail.tsx (bundles: ${item.name} ₹${item.price}, catalog: ${real.name} ₹${real.price}).`);
    }
  });
  if (problems.length) {
    console.error('[bundles] Catalog mismatch:\n' + problems.join('\n'));
    throw new Error('Bundle definitions are out of sync with the service catalog. See the console.');
  }
}

export default function FrequentBundles() {
  const { cartItems, addBundle, getBundleSavings } = useCart();

  useEffect(() => {
    if (import.meta.env.DEV) checkBundlesAgainstCatalog();
  }, []);

  const inCart = new Set(cartItems.map(i => i.id));
  // An item that is already part of a complete bundle can't be claimed by a second one.
  const taken = new Set(getBundleSavings().flatMap(s => BUNDLES.find(b => b.id === s.bundleId)?.itemIds ?? []));
  const offers = BUNDLES.filter(b => !b.itemIds.every(id => inCart.has(id)) && !b.itemIds.some(id => taken.has(id)));
  if (offers.length === 0) return null;

  return (
    <section aria-labelledby="bundles-heading" className="pt-4">
      <h2 id="bundles-heading" className="mb-3 text-xl font-semibold">Frequently added together</h2>
      <Carousel opts={{ align: 'start' }} className="w-full">
        <CarouselContent className="-ml-3">
          {offers.map(b => {
            const original = bundleOriginalTotal(b);
            const saving = bundleSaving(b);
            return (
              <CarouselItem key={b.id} className="basis-[85%] pl-3 sm:basis-1/2">
                <Card className="festive-card h-full">
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-snug">{b.title}</h3>
                      {(b.badge || saving > 0) && (
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {b.badge ?? `Save ${rupees(saving)}`}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {b.itemIds.map(id => (
                        <li key={id} className="flex justify-between gap-2">
                          <span>{BUNDLE_ITEMS[id].label}</span>
                          <span className="tabular-nums">{rupees(BUNDLE_ITEMS[id].price)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary tabular-nums">{rupees(original - saving)}</span>
                        <span className="text-sm text-muted-foreground line-through tabular-nums">{rupees(original)}</span>
                      </div>
                      <p className="mb-3 text-sm text-green-700">You save {rupees(saving)}</p>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => {
                          addBundle(b.id);
                          toast({ title: 'Bundle added', description: `${b.title}. You save ${rupees(saving)}.` });
                        }}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add bundle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="-left-3 hidden sm:flex" />
        <CarouselNext className="-right-3 hidden sm:flex" />
      </Carousel>
    </section>
  );
}
