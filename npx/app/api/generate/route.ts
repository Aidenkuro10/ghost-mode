import { NextResponse } from "next/server";
import OpenAI from "openai";

// Utilisation de pdf-extraction
const pdf = require("pdf-extraction");

// CONFIGURATION NEXT
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

function getFormatPrompt(format: string, language: string) {
  switch (format) {
    case "citation":
      return `Produis 4 citations puissantes en ${language}.`;
    case "thread":
      return `Génère un thread X structuré en ${language}.`;
    case "linkedin":
      return `Génère un post LinkedIn expert en ${language}.`;
    case "summary":
      return `Génère une synthèse exécutive en ${language}.`;
    case "script":
      return `Génère un script vidéo short en ${language}.`;
    case "chapters":
      return `Génère un chapitrage vidéo en ${language}.`;
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
    const language = (formData.get("language") as string) || "Français";

    if (!ALLOWED_FORMATS.includes(format)) {
      return NextResponse.json({ error: "Format invalide." }, { status: 400 });
    }

    let rawText = "";

    // ====== ACQUISITION ======

    if (textInput && textInput.trim() !== "") {
      rawText = textInput.trim();

    } else if (youtubeUrl && youtubeUrl.trim() !== "") {

      console.log("Fetching Supadata transcript for:", youtubeUrl);

      const response = await fetch("https://api.supadata.ai/v1/youtube/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SUPADATA_API_KEY}`
        },
        body: JSON.stringify({ url: youtubeUrl })
      });

      const rawResponse = await response.text();
      console.log("Supadata raw response:", rawResponse);

      if (!response.ok) {
        throw new Error(`Supadata HTTP ${response.status} - ${rawResponse}`);
      }

      const data = JSON.parse(rawResponse);
      rawText = data.text?.trim() || "";

    } else if (file) {

      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const pdfData = await pdf(buffer);
        rawText = pdfData.text?.trim() || "";
      } else {
        const audioFile = new File(
          [file],
          "input.wav",
          { type: file.type || "audio/wav" }
        );

        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1"
        });

        rawText = transcription.text?.trim() || "";
      }
    }

    if (!rawText) {
      return NextResponse.json(
        { error: "Veuillez fournir du contenu valide." },
        { status: 400 }
      );
    }

    // ====== EXTRACTION ======

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

    // ====== GÉNÉRATION ======

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