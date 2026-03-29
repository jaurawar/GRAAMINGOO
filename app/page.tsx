import Link from "next/link";
import Image from "next/image";
import {
  Car,
  Bike,
  Truck,
  Lock,
  Scale,
  Wheat,
  Smartphone,
  Users,
  MapPin,
  TrendingUp,
  ChevronRight,
  Shield,
  ArrowRight,
  CheckCircle,
  IndianRupee,
  Radio,
} from "lucide-react";

// ─── Dummy stats for testing ──────────────────────────────────────────────────
const STATS = [
  { num: "1,247", label: "Rides completed", icon: Car },
  { num: "89",    label: "Active drivers",  icon: Bike },
  { num: "34",    label: "Villages served", icon: MapPin },
];

const FEATURES = [
  {
    icon: Lock,
    title: "Emergency Fare Lock",
    desc: "Medical emergencies are never price-gouged. Fare locked at system rate + ₹100 flat. Always.",
    accent: "bg-danger-50 border-danger-200",
    iconBg: "bg-danger-100",
    iconColor: "text-danger-600",
    titleColor: "text-danger-700",
  },
  {
    icon: Scale,
    title: "±15% Fare Band",
    desc: "Driver sets their own price within 15% of platform rate. Dignity and transparency — both.",
    accent: "bg-brand-50 border-brand-200",
    iconBg: "bg-brand-100",
    iconColor: "text-brand-green",
    titleColor: "text-brand-600",
  },
  {
    icon: Wheat,
    title: "Panchayat Trust Layer",
    desc: "Known drivers surface first. Sarpanch-endorsed. Community reputation over star ratings.",
    accent: "bg-saffron-50 border-saffron-200",
    iconBg: "bg-saffron-100",
    iconColor: "text-saffron-600",
    titleColor: "text-saffron-700",
  },
  {
    icon: Smartphone,
    title: "WhatsApp + Offline Booking",
    desc: "Book via WhatsApp on 2G. Ride requests queue offline and submit when reconnected.",
    accent: "bg-earth-50 border-earth-200",
    iconBg: "bg-earth-100",
    iconColor: "text-earth-600",
    titleColor: "text-earth-600",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Enter pickup & drop",   desc: "Type your village or landmark" },
  { step: "02", title: "Choose vehicle type",   desc: "Bike, Auto, SUV or Tempo" },
  { step: "03", title: "Driver quotes fare",    desc: "Within ±15% of platform rate" },
  { step: "04", title: "Ride & rate",           desc: "Pay, rate, build community trust" },
];

const VERTICALS = [
  {
    href: "/cargo",
    icon: Truck,
    label: "Graamin Cargo",
    sub: "Farm produce to mandi",
    bg: "bg-earth-50 border-earth-200",
    iconBg: "bg-earth-100",
    iconColor: "text-earth-600",
  },
  {
    href: "/wedding",
    icon: Car,
    label: "Wedding Package",
    sub: "Multi-day event transport",
    bg: "bg-saffron-50 border-saffron-200",
    iconBg: "bg-saffron-100",
    iconColor: "text-saffron-600",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-earth overflow-hidden relative pb-20">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-100 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-40 left-0 w-64 h-64 bg-saffron-100 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl opacity-40 pointer-events-none" />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative px-5 pt-12 pb-8">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8 animate-fade-up">
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-3xl flex items-center justify-center overflow-hidden shadow-card-lg animate-float bg-white">
              <Image
                src="/logo.png"
                alt="Graamin Go"
                width={112}
                height={112}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            {/* Live dot */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white">
              <div className="absolute inset-0 rounded-full bg-green-400 animate-ping-slow opacity-75" />
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-brand-600 leading-none">
            Graamin Go
          </h1>
          <p className="text-brand-400 font-hindi text-lg font-semibold mt-1">
            ग्रामीण गो
          </p>
          <p className="text-gray-500 text-sm max-w-xs mt-3 leading-relaxed">
            Rural mobility built for Bharat — not borrowed from the city.
            Driver dignity intact. Fares you can trust.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 mb-7 stagger">
          {STATS.map(({ num, label, icon: Icon }) => (
            <div
              key={label}
              className="bg-surface-0 rounded-2xl p-3 text-center shadow-card border border-white/80 animate-fade-up card-hover"
            >
              <div className="w-8 h-8 rounded-xl bg-brand-green-pale flex items-center justify-center mx-auto mb-1.5">
                <Icon size={15} className="text-brand-green" />
              </div>
              <p className="text-sm font-bold text-brand-500">{num}</p>
              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <Link
            href="/login"
            className="group flex items-center justify-between w-full bg-gradient-brand text-white px-6 py-4 rounded-2xl font-semibold text-base shadow-card-md shadow-glow-green btn-press hover:shadow-lg transition-all"
          >
            <span className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Car size={16} className="text-white" />
              </div>
              Book a Ride
            </span>
            <ArrowRight size={18} className="text-white/70 group-hover:text-white transition-colors group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/login?driver=1"
            className="group flex items-center justify-between w-full bg-surface-0 border-2 border-brand-200 text-brand-500 px-6 py-4 rounded-2xl font-semibold text-base btn-press hover:border-brand-400 hover:bg-brand-50 transition-all shadow-card"
          >
            <span className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-green-pale flex items-center justify-center">
                <Bike size={16} className="text-brand-green" />
              </div>
              I am a Driver
            </span>
            <ArrowRight size={18} className="text-brand-300 group-hover:text-brand-500 transition-colors" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Radio size={10} /> No app needed</span>
          <span>·</span>
          <span>Works on 2G</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Smartphone size={10} /> WhatsApp booking</span>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className="px-5 pb-8">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
          How it works
        </p>
        <div className="grid grid-cols-2 gap-2.5 stagger">
          {HOW_IT_WORKS.map(({ step, title, desc }) => (
            <div
              key={step}
              className="bg-white rounded-2xl border border-gray-100 shadow-card p-3.5 animate-fade-up card-hover"
            >
              <span className="inline-block text-xs font-black text-brand-green-pale bg-brand-green rounded-lg px-2 py-0.5 mb-2">
                {step}
              </span>
              <p className="text-sm font-bold text-gray-700 leading-snug">{title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="px-5 pb-8">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
          What makes us different
        </p>
        <div className="space-y-3 stagger">
          {FEATURES.map(({ icon: Icon, title, desc, accent, iconBg, iconColor, titleColor }) => (
            <div
              key={title}
              className={`flex items-start gap-4 p-4 rounded-2xl border ${accent} animate-fade-up card-hover shadow-card`}
            >
              <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div>
                <p className={`text-sm font-bold ${titleColor}`}>{title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Service verticals ─────────────────────────────────────────────────── */}
      <section className="px-5 pb-8">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
          More services
        </p>
        <div className="grid grid-cols-2 gap-3">
          {VERTICALS.map(({ href, icon: Icon, label, sub, bg, iconBg, iconColor }) => (
            <Link
              key={label}
              href={href}
              className={`flex flex-col gap-3 p-4 rounded-2xl border ${bg} shadow-card card-hover btn-press`}
            >
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">{label}</p>
                <p className="text-[11px] text-gray-400">{sub}</p>
              </div>
              <ChevronRight size={14} className="text-gray-300 -mt-1 self-end" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Village Partner CTA ───────────────────────────────────────────────── */}
      <section className="px-5 pb-8">
        <div className="bg-gradient-brand rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Users size={15} className="text-white" />
              </div>
              <span className="text-white/80 text-xs font-bold uppercase tracking-wide">Village Partner</span>
            </div>
            <h3 className="text-white text-base font-bold leading-snug mb-1">
              Grow GraaminGo in your village
            </h3>
            <p className="text-white/70 text-xs leading-relaxed mb-4">
              Register drivers, spread awareness, earn 30% of platform commissions.
              First month completely free.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {["First month free", "30% commission", "No target pressure"].map((t) => (
                <span key={t} className="flex items-center gap-1 bg-white/15 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  <CheckCircle size={10} />
                  {t}
                </span>
              ))}
            </div>
            <Link
              href="/village-partner/register"
              className="inline-flex items-center gap-2 bg-white text-brand-green font-bold text-sm px-5 py-3 rounded-xl btn-press shadow-card"
            >
              Apply Now
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Commission transparency ───────────────────────────────────────────── */}
      <section className="px-5 pb-8">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
          Driver commission rates
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {[
            { label: "Premium subscription", rate: "0%", sub: "₹599/month flat", accent: true },
            { label: "Return trip match",     rate: "3%", sub: "Matched empty return" },
            { label: "Loyalty (50+ rides)",   rate: "5%", sub: "This month milestone" },
            { label: "Standard free plan",    rate: "8%", sub: "Default rate" },
          ].map(({ label, rate, sub, accent }) => (
            <div
              key={label}
              className={`flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 ${accent ? "bg-brand-green-pale" : ""}`}
            >
              <div>
                <p className={`text-sm font-semibold ${accent ? "text-brand-green" : "text-gray-700"}`}>{label}</p>
                <p className="text-[11px] text-gray-400">{sub}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <IndianRupee size={12} className={accent ? "text-brand-green" : "text-gray-400"} />
                <span className={`text-xl font-black ${accent ? "text-brand-green" : "text-gray-600"}`}>{rate}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
          <Shield size={10} />
          No hidden charges. No surge pricing. Ever.
        </p>
      </section>

      {/* ── Trust badges ──────────────────────────────────────────────────────── */}
      <section className="px-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Shield,       label: "Panchayat\nVerified" },
            { icon: TrendingUp,   label: "Transparent\nPricing" },
            { icon: Smartphone,   label: "Works\nOffline" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-card p-3 flex flex-col items-center gap-1.5">
              <Icon size={16} className="text-brand-green" />
              <p className="text-[10px] text-gray-500 font-semibold text-center leading-tight whitespace-pre-line">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom tagline ────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-brand-dark text-white text-center py-3 px-4 shadow-lg z-50">
        <p className="text-xs font-semibold opacity-90">
          "Graamin Go keeps driver dignity intact." · Village by village, ride by ride.
        </p>
      </div>
    </main>
  );
}
