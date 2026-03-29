"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Phone, AlertTriangle, ArrowLeft, Car, Bike } from "lucide-react";

// ── DUMMY AUTH ─────────────────────────────────────────────────────────────────
// Accepts any phone number. OTP is always "1234".
// ──────────────────────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDriver = searchParams.get("driver") === "1";

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendOTP = async () => {
    if (phone.replace(/\s/g, "").length < 6) {
      setError("Enter a valid phone number");
      return;
    }
    setLoading(true);
    setError("");
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setStep("otp");
  };

  const verifyOTP = async () => {
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      phone,
      otp,
      redirect: false,
    });
    if (!result?.ok) {
      setError(otp !== "1234" ? "Wrong OTP. Use 1234 to test." : "Login failed. Try again.");
      setLoading(false);
      return;
    }
    setLoading(false);
    router.push(isDriver ? "/dashboard" : "/book");
  };

  return (
    <main className="min-h-screen bg-gradient-earth flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-100 rounded-full -translate-y-2/3 blur-3xl opacity-50 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8 animate-fade-down">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-glow-green shadow-card-md mb-3 overflow-hidden bg-white">
            <Image src="/logo.png" alt="Graamin Go" width={80} height={80} className="object-contain w-full h-full" />
          </div>
          <h1 className="text-2xl font-bold text-brand-600">Graamin Go</h1>
          <p className="text-brand-400 text-sm font-hindi font-semibold mt-0.5">ग्रामीण गो</p>
        </div>

        {/* Role badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold ${isDriver ? "bg-brand-green-pale text-brand-green" : "bg-saffron-50 text-saffron-700"}`}>
          {isDriver ? <Bike size={14} /> : <Car size={14} />}
          {isDriver ? "Driver Login" : "Passenger Login"}
        </div>

        {/* Card */}
        <div className="w-full max-w-sm animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="glass rounded-3xl p-6 shadow-card-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {step === "phone" ? (isDriver ? "Driver Login" : "Book Your Ride") : "Enter OTP"}
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {step === "phone"
                ? "Just your phone number — no password needed"
                : `6-digit code sent to ${phone}`}
            </p>

            {step === "phone" ? (
              <>
                <div className={`flex items-center gap-3 border-2 rounded-2xl px-4 py-3.5 mb-4 transition-all ${
                  error ? "border-danger-300 bg-danger-50" : "border-earth-200 bg-white focus-within:border-brand-400"
                }`}>
                  <Phone size={17} className="text-gray-400 shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(""); }}
                    placeholder="+91 XXXXX XXXXX"
                    className="flex-1 text-base outline-none bg-transparent text-gray-700 placeholder-gray-300 font-medium"
                    onKeyDown={(e) => e.key === "Enter" && sendOTP()}
                    autoFocus
                  />
                </div>

                {/* Test hint */}
                <p className="text-xs text-saffron-600 bg-saffron-50 rounded-xl px-3 py-2 mb-4">
                  Test mode: enter any number, use OTP <strong>1234</strong>
                </p>

                {error && (
                  <p className="text-danger-600 text-xs font-medium mb-4 pl-1 flex items-center gap-1 animate-fade-in">
                    <AlertTriangle size={12} /> {error}
                  </p>
                )}

                <button
                  onClick={sendOTP}
                  disabled={loading || !phone}
                  className="w-full bg-gradient-brand text-white py-4 rounded-2xl font-bold text-base shadow-glow-green shadow-card-md btn-press transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending OTP...
                    </span>
                  ) : "Get OTP →"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                  className="flex items-center gap-1 text-brand-500 text-sm font-medium mb-4 -mt-2 btn-press"
                >
                  <ArrowLeft size={14} /> Change number
                </button>

                {/* Test hint */}
                <p className="text-xs text-saffron-600 bg-saffron-50 rounded-xl px-3 py-2 mb-4">
                  Test OTP is <strong>1234</strong>
                </p>

                {/* OTP boxes — visual display driven by the real input below */}
                <div
                  className="flex gap-2 justify-center mb-3 cursor-text"
                  onClick={() => document.getElementById("otp-input")?.focus()}
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-14 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all select-none ${
                        otp[i]
                          ? "border-brand-400 bg-brand-50 text-brand-600"
                          : i === otp.length
                          ? "border-brand-300 bg-white text-transparent animate-pulse"
                          : "border-earth-200 bg-white text-gray-200"
                      }`}
                    >
                      {otp[i] ?? "·"}
                    </div>
                  ))}
                </div>

                {/* Visible but styled input — actually captures keypresses */}
                <input
                  id="otp-input"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && otp.length === 4 && verifyOTP()}
                  autoFocus
                  placeholder="Enter 4-digit OTP"
                  className="w-full text-center text-lg font-bold border-2 border-earth-200 rounded-2xl px-4 py-3 mb-4 outline-none focus:border-brand-400 bg-white tracking-[0.5em]"
                />

                {error && (
                  <p className="text-danger-600 text-xs font-medium mb-4 pl-1 flex items-center gap-1 animate-fade-in">
                    <AlertTriangle size={12} /> {error}
                  </p>
                )}

                <button
                  onClick={verifyOTP}
                  disabled={loading || otp.length !== 4}
                  className="w-full bg-gradient-brand text-white py-4 rounded-2xl font-bold text-base shadow-glow-green shadow-card-md btn-press transition-all disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Confirm & Login →"}
                </button>

                <button
                  onClick={sendOTP}
                  disabled={loading}
                  className="w-full text-brand-500 text-sm font-semibold mt-3 py-2 btn-press"
                >
                  Resend OTP
                </button>
              </>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            No account needed · No password ·{" "}
            {isDriver ? (
              <Link href="/login" className="text-brand-500 font-semibold">Book as passenger →</Link>
            ) : (
              <Link href="/login?driver=1" className="text-brand-500 font-semibold">Login as driver →</Link>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
