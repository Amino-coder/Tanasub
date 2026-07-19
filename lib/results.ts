// Rule-based (no AI) results generation, ported from the prototype.
import { QUESTIONS } from './questions';

export const TRAIT_TR = {
  Calm: "هادئ", Curious: "فضولي", Independent: "مستقل", Reliable: "يُعتمد عليه", Warm: "دافئ",
  Planner: "منظّم", Adventurous: "مغامر", "Family-oriented": "عائلي", Thoughtful: "متأمل",
  "Goal-driven": "طموح", Social: "اجتماعي", Selective: "انتقائي",
};
export const PERSONALITY_TAGS = new Set(Object.keys(TRAIT_TR));

function traitCounts(answers: Record<string, any>): Record<string, number> {
  const counts: Record<string, number> = {};
  QUESTIONS.forEach((q: any) => {
    if (q.type === "text") return;
    const val = answers[q.id];
    if (val == null) return;
    const opt = q.options[val];
    opt.tags.forEach((t: string) => { counts[t] = (counts[t] || 0) + 1; });
  });
  return counts;
}
function topTraits(counts: Record<string, number>, n = 5): string[] {
  return Object.entries(counts)
    .filter(([t]) => PERSONALITY_TAGS.has(t))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([t]) => t);
}
function traitLabel(t: string, lang: string) { return lang === "ar" ? (TRAIT_TR as Record<string,string>)[t] : t; }
function optLabel(qId: string, answers: Record<string, any>, lang: string) {
  const q = QUESTIONS.find(q => q.id === qId);
  const val = answers[q.id];
  if (val == null) return null;
  const opt = q.options[val];
  return lang === "ar" ? opt.label_ar : opt.label;
}
function qPrompt(qId: string, lang: string) {
  const q = QUESTIONS.find(q => q.id === qId);
  return lang === "ar" ? q.prompt_ar : q.prompt;
}

export const TOPIC_QUESTIONS = ["l3","l4","l5","l6","v1","v2","v3","v4","v5"];

