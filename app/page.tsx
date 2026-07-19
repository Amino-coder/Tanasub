"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Sparkles, UserX, Lock, Shield, Heart, ArrowRight, Copy, Share2, Check } from "lucide-react";
import { TR } from "@/lib/questions";
import { Mark, PrimaryButton, GhostButton, LangToggle } from "@/lib/ui";

export default function LandingPage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const t = TR[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function startSession() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/session/create", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.code) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        return;
      }
      setCode(data.code);
    } catch {
      setErrorMsg("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const link = code ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${code}` : "";

  return (
    <div dir={dir} className="grain mesh min-h-screen font-body" style={{ color: "#241C2C" }}>
      <LangToggle lang={lang} setLang={setLang} label={t.langToggle} />

      <div className="relative overflow-hidden min-h-screen">
        <div className="blob-a absolute -top-10 -start-16 w-56 h-56 rounded-full blur-3xl opacity-40" style={{ background: "#E76F51" }} />
        <div className="blob-b absolute top-40 -end-20 w-64 h-64 rounded-full blur-3xl opacity-30" style={{ background: "#6B9080" }} />
        <div className="blob-a absolute bottom-0 start-1/3 w-48 h-48 rounded-full blur-3xl opacity-25" style={{ background: "#F4A261" }} />

        {!code ? (
          <div className="relative max-w-xl mx-auto px-6 pt-16 pb-24">
            <div className="flex items-center gap-2.5 mb-14 justify-center">
              <Mark size={32} />
              <span className="font-display text-2xl tracking-tight">{t.logo}</span>
            </div>

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-6 border"
                style={{ background: "rgba(244,162,97,0.18)", color: "#8A4E26", borderColor: "rgba(244,162,97,0.35)" }}>
                <Sparkles size={13} /> {t.heroBadge}
              </div>
              <h1 className="font-display text-[2.5rem] sm:text-[3rem] leading-[1.1] tracking-tight mb-5">
                {t.heroTitle1}{" "}
                <em className="not-italic relative inline-block" style={{ color: "#E76F51" }}>
                  {t.heroTitleEm}
                  <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                    <path d="M0 5 Q 25 0, 50 5 T 100 5" stroke="#F4A261" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </svg>
                </em>{t.heroTitle2 ? ` ${t.heroTitle2}` : ""}
              </h1>
              <p className="text-[17px] leading-relaxed max-w-md mx-auto" style={{ color: "#5B5065" }}>
                {t.heroSub}
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 mb-14">
              <PrimaryButton onClick={startSession} disabled={loading} className="px-8 py-4 text-base">
                {loading ? "..." : t.startSession} <ArrowRight size={17} className="rtl:rotate-180" />
              </PrimaryButton>
              {errorMsg && (
                <p className="text-sm text-center max-w-xs" style={{ color: "#C2451D" }}>{errorMsg}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[[UserX, t.noAccount], [Lock, t.noContact], [Shield, t.anonymous], [Heart, t.private]].map(([Icon, label]: any, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-2xl px-4 py-3.5 bg-white/75 backdrop-blur border shadow-sm hover:-translate-y-0.5 transition-transform" style={{ borderColor: "#EAD9C8" }}>
                  <Icon size={17} style={{ color: "#2F4858" }} />
                  <span className="text-[13.5px] font-medium">{label}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-xs mt-10" style={{ color: "#9A8FA0" }}>{t.footerPrivacy}</p>
          </div>
        ) : (
          <div className="relative max-w-xl mx-auto px-6 pt-14 pb-24 rise">
            <div className="flex items-center gap-2.5 mb-10">
              <Mark size={28} /><span className="font-display text-xl tracking-tight">{t.logo}</span>
            </div>
            <h2 className="font-display text-3xl mb-2">{t.createTitle}</h2>
            <p className="text-[15px] mb-10" style={{ color: "#5B5065" }}>{t.createSub}</p>

            <div className="rounded-3xl p-6 bg-white/90 backdrop-blur border shadow-[0_20px_50px_-24px_rgba(47,72,88,0.35)] mb-4 relative overflow-hidden" style={{ borderColor: "#EAD9C8" }}>
              <div className="absolute -top-10 -end-10 w-28 h-28 rounded-full opacity-20" style={{ background: "#E76F51" }} />
              <p className="text-xs font-semibold uppercase tracking-wide mb-2 relative" style={{ color: "#9A8FA0" }}>{t.codeLabel}</p>
              <p className="font-display text-4xl tracking-[0.2em] mb-4 relative" style={{ background: "linear-gradient(135deg,#2F4858,#E76F51)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{code}</p>
              <div className="flex items-center justify-between rounded-xl px-4 py-3 mb-4 relative gap-3" style={{ background: "#FBF4EC" }}>
                <span className="text-sm truncate" style={{ color: "#5B5065" }}>{link}</span>
                <button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="text-xs font-semibold flex items-center gap-1 shrink-0" style={{ color: "#2F4858" }}>
                  {copied ? <Check size={14} className="pop" /> : <Copy size={14} />} {copied ? t.copied : t.copy}
                </button>
              </div>
              <a href={`https://wa.me/?text=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer" className="block">
                <GhostButton className="w-full relative">
                  <Share2 size={15} /> {t.shareWhatsapp}
                </GhostButton>
              </a>
            </div>

            <PrimaryButton onClick={() => router.push(`/s/${code}?lang=${lang}`)} className="w-full">
              {t.continue} <ArrowRight size={16} className="rtl:rotate-180" />
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}
