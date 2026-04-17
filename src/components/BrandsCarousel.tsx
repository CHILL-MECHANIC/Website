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
                <div className="flex items-center justify-center h-24 px-4 bg-white/90 cursor-grab active:cursor-grabbing">
                  <img
                    src={brand.image}
                    alt={brand.name}
                    className={
                      brand.name === 'Blue Star'
                        ? 'h-20 w-auto object-contain scale-125'
                        : 'h-12 w-auto object-contain'
                    }
                  />
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
