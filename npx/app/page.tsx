"use client";

import { useState, useRef, useEffect } from "react";

type TranslationType = {
  badge: string; header: string; sub_header: string; reset: string;
  tone: string; tone_placeholder: string; target: string; target_placeholder: string;
  language: string; text_tab: string; file_tab: string;
  text_placeholder: string; forge_btn: string;
  status_ready: string; status_done: string; status_error: string;
  copy: string; copied: string; pricing_tab: string;
  empty_state: string; pricing_title: string; pricing_sub: string;
  format_label: string;
  plans: Array<{ title: string; price: string; features: string[]; featured?: boolean }>;
};

type SupportedLangs = "Français" | "English" | "Español" | "Deutsch" | "日本語";

const TRANSLATIONS: Record<SupportedLangs, TranslationType> = {
  Français: {
    badge: "STUDIO ÉDITORIAL V1.0", header: "AXIOMOS", sub_header: "FORGE", reset: "RÉINITIALISER",
    tone: "Style", tone_placeholder: "Tranchant, pro...", target: "Audience", target_placeholder: "Investisseurs, X...",
    language: "Langue", text_tab: "Script", file_tab: "Média", text_placeholder: "Déposez votre matière brute ici...",
    forge_btn: "Générer le Signal", status_ready: "Prêt", status_done: "Forge Terminée", status_error: "Erreur",
    copy: "Copier", copied: "Copié !", pricing_tab: "Tarifs", empty_state: "Prêt pour le rendu final",
    format_label: "Formats Studio", pricing_title: "Passez au niveau Pro", pricing_sub: "Débloquez la puissance maximale.",
    plans: [{ title: "Gratuit", price: "0", features: ["5 forges / mois", "Qualité Standard"] }, { title: "Pro", price: "19", features: ["Forges illimitées", "IA Haute Précision"], featured: true }, { title: "Business", price: "49", features: ["3 Utilisateurs", "Marque blanche"] }]
  },
  English: {
    badge: "EDITORIAL STUDIO V1.0", header: "AXIOMOS", sub_header: "FORGE", reset: "RESET",
    tone: "Style", tone_placeholder: "Sharp, pro...", target: "Audience", target_placeholder: "Investors, X...",
    language: "Language", text_tab: "Script", file_tab: "Media", text_placeholder: "Paste your raw material here...",
    forge_btn: "Forge Content", status_ready: "Ready", status_done: "Content Forged", status_error: "Error",
    copy: "Copy", copied: "Copied !", pricing_tab: "Pricing", empty_state: "Ready for final render",
    format_label: "Studio Formats", pricing_title: "Upgrade to Pro", pricing_sub: "Unlock maximum power.",
    plans: [{ title: "Free", price: "0", features: ["5 renders / month", "Standard Quality"] }, { title: "Pro", price: "19", features: ["Unlimited renders", "High Precision AI"], featured: true }, { title: "Business", price: "49", features: ["3 Users", "White label"] }]
  },
  Español: {
    badge: "ESTUDIO EDITORIAL V1.0", header: "AXIOMOS", sub_header: "FORGE", reset: "REINICIAR",
    tone: "Estilo", tone_placeholder: "Afilado, pro...", target: "Audiencia", target_placeholder: "Inversores, X...",
    language: "Idioma", text_tab: "Guión", file_tab: "Medios", text_placeholder: "Pegue su material aquí...",
    forge_btn: "Generar Señal", status_ready: "Listo", status_done: "Forja Completada", status_error: "Error",
    copy: "Copiar", copied: "Copiado", pricing_tab: "Precios", empty_state: "Listo para el render final",
    format_label: "Formatos de Estudio", pricing_title: "Mejora a Pro", pricing_sub: "Desbloquea el poder máximo.",
    plans: [{ title: "Gratis", price: "0", features: ["5 forjas / mes", "Calidad Estándar"] }, { title: "Pro", price: "19", features: ["Forjas ilimitadas", "IA Alta Precisión"], featured: true }, { title: "Business", price: "49", features: ["3 Usuarios", "Marca blanca"] }]
  },
  Deutsch: {
    badge: "REDAKTIONSSTUDIO V1.0", header: "AXIOMOS", sub_header: "FORGE", reset: "ZURÜCKSETZEN",
    tone: "Stil", tone_placeholder: "Scharf, professionell...", target: "Zielgruppe", target_placeholder: "Investoren, X...",
    language: "Sprache", text_tab: "Skript", file_tab: "Medien", text_placeholder: "Rohtext hier einfügen...",
    forge_btn: "Signal generieren", status_ready: "Bereit", status_done: "Schmieden abgeschlossen", status_error: "Fehler",
    copy: "Kopieren", copied: "Kopiert!", pricing_tab: "Preise", empty_state: "Bereit für das finale Rendering",
    format_label: "Studio-Formate", pricing_title: "Upgrade auf Pro", pricing_sub: "Maximale Leistung freischalten.",
    plans: [{ title: "Kostenlos", price: "0", features: ["5 Schmiedevorgänge / Monat", "Standardqualität"] }, { title: "Pro", price: "19", features: ["Unbegrenzt Schmieden", "Hochpräzise KI"], featured: true }, { title: "Business", price: "49", features: ["3 Benutzer", "White Label"] }]
  },
  "日本語": {
    badge: "編集スタジオ V1.0", header: "AXIOMOS", sub_header: "FORGE", reset: "リセット",
    tone: "スタイル", tone_placeholder: "鋭い、プロ...", target: "ターゲット", target_placeholder: "投資家、X...",
    language: "言語", text_tab: "台本", file_tab: "メディア", text_placeholder: "ここに素材を貼り付けてください...",
    forge_btn: "シグナルを生成", status_ready: "準備完了", status_done: "生成完了", status_error: "エラー",
    copy: "コピー", copied: "完了！", pricing_tab: "料金", empty_state: "最終レンダリングの準備完了",
    format_label: "スタジオ形式", pricing_title: "プロにアップグレード", pricing_sub: "最大パワーを解放する。",
    plans: [{ title: "無料", price: "0", features: ["月5回まで", "標準品質"] }, { title: "プロ", price: "19", features: ["無制限", "高精度AI"], featured: true }, { title: "ビジネス", price: "49", features: ["3ユーザー", "ホワイトラベル"] }]
  }
};

