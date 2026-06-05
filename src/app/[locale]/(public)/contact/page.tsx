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
      label: locale === "fr" ? "YouTube" : "YouTube",
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
        className="min-h-screen bg-linear-to-b from-white to-slate-50"
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
      className="min-h-screen bg-linear-to-b from-white via-slate-50 to-slate-100"
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
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
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                {t.formTitle}
              </h2>
              <p className="text-lg text-slate-600">{t.formDescription}</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  {t.nameLabel}
                </label>
                <Input
                  type="text"
                  name="name"
                  placeholder={t.namePlaceholder}
                  value={formData.name || session?.user?.name || ""}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  {t.emailLabel}
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder={t.emailPlaceholder}
                  value={formData.email || session?.user?.email || ""}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  {t.phoneLabel}
                </label>
                <Input
                  type="tel"
                  name="phone"
                  placeholder={t.phonePlaceholder}
                  value={formData.phone || session?.user?.phone || ""}
                  onChange={handleChange}
                  className="h-12 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  {t.subjectLabel}
                </label>
                <Input
                  type="text"
                  name="subject"
                  placeholder={t.subjectPlaceholder}
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  {t.messageLabel}
                </label>
                <Textarea
                  name="message"
                  placeholder={t.messagePlaceholder}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
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
              <div className="absolute inset-0 bg-linear-to-r from-blue-600/20 to-purple-600/20 blur-3xl rounded-3xl"></div>
              <div className="relative bg-linear-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-100">
                <div className="aspect-square bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <div className="text-white text-center">
                    <Mail className="w-20 h-20 mx-auto mb-4 opacity-80" />
                    <p className="text-2xl font-bold">{t.heroIllustration}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Cards */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                {t.contactInfoTitle}
              </h3>

              {/* Email Card */}
              <div className="p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {t.emailLabelCard}
                    </h4>
                    <a
                      href="mailto:support@smssar.ma"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {t.supportEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Response Time Card */}
              <div className="p-6 bg-white rounded-xl border border-slate-200 hover:border-green-300 transition-colors hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="w-6 h-6 text-green-600 font-bold text-lg">
                      ⏱
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {t.responseTimeLabel}
                    </h4>
                    <p className="text-slate-600 font-medium">
                      {t.responseTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Availability Card */}
              <div className="p-6 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-colors hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="w-6 h-6 flex items-center justify-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {t.availabilityLabel}
                    </h4>
                    <p className="text-slate-600 font-medium">
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
      <div className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              {t.followUsTitle}
            </h3>
            <p className="text-slate-600">{t.followUsSubtitle}</p>
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
                  className={`group inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:ring-4 ${hoverRing} cursor-pointer`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${accent} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span
                    className={`text-sm font-semibold text-slate-700 transition-colors ${hoverText}`}
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