export function buildResults(a: Record<string, any>, b: Record<string, any>, nameA: string, nameB: string, lang: string) {
  const traitsA = topTraits(traitCounts(a)).map(t => traitLabel(t, lang));
  const traitsB = topTraits(traitCounts(b)).map(t => traitLabel(t, lang));
  const rawTraitsA = topTraits(traitCounts(a));
  const rawTraitsB = topTraits(traitCounts(b));
  const sharedRaw = rawTraitsA.filter(t => rawTraitsB.includes(t));

  const similarities: string[] = [];
  TOPIC_QUESTIONS.concat(["f1","f2"]).forEach(qId => {
    if (a[qId] === b[qId] && a[qId] != null) {
      similarities.push(lang === "ar"
        ? `${nameA} و${nameB} اتفقتما على "${optLabel(qId, a, lang)}" بخصوص ${qPrompt(qId, lang)}`
        : `${nameA} and ${nameB} both leaned toward "${optLabel(qId, a, lang)}" on ${qPrompt(qId, lang).toLowerCase()}`);
    }
  });
  if (sharedRaw.length) {
    const list = sharedRaw.slice(0,3).map(t => traitLabel(t, lang));
    similarities.unshift(lang === "ar"
      ? `كلاكما يظهر بصفات ${list.join(" و")}.`
      : `You both come across as ${list.join(" and ").toLowerCase()}.`);
  }

  const topics: { title: string; a: any; b: any }[] = [];
  TOPIC_QUESTIONS.forEach(qId => {
    if (a[qId] != null && b[qId] != null && a[qId] !== b[qId]) {
      topics.push({ title: qPrompt(qId, lang), a: optLabel(qId, a, lang), b: optLabel(qId, b, lang) });
    }
  });

  const starters: string[] = [];
  if (a.f1 != null && b.f1 != null) {
    if (a.f1 === b.f1) {
      starters.push(lang === "ar"
        ? `كلاكما اختار "${optLabel("f1", a, lang)}" كرحلة أحلام — وش أول مكان يخطر ببالكما؟`
        : `You both picked "${optLabel("f1", a, lang)}" as a dream trip — what's the first place that comes to mind for it?`);
    } else {
      starters.push(lang === "ar"
        ? `${nameA} يميل لـ"${optLabel("f1", a, lang)}" و${nameB} يميل لـ"${optLabel("f1", b, lang)}" — وش تكون رحلة تجمع الاثنين؟`
        : `${nameA} leans toward "${optLabel("f1", a, lang)}" and ${nameB} toward "${optLabel("f1", b, lang)}" for a dream trip — what would a vacation look like that has a bit of both?`);
    }
  }
  if (a.f2 != null && b.f2 != null && a.f2 !== b.f2) {
    starters.push(lang === "ar"
      ? `تحسّان بالتقدير بطرق مختلفة — ${optLabel("f2", a, lang)} لـ${nameA}، و${optLabel("f2", b, lang)} لـ${nameB}. متى آخر مرة سويتوا هالشي لبعض؟`
      : `You feel appreciated in different ways — ${optLabel("f2", a, lang).toLowerCase()} for ${nameA}, ${optLabel("f2", b, lang).toLowerCase()} for ${nameB}. When was the last time you did that for each other?`);
  }
  if (a.l5 != null && b.l5 != null && a.l5 !== b.l5) {
    starters.push(lang === "ar"
      ? "مكان السكن بالنسبة للعائلة موضوع يستاهل نقاش حقيقي — وش يعني 'قريب' عند كل واحد فيكم؟"
      : "Where you'd live relative to family sounds worth a real conversation — what does 'close' actually mean to each of you?");
  }
  if (a.v1 != null && b.v1 != null) {
    starters.push(a.v1 === b.v1
      ? (lang === "ar" ? "كلاكما يتعامل مع الخلافات بطريقة متشابهة — هل هذا أثّر عليكما يومًا بشكل سلبي؟" : "You both handle disagreements a similar way — has that ever worked against you?")
      : (lang === "ar" ? "تتعاملون مع الخلافات بطرق مختلفة — وش يصير لو كل واحد اتبع أسلوبه الطبيعي؟" : "You handle disagreements differently — what would a fight look like if you both leaned into your natural style?"));
  }
  starters.push(lang === "ar"
    ? `لو عندكم أمسية كاملة بدون جوالات، وش يبغى ${nameA} يسوي؟ وش يبغى ${nameB}؟`
    : `If you had one uninterrupted evening with no phones, what would ${nameA} want to do? What about ${nameB}?`);
  starters.push(lang === "ar"
    ? "وش الشي اللي يخوّفك شوي بموضوع الزواج، وشي تتحمس له؟"
    : "What's one thing about marriage that scares you a little, and one thing you can't wait for?");
  starters.push(lang === "ar"
    ? "وش الشي اللي والديك سووه صح بموضوع الشراكة؟ وش كنت تسوّيه مختلف؟"
    : "What did your parents get right about partnership? What would you do differently?");

  const greenFlags: string[] = [];
  const has = (t: string) => rawTraitsA.includes(t) || rawTraitsB.includes(t);
  if (has("Reliable")) greenFlags.push(lang === "ar" ? "حضور ثابت يُعتمد عليه وقت الصعوبات." : "A steady, dependable presence when things get hard.");
  if (has("Warm")) greenFlags.push(lang === "ar" ? "دفء حقيقي يريح من حوله." : "Genuine warmth that puts people at ease.");
  if (has("Planner")) greenFlags.push(lang === "ar" ? "شخص يفكر مسبقًا فتقل الأمور اللي تفوتكم." : "Someone who thinks ahead, so less falls through the cracks.");
  if (has("Adventurous")) greenFlags.push(lang === "ar" ? "شغف بتجارب جديدة يخلي الحياة مليانة حيوية." : "An appetite for new experiences that keeps things fresh.");
  if (!greenFlags.length) greenFlags.push(lang === "ar" ? "شخصان حضرا وأجابا بصدق — هذا وحده مؤشر جيد." : "Two people who showed up and did this thoughtfully — that itself says something good.");

  return { traitsA, traitsB, similarities: similarities.slice(0,5), topics: topics.slice(0,6), starters: starters.slice(0,8), greenFlags };
}
