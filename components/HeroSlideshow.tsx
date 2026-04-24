"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const slides = [
  { id: 1, url: "/images/slideshow/slide1.png", alt: "Learning Language 1" },
  { id: 2, url: "/images/slideshow/slide2.png", alt: "Learning Language 2" },
  { id: 3, url: "/images/slideshow/slide3.png", alt: "Learning Language 3" },
];

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[60vh] min-h-[400px] md:h-[70vh] md:min-h-[500px] max-h-[800px] overflow-hidden rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">

      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
          
          <Image
            src={slide.url}
            alt={slide.alt}
            fill
            className="object-contain w-full h-full"
            priority={index === 0}
            sizes="100vw"
          />

        </div>

      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-full transition-all ${
              current === i ? "bg-white w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
