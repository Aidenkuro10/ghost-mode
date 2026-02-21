"use client";

import { useState, useRef, useEffect } from "react";

/* ------------------ TYPES ------------------ */

type SupportedLangs =
  | "Français"
  | "English"
  | "Español"
  | "Deutsch"
  | "日本語";

/* ------------------ COMPONENT ------------------ */

export default function Home() {
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState("thread");
  const [tone, setTone] = useState("");
  const [target, setTarget] = useState("");
  const [language, setLanguage] =
    useState<SupportedLangs>("Français");
  const [inputText, setInputText] = useState("");
  const [currentFile, setCurrentFile] =
    useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ------------------ DEBUG HANDLE FORGE ------------------ */

  const handleForge = async (fileToUse?: File) => {
    console.log("🔥 Forge clicked");

    const file = fileToUse || currentFile;

    if (!file && !inputText && !youtubeUrl.trim()) {
      console.log("⛔ Rien à envoyer");
      return;
    }

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

    try {
      console.log("📡 Envoi requête...");

      const res = await fetch(
        `${window.location.origin}/api/generate`,
        {
          method: "POST",
          body: formData,
        }
      );

      console.log("📨 Status:", res.status);

      const rawText = await res.text();

      console.log("📦 Raw response:", rawText);

      let result: any = {};
      try {
        result = JSON.parse(rawText);
      } catch {
        console.log("⚠️ Réponse non JSON");
      }

      if (!res.ok) {
        alert("Erreur API : " + rawText);
        throw new Error(rawText);
      }

      if (result.output) {
        setOutputs((prev) => ({
          ...prev,
          [format]: result.output,
        }));
      } else {
        alert("Pas de output dans la réponse.");
      }
    } catch (err: any) {
      console.error("❌ Erreur fetch:", err);
      alert("Erreur détectée : " + String(err));
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ UI ------------------ */

  return (
    <div className="p-10">
      <h1 className="text-3xl mb-6 font-bold">
        AXIOMOS TEST MODE
      </h1>

      <textarea
        placeholder="Colle ton texte ici"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="w-full border p-4 mb-4"
      />

      <input
        type="text"
        placeholder="Lien YouTube..."
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        className="w-full border p-4 mb-4"
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setCurrentFile(file);
        }}
        className="mb-4"
      />

      <button
        onClick={() => handleForge()}
        disabled={loading}
        className="bg-black text-white px-6 py-3"
      >
        {loading ? "..." : "GÉNÉRER"}
      </button>

      <pre className="mt-10 bg-gray-100 p-6 whitespace-pre-wrap">
        {outputs[format]}
      </pre>
    </div>
  );
}