// components/Carousel.tsx
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

type CarouselProps = {
  slides: any;
  autoSlide?: boolean;
  autoSlideInterval?: number;
};

const Carousel: React.FC<CarouselProps> = ({
  slides,
  autoSlide = true,
  autoSlideInterval = 15000,
}) => {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (!autoSlide) return;
    const interval = setInterval(nextSlide, autoSlideInterval);
    return () => clearInterval(interval);
  }, [current, autoSlide, autoSlideInterval]);

  return (
    <div className="relative hidden lg:flex overflow-hidden shadow-md w-[50%] h-screen">
      <div
        className="flex transition-transform duration-500 ease-in-out "
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide: any, index: number) => (
          <div className="w-full flex items-start justify-start flex-shrink-0" key={index}>
            <Image
              src={slide}
              alt={`slide-${index}`}
              className="w-full h-full object-cover"
              placeholder="blur"
              
            />
          </div>
        ))}
      </div>

     
    
    </div>
  );
};

export default Carousel;
