"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Heart, Lock, ArrowRight, ArrowLeft, MessageCircle, Sparkles, Home, Download } from "lucide-react";
import { TR, QUESTIONS } from "@/lib/questions";
import { buildResults } from "@/lib/results";
import {
  Mark, PrimaryButton, LangToggle, Stepper, Reveal, Confetti, Check,
  SECTION_COLORS,
} from "@/lib/ui";

type Answers = Record<string, any>;

function useLocalKey(code: string) {
  return `together_pid_${code}`;
}

export default function SessionPage({ params }: { params: { code: string } }) {
  const code = params.code;
  const search = useSearchParams();
  const [lang, setLang] = useState<"ar" | "en">((search.get("lang") as "ar" | "en") || "ar");
  const t = TR[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const pidKey = useLocalKey(code);

  const [stage, setStage] = useState<"loading" | "nickname" | "quiz" | "waiting" | "results" | "full" | "notfound">("loading");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [qIndex, setQIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [results, setResults] = useState<any>(null);
  const pollRef = useRef<any>(null);

  const [submitError, setSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const savedPid = typeof window !== "undefined" ? localStorage.getItem(pidKey) : null;
    if (savedPid) { setParticipantId(savedPid); checkStatus(savedPid); }
    else setStage("nickname");
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Used only to resume a session (e.g. after a page reload) or to poll
  // for the OTHER participant finishing -- never to re-derive whether
  // *I* just finished, since that's already known locally on submit.
  async function checkStatus(pid: string) {
    const res = await fetch(`/api/session/${code}`);
    if (!res.ok) { setStage("notfound"); return; }
    const data = await res.json();
    const a = data.participants.A, b = data.participants.B;
    const savedRole = localStorage.getItem(pidKey + "_role") as "A" | "B" | null;
    const myRecord = savedRole === "A" ? a : b;

    if (data.bothDone && a && b) {
      showResults(a, b);
    } else if (myRecord?.completed) {
      setStage("waiting");
      startPolling(pid);
    } else {
      setStage("quiz");
    }
  }

  function showResults(a: any, b: any) {
    const nA = a.nickname || t.youAre;
    const nB = b.nickname || t.personB;
    const res2 = buildResults(a.answers, b.answers, nA, nB, lang);
    setResults({ ...res2, nameA: nA, nameB: nB });
    setStage("results");
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2300);
  }

  function startPolling(pid: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/session/${code}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.bothDone && data.participants.A && data.participants.B) {
        clearInterval(pollRef.current);
        showResults(data.participants.A, data.participants.B);
      }
    }, 3000);
  }

  async function joinSession() {
    if (!nickname.trim() || joining) return;
    setJoining(true);
    try {
      const res = await fetch("/api/participant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, nickname: nickname.trim() }),
      });
      if (!res.ok) { setStage("full"); return; }
      const data = await res.json();
      localStorage.setItem(pidKey, data.participantId);
      localStorage.setItem(pidKey + "_role", data.role);
      setParticipantId(data.participantId);
      setStage("quiz");
    } finally {
      setJoining(false);
    }
  }

  // Lets the person who just finished hand the device to the other
  // participant right away, instead of only sharing the link.
  function handOffDevice() {
    if (pollRef.current) clearInterval(pollRef.current);
    localStorage.removeItem(pidKey);
    localStorage.removeItem(pidKey + "_role");
    setParticipantId(null);
    setAnswers({});
    setQIndex(0);
    setNickname("");
    setStage("nickname");
  }

  async function submitFinalAnswers(next: Answers) {
    setSubmitting(true);
    setSubmitError(false);
    try {
      const res = await fetch("/api/answers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, answers: next, completed: true }),
      });
      if (!res.ok) throw new Error("save failed");
      setSubmitting(false);
      setStage("waiting");
      if (participantId) startPolling(participantId);
    } catch {
      setSubmitting(false);
      setSubmitError(true);
    }
  }

  async function answerAndAdvance(val: any) {
    const q = QUESTIONS[qIndex];
    const next = { ...answers, [q.id]: val };
    setAnswers(next);
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      if (qIndex < QUESTIONS.length - 1) {
        setQIndex(i => i + 1);
      } else {
        submitFinalAnswers(next);
      }
    }, 190);
  }

  const q = QUESTIONS[qIndex];
  const sectionColor = q ? SECTION_COLORS[q.section] : "#2F4858";

  return (
    <div dir={dir} className="grain mesh min-h-screen w-full font-body" style={{ color: "#241C2C" }}>
      {confetti && <Confetti />}
      <LangToggle lang={lang} setLang={setLang} label={t.langToggle} />

      {stage === "loading" && <Centered>···</Centered>}
      {stage === "notfound" && <Centered>{lang === "ar" ? "الجلسة غير موجودة." : "Session not found."}</Centered>}
      {stage === "full" && <Centered>{lang === "ar" ? "هذه الجلسة مكتملة بشخصين." : "This session already has two participants."}</Centered>}

      {stage === "nickname" && (
        <div className="max-w-xl mx-auto px-6 pt-24 pb-24 rise">
          <a href="/" className="flex items-center gap-2 mb-10 w-fit">
            <Mark size={26} /><span className="font-display text-lg">{t.logo}</span>
          </a>
          <h2 className="font-display text-3xl mb-3">{t.whatCallYou}</h2>
          <p className="text-[15px] mb-8" style={{ color: "#5B5065" }}>{t.nicknameSub}</p>
          <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder={t.nicknamePlaceholder} autoFocus
            className="w-full rounded-2xl px-5 py-4 text-lg mb-8 border-2 outline-none focus:border-[#2F4858] bg-white/90"
            style={{ borderColor: "#EAD9C8" }} />
          <PrimaryButton onClick={joinSession} disabled={!nickname.trim() || joining} className="w-full">
            {joining ? "..." : t.begin} <ArrowRight size={16} className="rtl:rotate-180" />
          </PrimaryButton>
        </div>
      )}

      {stage === "quiz" && q && (
        <div className="relative overflow-hidden min-h-screen">
          <div className="blob-a absolute top-10 -end-16 w-48 h-48 rounded-full blur-3xl opacity-[0.12]" style={{ background: sectionColor }} />
          <div className="max-w-xl mx-auto px-6 pt-8 pb-24 min-h-screen flex flex-col relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setQIndex(i => Math.max(0, i - 1))} disabled={qIndex === 0} className="disabled:opacity-0" style={{ color: "#9A8FA0" }}>
                  <ArrowLeft size={18} className="rtl:rotate-180" />
                </button>
                <a href="/" style={{ color: "#9A8FA0" }}><Home size={16} /></a>
              </div>
              <span className="text-xs font-semibold" style={{ color: "#9A8FA0" }}>{qIndex + 1} / {QUESTIONS.length}</span>
            </div>
            <Stepper qIndex={qIndex} />
            <div className="flex-1 flex flex-col justify-center mt-10">
              <div key={q.id} className={leaving ? "card-out" : "card-in"}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3 inline-flex items-center gap-1.5" style={{ color: sectionColor }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sectionColor }} />
                  {t.sectionLabels[q.section]}
                </p>
                <h2 className="font-display text-2xl sm:text-[1.75rem] leading-snug mb-8">
                  {lang === "ar" ? q.prompt_ar : q.prompt}
                </h2>
                {q.type === "text" ? (
                  <TextAnswer t={t} onAnswer={answerAndAdvance} isLast={qIndex === QUESTIONS.length - 1} />
                ) : (
                  <div className="space-y-3">
                    {q.options!.map((opt: any, i: number) => {
                      const isSel = answers[q.id] === i;
                      return (
                        <button key={i} onClick={() => answerAndAdvance(i)}
                          className={`w-full text-start rounded-2xl px-5 py-4 text-[15px] font-medium border-2 transition-all hover:-translate-y-0.5 hover:shadow-md flex items-center justify-between gap-3 ${isSel ? "pop" : ""}`}
                          style={{ borderColor: isSel ? sectionColor : "#EAD9C8", background: isSel ? sectionColor : "white", color: isSel ? "white" : "#241C2C" }}>
                          <span>{lang === "ar" ? opt.label_ar : opt.label}</span>
                          {isSel && <Check size={16} />}
                        </button>
                      );
                    })}
                  </div>
                )}
                {qIndex === QUESTIONS.length - 1 && submitting && (
                  <p className="text-center text-sm mt-5" style={{ color: "#9A8FA0" }}>
                    {lang === "ar" ? "جارٍ الحفظ..." : "Saving..."}
                  </p>
                )}
                {qIndex === QUESTIONS.length - 1 && submitError && (
                  <div className="mt-5 rounded-2xl px-4 py-3.5 border-2 text-center" style={{ borderColor: "#E76F51", background: "#FBE3DC" }}>
                    <p className="text-sm mb-3" style={{ color: "#7A2E1D" }}>
                      {lang === "ar" ? "تعذر حفظ إجاباتك. تحقق من الاتصال وحاول مرة أخرى." : "Couldn't save your answers. Check your connection and try again."}
                    </p>
                    <PrimaryButton onClick={() => submitFinalAnswers(answers)} className="w-full">
                      {lang === "ar" ? "إعادة المحاولة" : "Try again"}
                    </PrimaryButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === "waiting" && (
        <div className="max-w-xl mx-auto px-6 pt-24 pb-24 text-center relative overflow-hidden">
          <div className="blob-a absolute top-0 start-1/4 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: "#E76F51" }} />
          <div className="relative">
            <div className="w-16 h-16 rounded-full mx-auto mb-8 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F4A261,#E76F51)" }}>
              <Heart className="animate-pulse text-white" size={26} />
            </div>
            <h2 className="font-display text-3xl mb-3">{t.doneTitle}</h2>
            <p className="text-[15px] mb-4 whitespace-pre-line" style={{ color: "#5B5065" }}>
              {lang === "ar" ? "بانتظار الطرف الثاني لإنهاء الأسئلة. سيتحدث هذا تلقائيًا." : "Waiting for the other person to finish. This will update automatically."}
            </p>
            <div className="rounded-xl px-4 py-3 inline-flex items-center gap-2 text-xs font-semibold mb-8" style={{ background: "#E4EDEB", color: "#2F4858" }}>
              <Lock size={13} /> {t.footerNote}
            </div>
            <div className="border-t pt-6" style={{ borderColor: "#EAD9C8" }}>
              <p className="text-sm mb-4" style={{ color: "#5B5065" }}>
                {lang === "ar" ? "الشخص الثاني يجيب من نفس الجهاز؟" : "Is the other person answering from this device?"}
              </p>
              <PrimaryButton onClick={handOffDevice} className="w-full mb-3">
                {lang === "ar" ? "تسليم الجهاز الآن" : "Hand off this device now"}
              </PrimaryButton>
              <a href="/" className="text-xs font-semibold underline" style={{ color: "#9A8FA0" }}>
                {lang === "ar" ? "العودة للصفحة الرئيسية" : "Back to home"}
              </a>
            </div>
          </div>
        </div>
      )}

      {stage === "results" && results && (
        <ResultsView t={t} lang={lang} nameA={results.nameA} nameB={results.nameB} results={results} />
      )}
    </div>
  );
}