const getFormats = (lang: SupportedLangs) => [
  { key: "thread", label: lang === "Français" ? "Thread X" : lang === "Español" ? "Hilo X" : lang === "Deutsch" ? "X-Thread" : lang === "日本語" ? "Xスレッド" : "X Thread", icon: "🧵" },
  { key: "linkedin", label: "LinkedIn", icon: "📊" },
  { key: "citation", label: lang === "Français" ? "Citations" : lang === "Español" ? "Citas" : lang === "Deutsch" ? "Zitate" : lang === "日本語" ? "引用" : "Quotes", icon: "✨" },
  { key: "summary", label: lang === "Français" ? "Résumé" : lang === "Español" ? "Resumen" : lang === "Deutsch" ? "Zusammenfassung" : lang === "日本語" ? "要約" : "Summary", icon: "📝" },
  { key: "chapters", label: lang === "Français" ? "Chapitres" : lang === "Español" ? "Capítulos" : lang === "Deutsch" ? "Kapitel" : lang === "日本語" ? "章" : "Chapters", icon: "📑" },
  { key: "script", label: "Script", icon: "🎬" },
];

export default function Home() {
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState("thread");
  const [tone, setTone] = useState("");
  const [target, setTarget] = useState("");
  const [language, setLanguage] = useState<SupportedLangs>("Français");
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState("text");
  const [showPricing, setShowPricing] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const t = TRANSLATIONS[language];
  const formats = getFormats(language);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((old) => {
          if (old >= 92) return old + 0.1;
          return old + 2;
        });
      }, 300);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // CORRECTION MAJEURE ICI : handleForge optimisée pour les vidéos et Vercel
  const handleForge = async (fileToUse?: File) => {
    const file = fileToUse || currentFile;
    if (!file && !inputText) return;
    if (loading) return;

    setLoading(true);
    const formData = new FormData();
    if (youtubeUrl.trim()) {
      formData.append("youtube", youtubeUrl);
    } else if (file) {
      formData.append("file", file);
    } else {
      formData.append("text", inputText);
    }
        formData.append("format", format);
    formData.append("tone", tone);
    formData.append("target", target);
    formData.append("language", language);
    formData.append("force_language", "true");

    try {
      // On utilise un AbortController pour gérer le timeout proprement
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 secondes max

      const res = await fetch("/api/generate", { 
        method: "POST", 
        body: formData,
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`${res.status}`);

      const result = await res.json();
      if (result.output) {
        setOutputs((prev) => ({ ...prev, [format]: result.output }));
      }
    } catch (err: any) { 
      console.error(err);
      if (err.name === 'AbortError') {
        alert("Traitement trop long pour Vercel (Timeout).");
      } else {
        alert("Erreur serveur Axiomos.");
      }
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if ((inputText || currentFile) && !outputs[format] && !loading) handleForge();
  }, [format]);

  useEffect(() => {
    if ((inputText || currentFile) && !loading) {
      setOutputs({});
      handleForge();
    }
  }, [language]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1C1E] font-sans antialiased selection:bg-[#FBC02D]/30">
      <header className="bg-white/70 backdrop-blur-md border-b border-[#E9ECEF] sticky top-0 z-50 px-6 h-16 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1A1C1E] rounded-lg text-white flex items-center justify-center font-bold">F</div>
          <h1 className="text-sm font-bold tracking-widest uppercase">{t.header} <span className="font-normal opacity-40">{t.sub_header}</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setShowPricing(true)} className="text-xs font-bold text-[#1A1C1E] hover:opacity-60 transition-all uppercase tracking-widest">{t.pricing_tab}</button>
          <select value={language} onChange={(e) => setLanguage(e.target.value as SupportedLangs)} className="bg-transparent text-xs font-bold outline-none cursor-pointer uppercase">
            {Object.keys(TRANSLATIONS).map(lang => <option key={lang} value={lang}>{lang === "日本語" ? "JP" : lang.slice(0, 2).toUpperCase()}</option>)}
          </select>
        </div>
      </header>

      <div className="h-1 w-full bg-[#E9ECEF] sticky top-16 z-50 overflow-hidden">
        {loading && <div className="h-full bg-[#1A1C1E] transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.2)]" style={{ width: `${progress}%` }} />}
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)] min-h-[650px]">
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="bg-white rounded-[2rem] p-6 border border-[#E9ECEF] shadow-sm flex-1 flex flex-col overflow-hidden">
              <h2 className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-[0.2em] mb-8">{t.badge}</h2>
              <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar-light font-medium">
                <div className="space-y-2">
                    <label className="text-[9px] font-bold opacity-30 uppercase ml-1 tracking-widest">{t.tone}</label>
                    <input value={tone} onChange={(e) => setTone(e.target.value)} placeholder={t.tone_placeholder} className="w-full p-4 bg-[#F8F9FA] rounded-2xl border-none focus:ring-1 focus:ring-black/5 outline-none text-sm transition-all" />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-bold opacity-30 uppercase ml-1 tracking-widest">{t.target}</label>
                    <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder={t.target_placeholder} className="w-full p-4 bg-[#F8F9FA] rounded-2xl border-none focus:ring-1 focus:ring-black/5 outline-none text-sm transition-all" />
                </div>
                <div className="space-y-2 pt-4 border-t border-[#F1F3F5]">
                    <label className="text-[9px] font-bold opacity-30 uppercase ml-1 tracking-widest text-[#1A1C1E]">{t.format_label}</label>
                    <div className="flex flex-col gap-1">
                      {formats.map((f) => (
                        <button key={f.key} onClick={() => setFormat(f.key)} className={`flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all ${format === f.key ? "bg-[#1A1C1E] text-white shadow-md" : "hover:bg-[#F8F9FA] text-[#495057]"}`}>
                          <span className="text-base">{f.icon}</span> {f.label}
                        </button>
                      ))}
                    </div>
                </div>
              </div>
              <button onClick={() => { setOutputs({}); setInputText(""); setTone(""); setTarget(""); setCurrentFile(null); }} className="mt-6 py-3 text-[9px] font-bold text-[#ADB5BD] hover:text-red-500 transition-colors uppercase tracking-widest border-t border-[#F1F3F5] pt-4">
                {t.reset}
              </button>
            </div>
            <button onClick={() => handleForge()} disabled={loading || (!inputText && !currentFile && !youtubeUrl.trim())} className="w-full py-5 bg-[#1A1C1E] text-white rounded-[1.5rem] font-bold text-sm hover:bg-black transition-all shadow-xl shadow-black/5 active:scale-95 disabled:opacity-20 uppercase tracking-[0.2em]">
              {loading ? "..." : t.forge_btn}
            </button>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4">
    <div className="bg-white rounded-[2rem] border border-[#E9ECEF] flex-1 flex flex-col shadow-sm overflow-hidden">
      
      {/* Onglets */}
      <div className="flex border-b border-[#F1F3F5] p-2 bg-[#F8F9FA]/50">
        <button
          onClick={() => setActiveTab("text")}
          className={`flex-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest ${
            activeTab === "text"
              ? "bg-white shadow-sm text-black"
              : "opacity-30"
          }`}
        >
          {t.text_tab}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest opacity-30 hover:opacity-100 transition-all"
        >
          {t.file_tab} {currentFile && "✓"}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setCurrentFile(file);
              handleForge(file);
            }
          }}
          className="hidden"
        />
      </div>

      {/* Champ YouTube */}
      <div className="p-4 border-b border-[#F1F3F5]">
        <input
          type="text"
          placeholder="Lien YouTube..."
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          className="w-full p-4 bg-[#F8F9FA] rounded-2xl border-none focus:ring-1 focus:ring-black/5 outline-none text-sm transition-all"
        />
      </div>

      {/* Zone texte */}
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="flex-1 p-8 resize-none outline-none text-base text-[#495057] font-medium leading-relaxed placeholder:text-[#ADB5BD] custom-scrollbar-light"
        placeholder={t.text_placeholder}
      />
    </div>
  </div>
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white rounded-[2rem] border-2 border-[#1A1C1E] flex-1 flex flex-col shadow-2xl relative overflow-hidden">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <div className="w-6 h-6 border-2 border-[#1A1C1E] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 italic animate-pulse">Scanning Signal...</span>
                    </div>
                ) : outputs[format] ? (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex justify-between items-center p-6 border-b border-[#F1F3F5] bg-[#F8F9FA]/30">
                             <span className="text-[9px] font-bold text-[#ADB5BD] uppercase tracking-widest italic">{format} // {t.status_done}</span>
                             <button onClick={() => { navigator.clipboard.writeText(outputs[format]); setCopyStatus(true); setTimeout(() => setCopyStatus(false), 2000); }} className="text-[10px] font-bold bg-[#1A1C1E] text-white px-6 py-2 rounded-full hover:scale-105 active:scale-95 transition-all">
                                {copyStatus ? t.copied : t.copy}
                             </button>
                        </div>
                        <div className="flex-1 p-10 overflow-y-auto text-xl font-bold text-[#1A1C1E] leading-snug whitespace-pre-wrap custom-scrollbar-light tracking-tight italic">
                            {outputs[format]}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-[0.03] select-none text-[#1A1C1E]">
                        <span className="text-9xl mb-4 font-black italic">FORGE</span>
                        <p className="text-xs font-bold uppercase tracking-[0.4em]">{t.empty_state}</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </main>

      {showPricing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F8F9FA]/90 backdrop-blur-xl p-6">
          <div className="max-w-5xl w-full bg-white rounded-[3rem] p-16 shadow-2xl relative border border-[#E9ECEF]">
            <button onClick={() => setShowPricing(false)} className="absolute top-10 right-10 text-[#ADB5BD] hover:text-black text-2xl font-light">✕</button>
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">{t.pricing_title}</h2>
              <p className="text-[#ADB5BD] font-medium uppercase tracking-widest text-xs">{t.pricing_sub}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {t.plans.map((plan: any) => (
                <div key={plan.title} className={`p-10 rounded-[2.5rem] border transition-all ${plan.featured ? "border-[#1A1C1E] bg-[#1A1C1E] text-white scale-105 shadow-2xl" : "border-[#E9ECEF] bg-white text-[#1A1C1E]"}`}>
                  <div className="text-3xl font-bold mb-8 tracking-tighter">${plan.price}<span className="text-sm opacity-40 font-normal">/mo</span></div>
                  <h3 className="text-[10px] font-bold uppercase mb-6 tracking-widest opacity-60">{plan.title}</h3>
                  <ul className="space-y-4 mb-12 flex-1 text-[11px] font-medium">{plan.features.map((f: string) => (<li key={f} className="flex items-center gap-3"><span>•</span> {f}</li>))}</ul>
                  <button className={`w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border ${plan.featured ? "bg-white text-black border-white" : "border-[#E9ECEF] hover:bg-white"}`}>Choisir</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}