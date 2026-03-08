import { MapPin } from 'lucide-react';

const AREAS = [
  'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'DLF Phase 4', 'DLF Phase 5',
  'Golf Course Road', 'Golf Course Extension', 'Sohna Road',
  'Sector 62', 'Sector 63', 'Sector 64', 'Sector 65', 'Sector 66', 'Sector 67',
  'Manesar', 'Palam Vihar', 'South City', 'Udyog Vihar', 'Cyber City', 'Huda City Centre',
];

export default function ServiceAreas() {
  return (
    <section className="py-16 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <MapPin className="h-10 w-10 text-primary mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-3">We Serve All of Gurgaon</h2>
            <p className="text-muted-foreground mb-6">
              Covering 20+ areas with same-day service
            </p>
            <a
              href="tel:9211970030"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Book a Service →
            </a>
          </div>

          {/* Right */}
          <div>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {AREAS.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 rounded-full bg-white border border-primary/30 text-primary text-sm font-medium"
                >
                  {area}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center md:text-left">
              Don't see your area?{' '}
              <a href="tel:9211970030" className="text-primary font-medium underline">
                Call us
              </a>{' '}
              — we likely cover it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
