"use client";
import { useEffect, useState } from "react";
import ContactButton from "./ContactButton";

interface SiteSettings {
  whatsappLink?: string;
  instagramLink?: string;
  facebookLink?: string;
  telegramLink?: string;
}

export default function GlobalContactWidget() {
  const [settings, setSettings] = useState<SiteSettings>({
    whatsappLink: "",
    instagramLink: "",
    facebookLink: "",
    telegramLink: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/site-settings");
        const data = await response.json();
        if (data.success && data.data) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error("Failed to load contact links:", error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <ContactButton
      socialLinks={{
        whatsapp: settings.whatsappLink,
        instagram: settings.instagramLink,
        facebook: settings.facebookLink,
        telegram: settings.telegramLink,
      }}
    />
  );
}
