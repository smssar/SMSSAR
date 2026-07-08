"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Mail, ArrowRight, Sparkles, Send } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";

export default function ContactPage() {
  const params = useParams();
  const locale = (params.locale as Locale) || "en";
  const messages = getMessages(locale);
  const t = messages.contact;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dir = locale === "ar" ? "rtl" : "ltr";

  const socialLinks = [
    {
      label: t.social.instagram,
      icon: FaInstagram,
      accent: "from-pink-500 to-rose-500",
      hoverRing: "hover:ring-pink-200",
      hoverText: "group-hover:text-pink-600",
      link: "https://instagram.com",
    },
    {
      label: t.social.twitter,
      icon: FaXTwitter,
      accent: "from-black to-gray-800",
      hoverRing: "hover:ring-gray-600",
      hoverText: "group-hover:text-gray-600",
      link: "https://twitter.com",
    },
    {
      label: t.social.facebook,
      icon: FaFacebookF,
      accent: "from-blue-600 to-indigo-600",
      hoverRing: "hover:ring-blue-200",
      hoverText: "group-hover:text-blue-600",
      link: "https://facebook.com",
    },
    {
      label: locale === "ar" ? "YouTube" : "YouTube",
      icon: FaYoutube,
      accent: "from-red-500 to-orange-500",
      hoverRing: "hover:ring-red-200",
      hoverText: "group-hover:text-red-600",
      link: "https://youtube.com",
    },
  ] as const;

  const { data: session } = useSession();

  useEffect(() => {
    // Prefill phone from profile endpoint when user is authenticated
    if (!session?.user?.id) return;
    if (formData.phone) return; // don't overwrite if user typed

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) return;
        const payload = await res.json();
        const phone = payload?.data?.phone;
        if (!cancelled && phone) {
          setFormData((prev) => ({ ...prev, phone }));
        }
      } catch {
        // ignore - non-fatal
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, formData.phone]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error(t.errorMessage);
      }

      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div
        dir={dir}
        className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <Send className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              {t.successTitle}
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
              {t.successMessage}
            </p>
            <Button
              onClick={() => (window.location.href = `/${locale}`)}
              className="gap-2"
            >
              {t.successCta}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={dir}
      className="min-h-screen bg-linear-to-b from-slate-50 via-slate-100 to-slate-200 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100"
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 text-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-white/10 blur-3xl dark:bg-indigo-500/10"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-white/10 blur-3xl dark:bg-fuchsia-500/10"></div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-16">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-semibold tracking-wider uppercase">
              {t.heroBadge}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {t.heroTitle}
          </h1>
          <p className="text-xl text-white/90 max-w-2xl">{t.heroSubtitle}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Form */}
          <div>
            <div className="mb-8">
              <h2 className="mb-3 text-3xl font-bold text-slate-900 dark:text-slate-100">
                {t.formTitle}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                {t.formDescription}
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/40">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.nameLabel}
                </label>
                <Input
                  type="text"
                  name="name"
                  placeholder={t.namePlaceholder}
                  value={formData.name || session?.user?.name || ""}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.emailLabel}
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder={t.emailPlaceholder}
                  value={formData.email || session?.user?.email || ""}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.phoneLabel}
                </label>
                <Input
                  type="tel"
                  name="phone"
                  placeholder={t.phonePlaceholder}
                  value={formData.phone || session?.user?.phone || ""}
                  onChange={handleChange}
                  className="h-12 rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.subjectLabel}
                </label>
                <Input
                  type="text"
                  name="subject"
                  placeholder={t.subjectPlaceholder}
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.messageLabel}
                </label>
                <Textarea
                  name="message"
                  placeholder={t.messagePlaceholder}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="resize-none rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full h-12 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                    {t.sendingButton}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t.sendButton}
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Contact Info & Image */}
          <div className="flex flex-col justify-between">
            {/* Image Section */}
            <div className="mb-12 relative">
              <div className="absolute inset-0 rounded-3xl bg-linear-to-r from-blue-600/20 to-purple-600/20 blur-3xl dark:from-blue-500/10 dark:to-fuchsia-500/10"></div>
              <div className="relative rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50 to-purple-50 p-8 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                <div className="aspect-square rounded-2xl bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 shadow-xl  flex items-center justify-center">
                  <div className="text-white text-center">
                    <Mail className="w-20 h-20 mx-auto mb-4 opacity-80" />
                    <p className="text-2xl font-bold">{t.heroIllustration}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Cards */}
            <div className="space-y-4">
              <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {t.contactInfoTitle}
              </h3>

              {/* Email Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-blue-500/40">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/15">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
                      {t.emailLabelCard}
                    </h4>
                    <a
                      href="mailto:support@smssar.ma"
                      className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                    >
                      {t.supportEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Response Time Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-green-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-green-500/40">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/15">
                    <span className="text-lg font-bold text-green-600 dark:text-green-300">
                      ⏱
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
                      {t.responseTimeLabel}
                    </h4>
                    <p className="font-medium text-slate-600 dark:text-slate-300">
                      {t.responseTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Availability Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-purple-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-purple-500/40">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/15">
                    <span className="flex h-6 w-6 items-center justify-center">
                      <span className="h-3 w-3 animate-pulse rounded-full bg-green-500"></span>
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
                      {t.availabilityLabel}
                    </h4>
                    <p className="font-medium text-slate-600 dark:text-slate-300">
                      {t.availableHours}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Section */}
      <div className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t.followUsTitle}
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              {t.followUsSubtitle}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {socialLinks.map(
              ({ label, icon: Icon, accent, hoverRing, hoverText, link }) => (
                <a
                  key={label}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`group inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:ring-4 dark:border-slate-800 dark:bg-slate-900/80 ${hoverRing}`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${accent} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span
                    className={`text-sm font-semibold text-slate-700 transition-colors dark:text-slate-200 ${hoverText}`}
                  >
                    {label}
                  </span>
                </a>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
