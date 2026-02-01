"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function SignupForm({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  
  const [formData, setFormData] = useState({ name: "", email: "", password: "", country: "US" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation Logic
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordRegex.test(formData.password)) {
      setError(t("passwordRequirements"));
      return;
    }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify({ ...formData, locale }),
    });

    if (res.ok) {
      router.push("/login?registered=true");
    } else {
      const data = await res.json();
      setError(data.error);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
      <h1 className="text-2xl font-bold text-center mb-6">{t("signupTitle")}</h1>
      
      {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="text" placeholder={t("namePlaceholder")} required
          className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
        <input 
          type="email" placeholder={t("emailLabel")} required
          className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            placeholder={t("passwordLabel")}
            className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <button 
            type="button" 
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-3 text-sm text-gray-500"
          >
            {showPass ? "🙈" : "👁️"}
          </button>
        </div>

        <button 
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {loading ? t("loading") : t("signupButton")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/login" className="text-blue-600 font-bold hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}