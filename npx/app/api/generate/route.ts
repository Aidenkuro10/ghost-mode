import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const text = formData.get("text") as string;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Aucun texte fourni." },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Résume le texte." },
        { role: "user", content: text }
      ],
    });

    return NextResponse.json({
      output: completion.choices[0].message.content
    });

  } catch (error: any) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}