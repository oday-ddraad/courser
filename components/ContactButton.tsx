"use client";
import { useState, useEffect } from "react";
import { Phone, MessageCircle, Instagram, Facebook, Send, X } from "lucide-react";

interface SocialLink {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  telegram?: string;
}

interface ContactButtonProps {
  socialLinks: SocialLink;
  isOpen?: boolean;
  onToggle?: () => void;
  embedded?: boolean;
}

export default function ContactButton({ socialLinks, isOpen: controlledOpen, onToggle, embedded = false }: ContactButtonProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isControlled = typeof controlledOpen === "boolean";
  const isOpen = isControlled ? controlledOpen : localOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const normalizeUrl = (url?: string) => {
    if (!url) return "";
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^wa\.me\//i.test(trimmed)) return `https://${trimmed}`;
    if (/^t\.me\//i.test(trimmed)) return `https://${trimmed}`;
    if (/^instagram\.com\//i.test(trimmed)) return `https://${trimmed}`;
    if (/^facebook\.com\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed.startsWith("/") ? trimmed : `https://${trimmed}`;
  };

  const actions = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      url: normalizeUrl(socialLinks.whatsapp),
      icon: MessageCircle,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      key: "instagram",
      label: "Instagram",
      url: normalizeUrl(socialLinks.instagram),
      icon: Instagram,
      color: "bg-pink-500 hover:bg-pink-600",
    },
    {
      key: "facebook",
      label: "Facebook",
      url: normalizeUrl(socialLinks.facebook),
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      key: "telegram",
      label: "Telegram",
      url: normalizeUrl(socialLinks.telegram),
      icon: Send,
      color: "bg-sky-500 hover:bg-sky-600",
    },
  ].filter((item) => !!item.url);

  if (actions.length === 0) return null;

  return (
    <>
      {isOpen && !embedded && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] transition-opacity"
          onClick={() => {
            if (onToggle) onToggle();
            else setLocalOpen(false);
          }}
          aria-hidden="true"
        />
      )}

      <div className={embedded ? "flex flex-col items-start gap-3" : "fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"}>
        {isOpen && (
          <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {actions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                  className={`group flex items-center gap-2 rounded-full ${item.color} text-white shadow-lg px-4 py-2 transition-transform hover:scale-105`}
                  aria-label={item.label}
                  title={item.label}
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={() => {
            if (onToggle) onToggle();
            else setLocalOpen((prev) => !prev);
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Open contact links"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
        </button>
      </div>
    </>
  );
}
