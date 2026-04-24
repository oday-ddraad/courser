"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ContactButton from "@/components/ContactButton";

interface SlideshowImage {
  src: string;
  alt: string;
}

interface ArticleProps {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  image?: string;
}

interface SocialLinksData {
  whatsappLink?: string;
  instagramLink?: string;
  facebookLink?: string;
  telegramLink?: string;
}

export default function ArticleSection({ id, title, description, buttonText, image }: ArticleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactLinks, setContactLinks] = useState<SocialLinksData>({});
  const domRef = useRef<HTMLDivElement>(null);

  // Auto-assign slideshow image based on id if not provided
  const slideshowImages: SlideshowImage[] = [
    { src: "/images/slideshow/slide1.png", alt: "Learning Language 1" },
    { src: "/images/slideshow/slide2.png", alt: "Learning Language 2" },
    { src: "/images/slideshow/slide3.png", alt: "Learning Language 3" },
  ];
  const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const autoImage = slideshowImages[Math.abs(hash) % slideshowImages.length];
  const imageSrc = image || autoImage.src;
  const imageAlt = image ? title : autoImage.alt;

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => setIsVisible(entry.isIntersecting));
    });
    if (domRef.current) observer.observe(domRef.current);
    return () => { if (domRef.current) observer.unobserve(domRef.current); };
  }, []);

  useEffect(() => {
    if (id !== "contact") return;

    const loadContactLinks = async () => {
      try {
        const response = await fetch("/api/admin/site-settings");
        const data = await response.json();
        if (data.success && data.data) {
          setContactLinks(data.data);
        }
      } catch (error) {
        console.error("Failed to load contact links:", error);
      }
    };

    loadContactLinks();
  }, [id]);

  return (
    <section 
      id={id} 
      ref={domRef}
      className={`min-h-[60vh] flex flex-col md:flex-row items-center justify-between py-20 transition-all duration-1000 transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      {id === "contact" && isContactOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] transition-opacity"
          onClick={() => setIsContactOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="md:w-1/2 space-y-6 relative z-50">
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
        {id === "contact" ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Click the button below to open contact options
            </p>
            <ContactButton
              socialLinks={{
                whatsapp: contactLinks.whatsappLink,
                instagram: contactLinks.instagramLink,
                facebook: contactLinks.facebookLink,
                telegram: contactLinks.telegramLink,
              }}
              isOpen={isContactOpen}
              onToggle={() => setIsContactOpen((prev) => !prev)}
              embedded
            />
          </div>
        ) : (
          <button onClick={() => window.location.href = '/login'}  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow-lg transition-transform active:scale-95">
            {buttonText}
          </button>
        )}
      </div>
      
      <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
        <div className="relative w-full max-w-md aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-slate-700">
          {/* Single image from slideshow */}
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
      </div>
    </section>
  );
}