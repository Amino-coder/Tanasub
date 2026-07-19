"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Sparkles, UserX, Lock, Shield, Heart, ArrowRight } from "lucide-react";
import { TR } from "@/lib/questions";
import { Mark, PrimaryButton, LangToggle } from "@/lib/ui";

export default function LandingPage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [loading, setLoading] = useState(false);
  const t = TR[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const router = useRouter();

  async function startSession() {
    setLoading(true);
    const res = await fetch("/api/session/create", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (data.code) router.push(`/s/${data.code}?lang=${lang}`);
  }

  return (
    <div dir={dir} className="grain mesh min-h-screen font-body" style={{ color: "#241C2C" }}>
      <LangToggle lang={lang} setLang={setLang} label={t.langToggle} />

      <div className="relative overflow-hidden">
        <div className="blob-a absolute -top-10 -start-16 w-56 h-56 rounded-full blur-3xl opacity-40" style={{ background: "#E76F51" }} />
        <div className="blob-b absolute top-40 -end-20 w-64 h-64 rounded-full blur-3xl opacity-30" style={{ background: "#6B9080" }} />
        <div className="blob-a absolute bottom-0 start-1/3 w-48 h-48 rounded-full blur-3xl opacity-25" style={{ background: "#F4A261" }} />

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

          <div className="flex justify-center mb-14">
            <PrimaryButton onClick={startSession} disabled={loading} className="px-8 py-4 text-base">
              {loading ? "..." : t.startSession} <ArrowRight size={17} className="rtl:rotate-180" />
            </PrimaryButton>
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
      </div>
    </div>
  );
}
