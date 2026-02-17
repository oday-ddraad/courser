"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
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
      // After registration, redirect to login
      // After login, middleware will redirect to complete-profile if needed
      router.push("/login?registered=true");
    } else {
      const data = await res.json();
      setError(data.error);
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    signIn("google", { callbackUrl: "/complete-profile" });
  };

  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
      <h1 className="text-2xl font-bold text-center mb-6">{t("signupTitle")}</h1>
      
      {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}

      {/* Google Sign Up Button */}
      <button
        onClick={handleGoogleSignUp}
        type="button"
        className="w-full py-3 px-4 mb-6 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-all flex items-center justify-center gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign up with Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-slate-900 text-gray-500">Or sign up with email</span>
        </div>
      </div>

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
