import { useState } from 'react';
import { Check, Tag, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { COUPONS } from '@/data/coupons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CouponBox() {
  const { couponCode, applyCoupon, removeCoupon, getCouponDiscount } = useCart();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  if (couponCode) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-green-300 bg-green-50 p-3 text-sm">
        <span className="flex min-w-0 items-center gap-2 text-green-800">
          <Check className="h-4 w-4 shrink-0" />
          <span className="truncate"><strong>{couponCode}</strong> applied. You save ₹{getCouponDiscount()}.</span>
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={removeCoupon} aria-label="Remove coupon" className="h-8 shrink-0 px-2">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const submit = (code: string) => {
    if (applyCoupon(code)) { setValue(''); setError(''); }
    else setError('That code is not valid. Check it and try again.');
  };

  return (
    <div className="space-y-2">
      <form
        className="flex gap-2"
        onSubmit={(e) => { e.preventDefault(); submit(value); }}
      >
        <div className="relative min-w-0 flex-1">
          <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            placeholder="Coupon code"
            aria-label="Coupon code"
            aria-invalid={!!error}
            autoCapitalize="characters"
            autoComplete="off"
            className="pl-9 uppercase placeholder:normal-case"
          />
        </div>
        <Button type="submit" variant="outline" disabled={!value.trim()}>Apply</Button>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {Object.entries(COUPONS).map(([code, c]) => (
          <button
            key={code}
            type="button"
            onClick={() => submit(code)}
            className="rounded-full border border-dashed border-primary/50 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/5"
          >
            {code} · {c.percent}% off
          </button>
        ))}
      </div>
    </div>
  );
}
