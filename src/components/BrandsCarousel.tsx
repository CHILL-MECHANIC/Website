import type { ComponentType } from 'react';
import { useState, useEffect } from 'react';
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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

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

      {/* Draggable Carousel */}
      <div className="relative w-full">
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {ALL_BRANDS.map((brand, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                <div className="flex items-center justify-center h-24 px-4 rounded-lg border border-border bg-white/90 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                  {brand.Icon ? (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <brand.Icon size={32} color={brand.color} title={brand.name} />
                      <span className="text-xs md:text-sm font-semibold text-foreground">{brand.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold text-white"
                        style={{ backgroundColor: brand.color }}
                      >
                        {brand.short}
                      </span>
                      <span className="text-xs md:text-sm font-semibold text-foreground">{brand.name}</span>
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 md:-translate-x-16" />
          <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 md:translate-x-16" />
        </Carousel>
      </div>
    </section>
  );
}
