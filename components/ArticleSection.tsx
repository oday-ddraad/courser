"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ArticleProps {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  image: string;
}

export default function ArticleSection({ id, title, description, buttonText, image }: ArticleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => setIsVisible(entry.isIntersecting));
    });
    if (domRef.current) observer.observe(domRef.current);
    return () => { if (domRef.current) observer.unobserve(domRef.current); };
  }, []);

  return (
    <section 
      id={id} 
      ref={domRef}
      className={`min-h-[60vh] flex flex-col md:flex-row items-center justify-between py-20 transition-all duration-1000 transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="md:w-1/2 space-y-6">
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
        <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow-lg transition-transform active:scale-95">
          {buttonText}
        </button>
      </div>
      
      <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
        <div className="relative w-full max-w-md aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-slate-700">
           {/* Placeholder for images */}
           <div className="absolute inset-0 flex items-center justify-center text-slate-400 italic">
             Image Placeholder: {id}
           </div>
        </div>
      </div>
    </section>
  );
}