function Centered({ children }: any) {
  return <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: "#5B5065" }}>{children}</div>;
}

function TextAnswer({ t, onAnswer, isLast }: any) {
  const [text, setText] = useState("");
  return (
    <div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={4} autoFocus
        className="w-full rounded-2xl px-5 py-4 text-[15px] border-2 outline-none focus:border-[#2F4858] resize-none mb-5 bg-white/90"
        style={{ borderColor: "#EAD9C8" }} placeholder={t.textPlaceholder} />
      <PrimaryButton onClick={() => onAnswer(text.trim() || "—")} className="w-full">
        {isLast ? t.finish : t.next} <ArrowRight size={16} className="rtl:rotate-180" />
      </PrimaryButton>
    </div>
  );
}

function TraitPill({ label, color }: { label: string; color: string }) {
  return <span className="inline-block rounded-full px-3.5 py-1.5 text-[13px] font-semibold m-1 border" style={{ background: `${color}18`, color, borderColor: `${color}35` }}>{label}</span>;
}

function ThreadDivider({ labelA, labelB }: any) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10 opacity-80">
      <span className="text-[11px] font-semibold" style={{ color: "#9A8FA0" }}>{labelA}</span>
      <svg width="70" height="14" viewBox="0 0 70 14">
        <path className="thread-draw" d="M2 7 Q 18 0, 35 7 T 68 7" stroke="#E76F51" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <span className="text-[11px] font-semibold" style={{ color: "#9A8FA0" }}>{labelB}</span>
    </div>
  );
}

