import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Save, Trash2 } from 'lucide-react';

// Reads use the same untyped client as the other admin pages. The write goes through the secured endpoint.
const db = supabase as unknown as SupabaseClient;

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'
];
const STATUSES = ['pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'] as const;
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
const CUSTOM_ITEM = '__custom__';
const NO_TECHNICIAN = 'none';

const schema = z.object({
  booking_date: z.string().min(1, 'Pick a booking date'),
  booking_time: z.string().min(1, 'Pick a time slot'),
  status: z.enum(STATUSES),
  payment_status: z.enum(PAYMENT_STATUSES),
  technician_id: z.string(),
  address: z.string().trim().min(1, 'Address is required'),
  city: z.string().trim(),
  pincode: z.string().trim().max(10),
  landmark: z.string().trim(),
  special_instructions: z.string().trim(),
  travel_charges: z.number({ invalid_type_error: 'Enter travel charges' }).min(0, 'Travel charges cannot be negative'),
  items: z.array(z.object({
    id: z.string().optional(),
    service_name: z.string().trim().min(1, 'Every item needs a name'),
    quantity: z.number({ invalid_type_error: 'Enter a quantity' }).int('Quantity must be a whole number').min(1, 'Quantity must be at least 1'),
    price: z.number({ invalid_type_error: 'Enter a price' }).min(0, 'Price cannot be negative'),
  })).min(1, 'A booking needs at least one service item'),
  confirmPaidChange: z.boolean(),
  notifyCustomer: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

interface Option { id: string; name: string; price?: number; service_type?: string }
interface EditBookingDialogProps {
  bookingId: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const money = (n: number) => `₹${Number.isFinite(n) ? n.toLocaleString('en-IN') : '-'}`;
const pretty = (s: string) => s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase());
const withCurrent = (list: readonly string[], current?: string) =>
  current && !list.includes(current) ? [current, ...list] : [...list];

// First validation message anywhere in react-hook-form's nested error object.
const firstMessage = (e: unknown): string => {
  if (!e || typeof e !== 'object') return '';
  if ('message' in e && typeof (e as any).message === 'string') return (e as any).message;
  for (const child of Object.values(e)) { const m = firstMessage(child); if (m) return m; }
  return '';
};

export function EditBookingDialog({ bookingId, onOpenChange, onSaved }: EditBookingDialogProps) {
  const { toast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [technicians, setTechnicians] = useState<Option[]>([]);
  const [services, setServices] = useState<Option[]>([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [meta, setMeta] = useState({ tax: 0, paid: false, adminCreated: false, cancelled: false });
  const [initial, setInitial] = useState<FormValues | null>(null);
  const [serverNote, setServerNote] = useState('');

  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { register, control, watch, setValue, handleSubmit, reset, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  // Fresh copy every time the dialog opens, so edits never start from a stale table row.
  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    setLoaded(false);
    setLoadError('');
    setServerNote('');

    (async () => {
      const [bookingRes, itemsRes, techRes, servicesRes] = await Promise.all([
        db.from('bookings').select('*').eq('id', bookingId).single(),
        db.from('booking_items').select('*').eq('booking_id', bookingId).order('created_at'),
        db.from('technicians').select('id, name').order('name'),
        db.from('services').select('id, name, price, service_type').order('service_type').order('name'),
      ]);
      if (cancelled) return;
      const error = bookingRes.error || itemsRes.error;
      if (error || !bookingRes.data) {
        setLoadError(error?.message || 'Booking not found');
        return;
      }
      const b = bookingRes.data;
      const { data: profile } = await db.from('profiles').select('full_name, phone').eq('user_id', b.user_id).maybeSingle();
      if (cancelled) return;

      const values: FormValues = {
        booking_date: b.booking_date || '',
        booking_time: b.booking_time || '',
        status: b.status || 'pending',
        payment_status: b.payment_status || 'pending',
        technician_id: b.technician_id || NO_TECHNICIAN,
        address: b.address || b.service_address || '',
        city: b.city || '',
        pincode: b.pincode || '',
        landmark: b.landmark || '',
        special_instructions: b.special_instructions || '',
        travel_charges: Number(b.travel_charges || 0),
        items: (itemsRes.data || []).map((i: any) => ({
          id: i.id, service_name: i.service_name || '', quantity: Number(i.quantity || 1), price: Number(i.price || 0),
        })),
        confirmPaidChange: false,
        notifyCustomer: true,
      };
      reset(values);
      setInitial(values);
      setCustomer({ name: profile?.full_name || '', phone: profile?.phone || '' });
      setMeta({ tax: Number(b.service_tax || 0), paid: b.payment_status === 'paid', adminCreated: !!b.created_by_admin, cancelled: b.status === 'cancelled' });
      setTechnicians((techRes.data || []) as Option[]);
      setServices(Array.from(new Map((servicesRes.data || []).map((s: any) => [s.id, s])).values()) as Option[]);
      setLoaded(true);
    })();

    return () => { cancelled = true; };
  }, [bookingId, reset]);

  const v = watch();
  const itemsTotal = (v.items || []).reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
  // Mirrors the server rule: admin-created bookings carry no GST, others keep the stored tax.
  const tax = meta.adminCreated ? 0 : meta.tax;
  const finalAmount = itemsTotal + tax + (Number(v.travel_charges) || 0);

  const moneyKey = (x: FormValues | null) => x && JSON.stringify([x.payment_status, x.travel_charges, x.items.map(i => [i.id, i.price, i.quantity])]);
  const moneyChanged = !!initial && moneyKey(v as FormValues) !== moneyKey(initial);
  const needsPaidConfirm = meta.paid && moneyChanged;
  const scheduleChanged = !!initial && (v.booking_date !== initial.booking_date || v.booking_time !== initial.booking_time || v.technician_id !== initial.technician_id);
  const dirty = useMemo(() => !!initial && JSON.stringify({ ...v, confirmPaidChange: false }) !== JSON.stringify({ ...initial, confirmPaidChange: false }), [v, initial]);

  const onSubmit = handleSubmit(async (values) => {
    if (needsPaidConfirm && !values.confirmPaidChange) {
      toast({ title: 'Confirmation needed', description: 'Tick the box that confirms you are changing a paid booking.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const loadingToast = toast({ title: 'Saving booking...' });
    try {
      const res = await fetch('/api/admin/booking?action=update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` },
        body: JSON.stringify({
          bookingId,
          booking_date: values.booking_date,
          booking_time: values.booking_time,
          status: values.status,
          payment_status: values.payment_status,
          technician_id: values.technician_id === NO_TECHNICIAN ? null : values.technician_id,
          address: values.address,
          city: values.city || null,
          pincode: values.pincode || null,
          landmark: values.landmark || null,
          special_instructions: values.special_instructions || null,
          travel_charges: values.travel_charges,
          items: values.items,
          expectedFinalAmount: finalAmount,
          confirmPaidChange: values.confirmPaidChange,
          notifyCustomer: scheduleChanged && values.notifyCustomer,
        }),
      });
      const data = await res.json().catch(() => ({}));
      loadingToast.dismiss();
      if (!res.ok || !data.success) throw new Error(data.message || `Request failed (${res.status})`);

      const extras = [
        data.totalsAdjusted ? `The server total is ${money(data.serverTotals.final_amount)}, not ${money(finalAmount)}. The server value was saved.` : '',
        data.sms === 'sent' ? 'Customer notified by SMS.' : '',
        data.smsNote || '',
        data.warning || '',
      ].filter(Boolean).join(' ');
      toast({ title: 'Booking updated', description: extras || 'Your changes are saved.' });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      loadingToast.dismiss();
      const message = error instanceof Error ? error.message : 'Unknown error';
      setServerNote(message);
      toast({ title: 'Could not save booking', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  });

  const firstError = firstMessage(errors);

  return (
    <Dialog open={!!bookingId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            {bookingId && <span className="font-mono text-xs">#{bookingId.slice(0, 8)}</span>}
            {customer.name && <> · {customer.name}</>}
            {customer.phone && <> · {customer.phone}</>}
          </DialogDescription>
        </DialogHeader>

        {loadError ? (
          <p className="py-8 text-center text-sm text-red-600">Couldn't load this booking: {loadError}</p>
        ) : !loaded ? (
          <div className="space-y-4 py-4" aria-busy="true" aria-label="Loading booking">
            {[0, 1, 2].map(i => (
              <div key={i} className="grid grid-cols-2 gap-4"><Skeleton className="h-[62px]" /><Skeleton className="h-[62px]" /></div>
            ))}
            <Skeleton className="h-[194px]" />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 py-4">
            {meta.cancelled && (
              <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                This booking is cancelled, so it can't be edited.
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date" className="mb-2 block">Booking Date *</Label>
                <Input id="edit-date" type="date" {...register('booking_date')} />
              </div>
              <div>
                <Label className="mb-2 block">Booking Time *</Label>
                <Select value={v.booking_time} onValueChange={(t) => setValue('booking_time', t, { shouldDirty: true })}>
                  <SelectTrigger aria-label="Booking time"><SelectValue placeholder="Select time" /></SelectTrigger>
                  <SelectContent>
                    {withCurrent(TIME_SLOTS, v.booking_time).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Status</Label>
                <Select value={v.status} onValueChange={(s) => setValue('status', s as FormValues['status'], { shouldDirty: true })}>
                  <SelectTrigger aria-label="Booking status"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{pretty(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Payment Status</Label>
                <Select value={v.payment_status} onValueChange={(s) => setValue('payment_status', s as FormValues['payment_status'], { shouldDirty: true })}>
                  <SelectTrigger aria-label="Payment status"><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{pretty(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Technician</Label>
              <Select value={v.technician_id} onValueChange={(t) => setValue('technician_id', t, { shouldDirty: true })}>
                <SelectTrigger aria-label="Technician"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TECHNICIAN}>Not assigned</SelectItem>
                  {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <fieldset className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <legend className="sr-only">Service items</legend>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-gray-700">Service Items *</span>
                <span className="text-xs text-gray-500">Name · Qty · Unit price</span>
              </div>
              {fields.map((field, idx) => (
                <div key={field.id} className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <Input aria-label={`Item ${idx + 1} name`} placeholder="Service name" className="w-full min-w-0 bg-white sm:w-auto sm:flex-1" {...register(`items.${idx}.service_name`)} />
                  <Input aria-label={`Item ${idx + 1} quantity`} type="number" inputMode="numeric" min={1} step={1} className="w-16 shrink-0 bg-white" {...register(`items.${idx}.quantity`, { valueAsNumber: true })} />
                  <Input aria-label={`Item ${idx + 1} unit price in rupees`} type="number" inputMode="decimal" min={0} className="min-w-0 flex-1 bg-white sm:w-24 sm:flex-none" {...register(`items.${idx}.price`, { valueAsNumber: true })} />
                  <Button type="button" size="icon" variant="outline" onClick={() => remove(idx)} aria-label={`Remove item ${idx + 1}`} title="Remove item" className="shrink-0 text-gray-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Select value="" onValueChange={(id) => {
                const s = services.find(x => x.id === id);
                append({ service_name: s?.name || '', quantity: 1, price: Number(s?.price || 0) });
              }}>
                <SelectTrigger aria-label="Add a service item" className="bg-white border-dashed"><SelectValue placeholder="+ Add service item" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={CUSTOM_ITEM}>Custom item</SelectItem>
                  {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.service_type}) - ₹{s.price}</SelectItem>)}
                </SelectContent>
              </Select>
            </fieldset>

            <fieldset className="p-4 bg-gray-50 rounded-lg">
              <legend className="sr-only">Amounts</legend>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="mb-2 block">Items Total</Label>
                  <div className="flex h-10 items-center rounded-md border border-dashed border-gray-300 px-3 tabular-nums">{money(itemsTotal)}</div>
                </div>
                <div>
                  <Label className="mb-2 block">Service Tax {meta.adminCreated && '(none, admin booking)'}</Label>
                  <div className="flex h-10 items-center rounded-md border border-dashed border-gray-300 px-3 tabular-nums">{money(tax)}</div>
                </div>
                <div>
                  <Label htmlFor="edit-travel" className="mb-2 block">Travel Charges (₹)</Label>
                  <Input id="edit-travel" type="number" inputMode="decimal" min={0} className="bg-white" {...register('travel_charges', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label className="mb-2 block">Final Amount</Label>
                  <div className="flex h-10 items-center rounded-md border border-gray-300 bg-white px-3 font-medium tabular-nums">{money(finalAmount)}</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-600">The server works out the final amount again when you save.</p>
            </fieldset>

            <div>
              <Label htmlFor="edit-address" className="mb-2 block">Address *</Label>
              <Textarea id="edit-address" rows={2} placeholder="Flat, building, street" {...register('address')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-city" className="mb-2 block">City / Locality</Label>
                <Input id="edit-city" {...register('city')} />
              </div>
              <div>
                <Label htmlFor="edit-pincode" className="mb-2 block">Pincode</Label>
                <Input id="edit-pincode" inputMode="numeric" maxLength={10} {...register('pincode')} />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-landmark" className="mb-2 block">Landmark</Label>
              <Input id="edit-landmark" {...register('landmark')} />
            </div>
            <div>
              <Label htmlFor="edit-instructions" className="mb-2 block">Special Instructions</Label>
              <Textarea id="edit-instructions" rows={2} placeholder="Any special instructions or notes..." {...register('special_instructions')} />
            </div>

            {needsPaidConfirm && (
              <label className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
                <Checkbox checked={v.confirmPaidChange} onCheckedChange={(c) => setValue('confirmPaidChange', c === true)} className="mt-0.5" />
                <span>I understand this changes a paid booking. It will be logged.</span>
              </label>
            )}
            {scheduleChanged && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={v.notifyCustomer} onCheckedChange={(c) => setValue('notifyCustomer', c === true)} />
                <span>Notify customer by SMS</span>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              {(serverNote || (dirty && firstError)) && (
                <p role="alert" className="mr-auto text-sm text-red-600">{serverNote || firstError}</p>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={!dirty || saving || meta.cancelled}>
                {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>) : (<><Save className="w-4 h-4 mr-2" />Save Changes</>)}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
