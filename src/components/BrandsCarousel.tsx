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

// Import brand logos from assets
import daikinLogo from '@/assets/daikin-logo-1-.svg';
import whirlpoolLogo from '@/assets/whirlpool-corporation-logo-as-of-2017-.svg';
import bajajLogo from '@/assets/bajaj-auto-logo.svg';
import cromptonLogo from '@/assets/crompton-logo.svg';
import vguardLogo from '@/assets/v-guard.svg';
import godrejLogoSvg from '@/assets/Godrej_Logo.svg';
import bluestarLogoSvg from '@/assets/blue-star-limited-logo-vector.svg';


type IconProps = { size?: number | string; color?: string; title?: string };

type Brand = {
  name: string;
  color: string;
  short: string;
  Icon?: ComponentType<IconProps>;
  image?: string;
};

const ALL_BRANDS: Brand[] = [
  { name: 'Daikin', image: daikinLogo, color: '#00a0df', short: 'DK' },
  { name: 'Blue Star', image: bluestarLogoSvg, color: '#0d4da1', short: 'BS' },
  { name: 'Whirlpool', image: whirlpoolLogo, color: '#003da5', short: 'WP' },
  { name: 'Godrej', image: godrejLogoSvg, color: '#0067b8', short: 'GJ' },
  { name: 'Bajaj', image: bajajLogo, color: '#003ca6', short: 'BJ' },
  { name: 'Crompton', image: cromptonLogo, color: '#00a0e3', short: 'CP' },
  { name: 'V-Guard', image: vguardLogo, color: '#ef4123', short: 'VG' },
  { name: 'LG', Icon: SiLg, color: '#d32f2f', short: 'LG' },
  { name: 'Samsung', Icon: SiSamsung, color: '#1428a0', short: 'SM' },
  { name: 'Panasonic', Icon: SiPanasonic, color: '#003087', short: 'PN' },
  { name: 'Hitachi', Icon: SiHitachi, color: '#d40000', short: 'HT' },
  { name: 'Fujitsu', Icon: SiFujitsu, color: '#e4002b', short: 'FJ' },
  { name: 'Bosch', Icon: SiBosch, color: '#ea001b', short: 'BS' },
  { name: 'Siemens', Icon: SiSiemens, color: '#009999', short: 'SN' },
  { name: 'Havells', Icon: SiHavells, color: '#ff6600', short: 'HV' },
];

export default function BrandsCarousel({ headingLevel = 2 }: { headingLevel?: 2 | 3 | 4 | 5 | 6 }) {
  const Heading = `h${headingLevel}` as keyof JSX.IntrinsicElements;
  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 text-center mb-10">
        <Heading className="text-3xl md:text-4xl font-bold mb-2">BRANDS WE SERVE</Heading>
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
                <div className="flex items-center justify-center h-24 px-4 bg-white/90 cursor-grab active:cursor-grabbing hover:bg-white/95 transition-colors">
                  {brand.image ? (
                    <img
                      src={brand.image}
                      alt={brand.name}
                      className={
                        brand.name === 'Blue Star'
                          ? 'h-20 w-auto object-contain scale-125'
                          : 'h-12 w-auto object-contain'
                      }
                    />
                  ) : brand.Icon ? (
                    <brand.Icon size={48} color={brand.color} title={brand.name} />
                  ) : null}
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
