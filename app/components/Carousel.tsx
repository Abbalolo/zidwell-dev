// components/Carousel.tsx\\
"use client"
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";


const slides = [
  "/zid-pic/image1.jpg",
  "/zid-pic/image2.jpg",
  "/zid-pic/image3.jpg",
  "/zid-pic/image4.jpg",
  "/zid-pic/image5.jpg",
  "/zid-pic/image6.jpg",
  "/zid-pic/image8.jpg",
  "/zid-pic/image9.jpg",
  "/zid-pic/image10.jpg",
  "/zid-pic/image11.jpg",
  "/zid-pic/image12.jpg",
  "/zid-pic/image13.jpg",
  "/zid-pic/image14.jpg",
  "/zid-pic/image15.jpg",
  "/zid-pic/image16.jpg",
  "/zid-pic/image17.jpg",
];

const Carousel: React.FC = ({

}) => {
  const [current, setCurrent] = useState(0);
  const autoSlide:boolean = true
  const autoSlideInterval:number = 15000
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
              width={500} 
              height={500}
              
            />
          </div>
        ))}
      </div>

     
    
    </div>
  );
};

export default Carousel;
