import { NextResponse } from "next/server";
import OpenAI from "openai";
import ytdlp from "yt-dlp-exec";
import ffmpegPath from "ffmpeg-static";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execFileAsync = promisify(execFile);

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
 * Directives structurelles par format - Version Forgeron Axiomos
 * Adaptée dynamiquement selon la langue choisie.
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
2. [${tags.forge}] : Transforme une idée majeure en une déclaration d'impact. Utilise des verbes de pouvoir.
3. [${tags.actionable}] : Une phrase qui donne l'impression au lecteur qu'il perd de l'argent ou du pouvoir s'il n'agit pas.
4. [${tags.axiom}] : Une vérité froide de moins de 7 mots. Aucun adjectif inutile.

RÈGLE : Ajoutez '(Option recommandée)' sur la version FORGE.
`;

    case "thread":
      return `
Génère un Thread X (Twitter) de 6 à 8 tweets EN ${language}.
- TWEET 1 (HOOK) : Un constat alarmant ou une promesse de gain. Termine par "🧵".
- TWEETS 2 à 7 : Décompose le texte. Une idée forte par tweet.
- STYLE : Phrases ultra-courtes. Utilise des listes à puces (•).
- REGLAGE : Supprime les introductions type "In this thread...".
- DERNIER TWEET : Une synthèse brutale et un CTA sec.
`;

    case "linkedin":
      return `
Génère un post LinkedIn de type "EXPERTISE RADICALE" EN ${language}.
- HOOK : Une ligne qui expose un enjeu ou un danger immédiat.
- CORPS : Appuie ton argumentaire sur 3 faits PRÉCIS issus du document.
- CONTRAINTE : Ne résume pas, UTILISE ces faits pour prouver ton point de vue.
- ESPACE : Saut de ligne DOUBLE entre chaque phrase.
- TON : Autoritaire et Expert.
- CTA : Une sentence finale courte.
`;

    case "summary":
      return `
Génère une SYNTHÈSE DE HAUTE DIRECTION fluide et percutante EN ${language}.
RÈGLES D'OR : 
1. Ne pas afficher de titres de section.
2. Ne pas utiliser de numérotation automatique.
STRUCTURE INVISIBLE : Ouverture d'autorité, Diagnostic dense, Faits chiffrés intégrés, Conclusion tranchante.
STYLE : Direct, froid, autoritaire.
`;

    case "script":
      return `
MODE : RÉALISATEUR VIDÉO SHORT EN ${language}
STRUCTURE DU RENDU (STRICTE) :

[${tags.visual}] : Instruction simple de mouvement ou de cadrage.
[${tags.audio}] : Le texte exact à dire. Inclus l'intention de ton (ex: [Tranchant], [Vite]).
[${tags.screen}] : Ce qui doit apparaître en texte.

CONSIGNES : Langage parlé uniquement. Pas de clichés visuels. Réalisme total pour un créateur solo.
`;

    case "chapters":
      return `
MODE : ARCHITECTE DE CONTENU (ESTIMATION CHRONOLOGIQUE) EN ${language}
STRUCTURE STRICTE :
00:00 - Titre du chapitre
${tags.desc} : Une phrase synthétique orientée valeur.

RÈGLES : Pas de paliers fixes (ex: évite 00:10, 00:20). Varie les durées pour paraître humain. 
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
    const language = formData.get("language") as string || "Français";

    if (!ALLOWED_FORMATS.includes(format)) {
      return NextResponse.json({ error: "Format invalide." }, { status: 400 });
    }

    let rawText = "";

    // ---------- ÉTAPE 0 : ACQUISITION (Texte ou Fichier) ----------
    if (textInput && textInput.trim() !== "") {
      rawText = textInput.trim();
    } else if (youtubeUrl && youtubeUrl.trim() !== "") {
      const tempDir = "/tmp";
      const outputPath = path.join(tempDir, `audio-${Date.now()}.mp3`);

      // 1️⃣ Télécharger seulement l'audio
      await ytdlp(youtubeUrl, {
        extractAudio: true,
        audioFormat: "mp3",
        output: outputPath,
      });

      // 2️⃣ Vérifier taille
      const stats = fs.statSync(outputPath);
      const maxSize = 24 * 1024 * 1024; // 24MB sécurité

      if (stats.size > maxSize) {
        throw new Error("Audio trop volumineux pour transcription.");
      }

      // 3️⃣ Envoyer à Whisper
      const audioFile = new File(
        [fs.readFileSync(outputPath)],
        "youtube.mp3",
        { type: "audio/mpeg" }
      );

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1"
      });

      rawText = transcription.text?.trim() || "";

      // 4️⃣ Nettoyage
      fs.unlinkSync(outputPath);
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
      return NextResponse.json({ error: "Veuillez coller du texte ou importer un fichier." }, { status: 400 });
    }

    // ---------- ÉTAPE 1 : EXTRACTION UNIVERSELLE ----------
    const extraction = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `Tu es un analyste de contenu universel Axiomos. Tu travailles exclusivement en ${language}. 
          Analyse le texte et extrais : 
          1. L'ESSENCE : Sujet principal.
          2. LES POINTS CLÉS : Instructions ou arguments majeurs.
          3. LES DONNÉES : Chiffres et entités.
          RÈGLE : Rendu en liste de faits denses sans politesse. Tout doit être traduit en ${language}.`
        },
        { role: "user", content: rawText }
      ]
    });

    const keyIdeas = extraction.choices[0].message.content?.trim() || "";

    // ---------- ÉTAPE 2 : GÉNÉRATION ÉDITORIALE (Forge finale) ----------
    const generation = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: `
Tu es un moteur de production de contenu d'élite.
RÈGLE ABSOLUE : LA LANGUE DE SORTIE DOIT ÊTRE ${language}. INTERDICTION D'UTILISER UNE AUTRE LANGUE.

CONTEXTE :
- CIBLE : ${target || "Audience générale"}
- TON : ${tone || "Naturel et direct"}
- INSTRUCTION : ${instruction || "Aucune"}

RÈGLES :
1. Pas de "Le texte dit".
2. Marque : AXIOMOS.
3. Rédige l'intégralité du contenu en ${language}.

OBJECTIF ÉDITORIAL : 
${getFormatPrompt(format, language)}
`
        },
        {
        role: "user",
        content: format === "chapters"
            ? `CONTENU ORIGINAL : \n${rawText}`
            : `SUBSTANCE BRUTE (DÉJÀ ANALYSÉE) : \n${keyIdeas}`
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