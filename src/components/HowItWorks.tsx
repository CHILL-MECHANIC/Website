import { CalendarCheck, Truck, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    Icon: CalendarCheck,
    heading: 'Book Online or Call',
    body: 'Choose your service and book online or call 9211970030',
  },
  {
    Icon: Truck,
    heading: 'Technician Arrives',
    body: 'Our certified technician arrives at your doorstep at the scheduled time',
  },
  {
    Icon: CheckCircle2,
    heading: 'Get It Fixed',
    body: 'We diagnose, repair, and ensure your appliance works perfectly',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">HOW IT WORKS?</h2>
          <p className="text-muted-foreground">Book appliance repair in 3 simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Dashed connector line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] border-t-2 border-dashed border-secondary/40 z-0" />

          {STEPS.map(({ Icon, heading, body }, i) => (
            <div key={i} className="flex flex-col items-center text-center relative z-20">
              <div className="w-24 h-24 rounded-full bg-[#f3ede3] ring-8 ring-white flex items-center justify-center mb-5">
                <Icon className="h-10 w-10 text-secondary" strokeWidth={1.5} />
              </div>
              <span className="inline-block bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 leading-6 mb-3">
                {i + 1}
              </span>
              <h3 className="text-lg font-bold mb-2">{heading}</h3>
              <p className="text-muted-foreground text-sm max-w-xs">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