function Section({ title, icon: Icon, tint, iconColor, children, delay }: any) {
  return (
    <Reveal delay={delay}>
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: tint }}>
            <Icon size={16} style={{ color: iconColor }} />
          </div>
          <h3 className="font-display text-xl">{title}</h3>
        </div>
        {children}
      </div>
    </Reveal>
  );
}

function ResultsView({ t, lang, nameA, nameB, results }: any) {
  const { traitsA, traitsB, similarities, topics, starters, greenFlags } = results;
  return (
    <div className="relative overflow-hidden">
      <div className="blob-a absolute top-0 -start-20 w-56 h-56 rounded-full blur-3xl opacity-[0.14] print:hidden" style={{ background: "#6B9080" }} />
      <div className="blob-b absolute top-96 -end-20 w-56 h-56 rounded-full blur-3xl opacity-[0.14] print:hidden" style={{ background: "#E76F51" }} />
      <div className="relative max-w-2xl mx-auto px-6 pt-14 pb-28" id="results-printable">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <a href="/" className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#9A8FA0" }}>
            <Home size={15} /> {lang === "ar" ? "الرئيسية" : "Home"}
          </a>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm font-semibold rounded-full px-3.5 py-1.5 border" style={{ color: "#2F4858", borderColor: "#EAD9C8" }}>
            <Download size={15} /> {lang === "ar" ? "تحميل النتيجة" : "Download"}
          </button>
        </div>
        <div className="text-center mb-12 rise">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#9A8FA0" }}>{t.reportUnlocked}</p>
          <h1 className="font-display text-3xl mb-2">{nameA} &amp; {nameB}</h1>
          <p className="text-[15px]" style={{ color: "#5B5065" }}>{t.reportSub}</p>
        </div>

        <ThreadDivider labelA={nameA} labelB={nameB} />

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {[[nameA, traitsA, "#2F4858"], [nameB, traitsB, "#E76F51"]].map(([name, traits, accent]: any, i: number) => (
            <div key={i} className="rounded-3xl p-5 bg-white/90 backdrop-blur border shadow-[0_16px_40px_-24px_rgba(47,72,88,0.4)] relative overflow-hidden" style={{ borderColor: "#EAD9C8" }}>
              <div className="absolute -top-8 -end-8 w-24 h-24 rounded-full opacity-[0.14]" style={{ background: accent }} />
              <p className="font-display text-lg mb-3 relative">{name}</p>
              <div className="flex flex-wrap -m-1 relative">{traits.map((tr: string, j: number) => <TraitPill key={j} label={tr} color={accent} />)}</div>
            </div>
          ))}
        </div>

        <Section title={t.inCommon} icon={Heart} tint="#FCE9DD" iconColor="#C2451D" delay={0}>
          <ul className="space-y-2.5">{similarities.map((s: string, i: number) => <li key={i} className="text-[14.5px] leading-relaxed flex gap-2" style={{ color: "#4A4152" }}><span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#E76F51" }} />{s}</li>)}</ul>
        </Section>

        <Section title={t.topicsTitle} icon={MessageCircle} tint="#E4EDEB" iconColor="#2F4858" delay={80}>
          <div className="space-y-3">
            {topics.map((tp: any, i: number) => (
              <div key={i} className="rounded-2xl p-4 bg-white/90 backdrop-blur border shadow-sm" style={{ borderColor: "#EAD9C8" }}>
                <p className="text-sm font-semibold mb-2">{tp.title}</p>
                <div className="flex gap-2 flex-wrap text-[13px]">
                  <span className="rounded-full px-3 py-1" style={{ background: "#FBF4EC" }}>{nameA}: {tp.a}</span>
                  <span className="rounded-full px-3 py-1" style={{ background: "#FBF4EC" }}>{nameB}: {tp.b}</span>
                </div>
              </div>
            ))}
            {!topics.length && <p className="text-sm" style={{ color: "#9A8FA0" }}>{t.topicsEmpty}</p>}
          </div>
        </Section>

        <Section title={t.startersTitle} icon={Sparkles} tint="#FBE3DC" iconColor="#C2624C" delay={160}>
          <div className="space-y-3">{starters.map((s: string, i: number) => <div key={i} className="rounded-2xl px-4 py-3.5 border-l-4" style={{ background: "#FBF0EB", borderColor: "#E76F51" }}><p className="text-[14.5px] leading-relaxed" style={{ color: "#4A2E27" }}>{s}</p></div>)}</div>
        </Section>

        <Section title={t.greenFlagsTitle} icon={Check} tint="#E1EEE6" iconColor="#2F6B45" delay={240}>
          <ul className="space-y-2.5">{greenFlags.map((g: string, i: number) => <li key={i} className="text-[14.5px] leading-relaxed flex gap-2" style={{ color: "#4A4152" }}><span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#6B9080" }} />{g}</li>)}</ul>
        </Section>

        <p className="text-center text-xs mt-14" style={{ color: "#C9BFC9" }}>{t.footerNote}</p>
      </div>
    </div>
  );
}
