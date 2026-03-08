import type { ComponentType } from 'react';
import {
  SiLg,
  SiSamsung,
  SiHitachi,
  SiFujitsu,
  SiBosch,
  SiSiemens,
  SiHavells,
  SiPanasonic,
} from '@icons-pack/react-simple-icons';

type IconProps = { size?: number | string; color?: string; title?: string };

type Brand = {
  name: string;
  color: string;
  short: string;
  Icon?: ComponentType<IconProps>;
};

const ALL_BRANDS: Brand[] = [
  { name: 'LG', Icon: SiLg, color: '#a50034', short: 'LG' },
  { name: 'Samsung', Icon: SiSamsung, color: '#1428a0', short: 'SS' },
  { name: 'Daikin', color: '#00a0df', short: 'DK' },
  { name: 'Voltas', color: '#005baa', short: 'VT' },
  { name: 'Blue Star', color: '#0d4da1', short: 'BS' },
  { name: 'Hitachi', Icon: SiHitachi, color: '#e60012', short: 'HT' },
  { name: 'Carrier', color: '#1f4e8c', short: 'CR' },
  { name: 'O General', Icon: SiFujitsu, color: '#d71920', short: 'OG' },
  { name: 'Lloyd', color: '#0f6ab4', short: 'LL' },
  { name: 'Whirlpool', color: '#003da5', short: 'WP' },
  { name: 'Godrej', color: '#0067b8', short: 'GJ' },
  { name: 'Haier', color: '#00529c', short: 'HR' },
  { name: 'Bosch', Icon: SiBosch, color: '#ea0016', short: 'BH' },
  { name: 'Siemens', Icon: SiSiemens, color: '#009999', short: 'SM' },
  { name: 'IFB', color: '#005baa', short: 'IFB' },
  { name: 'Kent', color: '#e31e24', short: 'KT' },
  { name: 'Aquaguard', color: '#0070ba', short: 'AQ' },
  { name: 'Pureit', color: '#1f5dbb', short: 'PT' },
  { name: 'Livpure', color: '#00a3e0', short: 'LP' },
  { name: 'AO Smith', color: '#e2231a', short: 'AO' },
  { name: 'Bajaj', color: '#003ca6', short: 'BJ' },
  { name: 'Havells', Icon: SiHavells, color: '#e31c24', short: 'HV' },
  { name: 'Crompton', color: '#00a0e3', short: 'CP' },
  { name: 'V-Guard', color: '#ef4123', short: 'VG' },
  { name: 'Racold', color: '#f58220', short: 'RC' },
  { name: 'Panasonic', Icon: SiPanasonic, color: '#0046be', short: 'PN' },
];

export default function BrandsCarousel() {
  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">BRANDS WE SERVE</h2>
        <p className="text-muted-foreground">Trusted repairs across all major appliance brands</p>
      </div>

      {/* Infinite scrolling marquee */}
      <div className="relative w-full overflow-hidden">
        {/* Gradient fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />

        <div className="flex animate-[brand-scroll_40s_linear_infinite]">
          {[...ALL_BRANDS, ...ALL_BRANDS].map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              className="flex-shrink-0 mx-4 flex items-center justify-center h-16 w-44 px-4 rounded-lg border border-border bg-white/90 hover:shadow-sm transition-shadow"
            >
              {brand.Icon ? (
                <div className="flex items-center gap-2">
                  <brand.Icon size={30} color={brand.color} title={brand.name} />
                  <span className="text-sm font-semibold text-foreground">{brand.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-bold text-white"
                    style={{ backgroundColor: brand.color }}
                  >
                    {brand.short}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{brand.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
