"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/routing"; // Use our custom router for locale support
import { useTranslations } from "next-intl";

export default function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      redirect: false, // We handle redirect manually to ensure locale stays correct
      email,
      password,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Redirect to home or dashboard
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
      <h1 className="text-2xl font-bold text-center">{t("loginTitle")}</h1>
      
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("emailLabel")}</label>
          <input
            type="email"
            required
            className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">{t("passwordLabel")}</label>
          <input
            type="password"
            required
            className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? t("loggingIn") : t("loginButton")}
        </button>
      </form>
    </div>
  );
}