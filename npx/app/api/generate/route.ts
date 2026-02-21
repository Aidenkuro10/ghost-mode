import { NextResponse } from "next/server";
import OpenAI from "openai";

// Utilisation de pdf-extraction pour la compatibilité Turbopack et Next.js
const pdf = require("pdf-extraction");

// CONFIGURATION DU SEGMENT POUR NEXT.JS
export const maxDuration = 300; 
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ALLOWED_FORMATS = [
  "citation",
  "thread",
  "linkedin",
  "summary",
  "script",
  "chapters"
];

/**
 * Directives structurelles par format
 */
function getFormatPrompt(format: string, language: string) {
  const isEn = language === "English";
  const isEs = language === "Español";
  const isDe = language === "Deutsch";
  const isJp = language === "日本語";
  
  const tags = {
    literal: isEn ? "LITERAL" : isEs ? "LITERAL" : isDe ? "WÖRTLICH" : isJp ? "直訳" : "LITTÉRALE",
    forge: isEn ? "FORGE (RECOMMENDED)" : isEs ? "FORJA (RECOMENDADO)" : isDe ? "FORGE (EMPFOHLEN)" : isJp ? "フォージ (推奨)" : "FORGE (RECOMMANDÉ)",
    actionable: isEn ? "ACTIONABLE" : isEs ? "ACCIONABLE" : isDe ? "HANDLUNGSORIENTIERT" : isJp ? "実行可能" : "ACTIONNABLE",
    axiom: isEn ? "AXIOM" : isEs ? "AXIOMA" : isDe ? "AXIOM" : isJp ? "公理" : "AXIOME",
    visual: "action", 
    audio: "audio",
    screen: "screen",
    desc: isEn ? "Description" : isEs ? "Descripción" : isDe ? "Beschreibung" : isJp ? "説明" : "Description"
  };

  switch (format) {
    case "citation":
      return `
PRODUIS 4 CITATIONS À IMPACT MAXIMUM EN RESPECTANT STRICTEMENT LA LANGUE : ${language}.
1. [${tags.literal}] : Extrais la phrase la plus prophétique du texte, mot pour mot.
2. [${tags.forge}] : Transforme une idée majeure en une déclaration d'impact.
3. [${tags.actionable}] : Une phrase qui pousse à l'action.
4. [${tags.axiom}] : Une vérité froide de moins de 7 mots.
`;

    case "thread":
      return `
Génère un Thread X (Twitter) de 6 à 8 tweets EN ${language}.
- TWEET 1 : Hook fort 🧵
- Tweets suivants : idées structurées
- Dernier tweet : CTA clair
`;

    case "linkedin":
      return `
Génère un post LinkedIn expert EN ${language}.
Hook fort, 3 arguments précis, ton autoritaire.
`;

    case "summary":
      return `
Génère une synthèse exécutive EN ${language}.
Clair, dense, structuré.
`;

    case "script":
      return `
MODE : Script vidéo short EN ${language}
Structure :
[action]
[audio]
[screen]
`;

    case "chapters":
      return `
MODE : Chapitrage vidéo EN ${language}
00:00 - Titre
Description : phrase synthétique
`;

    default:
      return "";
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const youtubeUrl = formData.get("youtube") as string | null;
    const file = formData.get("file") as File | null;
    const textInput = formData.get("text") as string | null;
    const format = formData.get("format") as string;
    const tone = formData.get("tone") as string;
    const target = formData.get("target") as string;
    const instruction = formData.get("instruction") as string;
    const language = (formData.get("language") as string) || "Français";

    if (!ALLOWED_FORMATS.includes(format)) {
      return NextResponse.json({ error: "Format invalide." }, { status: 400 });
    }

    let rawText = "";

    // ---------- ÉTAPE 0 : ACQUISITION ----------
    if (textInput && textInput.trim() !== "") {
      rawText = textInput.trim();

    } else if (youtubeUrl && youtubeUrl.trim() !== "") {

      const response = await fetch("https://api.supadata.ai/v1/youtube/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SUPADATA_API_KEY}`
        },
        body: JSON.stringify({
          url: youtubeUrl
        })
      });

      if (!response.ok) {
        throw new Error("Erreur récupération transcript YouTube");
      }

      const data = await response.json();
      rawText = data.text?.trim() || "";

    } else if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const pdfData = await pdf(buffer);
        rawText = pdfData.text?.trim() || "";
      } else {
        const audioFile = new File([file], "input.wav", { type: file.type || "audio/wav" });
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1"
        });
        rawText = transcription.text?.trim() || "";
      }
    }

    if (!rawText) {
      return NextResponse.json({ error: "Veuillez fournir du contenu valide." }, { status: 400 });
    }

    // ---------- ÉTAPE 1 : EXTRACTION ----------
    const extraction = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `Analyse le texte et extrais les idées clés en ${language}.`
        },
        { role: "user", content: rawText }
      ]
    });

    const keyIdeas = extraction.choices[0].message.content?.trim() || "";

    // ---------- ÉTAPE 2 : GÉNÉRATION ----------
    const generation = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: `
Langue obligatoire : ${language}
Cible : ${target || "Audience générale"}
Ton : ${tone || "Naturel"}
${getFormatPrompt(format, language)}
`
        },
        {
          role: "user",
          content: format === "chapters"
            ? `CONTENU ORIGINAL :\n${rawText}`
            : `SUBSTANCE BRUTE :\n${keyIdeas}`
        }
      ]
    });

    const output = generation.choices[0].message.content?.trim() || "";

    return NextResponse.json({
      output,
      transcription: rawText,
      extractedIdeas: keyIdeas
    });

  } catch (error: any) {
    console.error("Erreur génération moteur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}