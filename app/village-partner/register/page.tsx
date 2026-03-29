"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  MapPin,
  Hash,
  Building2,
  Map,
  ChevronRight,
  CheckCircle2,
  Users,
  TrendingUp,
  Shield,
  ArrowLeft,
} from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

interface FormData {
  name: string;
  phone: string;
  village: string;
  pinCode: string;
  district: string;
  state: string;
}

interface FieldError {
  [key: string]: string[];
}

const RESPONSIBILITIES = [
  { icon: Users, text: "Register drivers with valid licences and vehicles" },
  { icon: MapPin, text: "Help villagers understand how to use the platform" },
  { icon: TrendingUp, text: "Spread awareness via WhatsApp and local channels" },
  { icon: Shield, text: "Act as support contact between drivers, passengers, and GraaminGo" },
];

function InputField({
  label,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  icon: React.ElementType;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <div className={`flex items-center gap-3 border rounded-xl px-3 py-3 bg-white transition-colors ${
        error ? "border-red-400 bg-red-50" : "border-gray-200 focus-within:border-brand-green"
      }`}>
        <Icon size={16} className={error ? "text-red-400" : "text-gray-400"} />
        {children}
      </div>
      {error && <p className="text-xs text-red-500 mt-1 pl-1">{error}</p>}
    </div>
  );
}

export default function VillagePartnerRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    name: "",
    phone: "",
    village: "",
    pinCode: "",
    district: "",
    state: "",
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; name: string; village: string; firstMonthFreeUntil: string } | null>(null);
  const [serverError, setServerError] = useState("");

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: [] }));
    setServerError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/village-partner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setErrors(data.details);
        } else {
          setServerError(data.error || "Registration failed.");
        }
        return;
      }

      setSubmitted({
        id: data.partner.id,
        name: data.partner.name,
        village: data.partner.village,
        firstMonthFreeUntil: data.partner.firstMonthFreeUntil,
      });
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    const freeUntil = new Date(submitted.firstMonthFreeUntil).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });

    return (
      <main className="min-h-screen bg-surface-cream flex flex-col">
        <div className="bg-brand-green text-white px-5 pt-12 pb-10">
          <div className="flex items-center justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-center text-xl font-bold">Welcome, {submitted.name}!</h1>
          <p className="text-center text-brand-green-pale text-sm mt-1">
            You are now a GraaminGo Village Partner
          </p>
        </div>

        <div className="px-5 py-6 space-y-4 max-w-md mx-auto w-full">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-sm font-bold text-gray-700">Your Partner ID</p>
            <code className="block text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 break-all">
              {submitted.id}
            </code>
            <p className="text-xs text-gray-400">Save this ID to access your dashboard.</p>
          </div>

          <div className="bg-brand-green-pale border border-brand-green/20 rounded-2xl p-5">
            <p className="text-sm font-bold text-brand-green mb-1">First Month Free</p>
            <p className="text-xs text-brand-green/80">
              No fees until {freeUntil}. Start growing the GraaminGo network in {submitted.village} today.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-700 mb-3">How your commission works</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Ride fare</span>
                <span className="font-semibold text-gray-700">₹100</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Platform commission (8%)</span>
                <span className="font-semibold text-gray-700">₹8</span>
              </div>
              <div className="flex justify-between text-xs border-t pt-2 mt-2">
                <span className="text-brand-green font-semibold">Your share (30%)</span>
                <span className="font-bold text-brand-green">₹2.40</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push(`/village-partner/dashboard?partnerId=${submitted.id}`)}
            className="w-full bg-brand-green text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
          >
            Go to My Dashboard
            <ChevronRight size={16} />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-cream pb-10">
      {/* Header */}
      <div className="bg-brand-green text-white px-5 pt-12 pb-8">
        <a href="/" className="flex items-center gap-1.5 text-brand-green-pale text-sm mb-4">
          <ArrowLeft size={14} />
          Back
        </a>
        <h1 className="text-xl font-bold">Become a Village Partner</h1>
        <p className="text-brand-green-pale text-sm mt-1 leading-relaxed">
          Grow GraaminGo in your village and earn 30% of platform commissions.
          First month is completely free.
        </p>
      </div>

      {/* Responsibility cards */}
      <div className="px-4 pt-5 pb-2 max-w-md mx-auto">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">What you will do</p>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {RESPONSIBILITIES.map(({ icon: Icon, text }) => (
            <div key={text} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-2.5 items-start">
              <div className="mt-0.5 shrink-0">
                <Icon size={14} className="text-brand-green" />
              </div>
              <p className="text-xs text-gray-600 leading-snug">{text}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-700 mb-5">Registration Details</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label="Full Name" icon={User} error={errors.name?.[0]}>
              <input
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent placeholder-gray-300"
                required
              />
            </InputField>

            <InputField label="Mobile Number" icon={Phone} error={errors.phone?.[0]}>
              <span className="text-sm text-gray-400 shrink-0">+91</span>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="flex-1 text-sm outline-none bg-transparent placeholder-gray-300"
                inputMode="numeric"
                required
              />
            </InputField>

            <InputField label="Village Name" icon={MapPin} error={errors.village?.[0]}>
              <input
                type="text"
                placeholder="Name of your village"
                value={form.village}
                onChange={(e) => set("village", e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent placeholder-gray-300"
                required
              />
            </InputField>

            <InputField label="PIN Code" icon={Hash} error={errors.pinCode?.[0]}>
              <input
                type="text"
                placeholder="6-digit PIN code"
                value={form.pinCode}
                onChange={(e) => set("pinCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="flex-1 text-sm outline-none bg-transparent placeholder-gray-300"
                inputMode="numeric"
                required
              />
            </InputField>

            <InputField label="District" icon={Building2} error={errors.district?.[0]}>
              <input
                type="text"
                placeholder="Your district"
                value={form.district}
                onChange={(e) => set("district", e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent placeholder-gray-300"
                required
              />
            </InputField>

            <InputField label="State" icon={Map} error={errors.state?.[0]}>
              <select
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent text-gray-700 cursor-pointer"
                required
              >
                <option value="" disabled>Select your state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </InputField>

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs text-red-600">{serverError}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-green text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Registering...
                  </span>
                ) : (
                  <>
                    Register as Village Partner
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400">
              By registering, you agree to represent GraaminGo honestly in your community.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
