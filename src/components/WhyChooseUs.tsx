import { Award, BadgeCheck, Zap, Settings2, Receipt, Shield } from 'lucide-react';

const POINTS = [
  { Icon: Award, heading: '50+ Years Experience', sub: 'Trusted since 1974' },
  { Icon: BadgeCheck, heading: 'Certified Technicians', sub: 'Trained for all brands' },
  { Icon: Zap, heading: 'Same Day Service', sub: 'Quick response and repair' },
  { Icon: Settings2, heading: 'Genuine Parts', sub: 'Original spare parts only' },
  { Icon: Receipt, heading: 'Upfront Pricing', sub: 'No hidden charges' },
  { Icon: Shield, heading: '30–90 Days Warranty', sub: 'Guaranteed satisfaction' },
];

export default function WhyChooseUs() {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          WHY CUSTOMERS CHOOSE US?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {POINTS.map(({ Icon, heading, sub }) => (
            <div
              key={heading}
              className="flex flex-col items-center text-center p-6 rounded-xl border border-border hover:shadow-md transition-shadow"
            >
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <Icon className="h-8 w-8 text-secondary" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-lg mb-1">{heading}</h3>
              <p className="text-muted-foreground text-sm">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
