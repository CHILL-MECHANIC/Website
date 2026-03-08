import { Award, Users, Star, Zap, BadgeCheck, Settings2 } from 'lucide-react';

const BADGES = [
  { Icon: Award, text: '50+ Years Experience' },
  { Icon: Users, text: '10,000+ Happy Customers' },
  { Icon: Star, text: '4.8/5 Google Rating' },
  { Icon: Zap, text: 'Same Day Service' },
  { Icon: BadgeCheck, text: 'Certified Technicians' },
  { Icon: Settings2, text: 'Genuine Parts' },
];

export default function TrustBadgeBar() {
  return (
    <section className="bg-white py-10 px-4 border-b">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
        {BADGES.map(({ Icon, text }) => (
          <div key={text} className="flex flex-col items-center text-center gap-3">
            <Icon className="h-10 w-10 text-secondary" strokeWidth={1.5} />
            <span className="text-sm font-bold text-foreground">{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
