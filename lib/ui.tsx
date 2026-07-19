"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { QUESTIONS } from "./questions";

export const SECTION_ORDER = ["personality", "lifestyle", "values", "fun", "short"];
export const SECTION_COLORS: Record<string, string> = {
  personality: "#E76F51", lifestyle: "#F4A261", values: "#2F4858", fun: "#6B9080", short: "#9B6A9C",
};

export function Mark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="markGrad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#E76F51" />
          <stop offset="100%" stopColor="#2F4858" />
        </linearGradient>
      </defs>
      <path d="M4 12c0-4.4 3.6-8 8-8h8c4.4 0 8 3.6 8 8v4c0 4.4-3.6 8-8 8h-3l-5 5v-5h0c-4.4 0-8-3.6-8-8v-4z" fill="url(#markGrad)" opacity="0.92"/>
      <circle cx="27" cy="26" r="9" fill="#F4A261" opacity="0.9"/>
    </svg>
  );
}

export function PrimaryButton({ children, onClick, disabled, className = "" }: any) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`font-body inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-[0_10px_28px_-10px_rgba(47,72,88,0.55)] ${className}`}
      style={{ background: "linear-gradient(135deg,#2F4858,#3D5A6C)" }}>
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }: any) {
  return (
    <button onClick={onClick}
      className={`font-body inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[15px] font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 border-2 ${className}`}
      style={{ borderColor: "#2F4858", color: "#2F4858" }}>
      {children}
    </button>
  );
}

export function LangToggle({ lang, setLang, label }: any) {
  return (
    <button onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="fixed top-4 end-4 z-40 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold bg-white/85 backdrop-blur border shadow-sm hover:-translate-y-0.5 transition-transform"
      style={{ borderColor: "#EAD9C8", color: "#2F4858" }}>
      <Globe size={13} /> {label}
    </button>
  );
}

export function Stepper({ qIndex }: { qIndex: number }) {
  const q = QUESTIONS[qIndex];
  return (
    <div className="flex items-center gap-1.5">
      {SECTION_ORDER.map(sec => {
        const secQs = QUESTIONS.filter((qq: any) => qq.section === sec);
        const secStartIdx = QUESTIONS.findIndex((qq: any) => qq.section === sec);
        const secEndIdx = secStartIdx + secQs.length;
        const isActive = q.section === sec;
        const isDone = qIndex >= secEndIdx;
        const progressWithin = isActive ? (qIndex - secStartIdx + 1) / secQs.length : isDone ? 1 : 0;
        return (
          <div key={sec} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#E9DFD6" }}>
            <div className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressWithin * 100}%`, background: SECTION_COLORS[sec] }} />
          </div>
        );
      })}
    </div>
  );
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible] as const;
}

export function Reveal({ children, delay = 0 }: any) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={visible ? "rise" : "opacity-0"} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function ConfettiPiece({ color, shape }: { color: string; shape: string }) {
  if (shape === "circle") return <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />;
  if (shape === "heart") return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={color}><path d="M12 21s-7-4.6-9.6-8.6C.6 9 1.6 5.4 5 4.4c2-.6 4 .3 5 2 1-1.7 3-2.6 5-2 3.4 1 4.4 4.6 2.6 8C19 16.4 12 21 12 21z"/></svg>
  );
  return <div style={{ width: 9, height: 9, background: color }} />;
}

export function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 44 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 0.6,
    color: ["#E76F51", "#2F4858", "#F4A261", "#6B9080"][i % 4],
    shape: ["circle", "square", "heart"][i % 3],
    rotate: Math.random() * 360,
  })), []);
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} style={{ position: "absolute", left: `${p.left}%`, top: "-5%", animation: `fall 1.9s ease-in ${p.delay}s forwards`, transform: `rotate(${p.rotate}deg)` }}>
          <ConfettiPiece color={p.color} shape={p.shape} />
        </div>
      ))}
    </div>
  );
}

export { Check };
