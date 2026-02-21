import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const formData = await req.formData();

  const jobId = randomUUID();
  const jobsDir = "/data/jobs";

if (!fs.existsSync(jobsDir)) {
  fs.mkdirSync(jobsDir, { recursive: true });
}
  const jobPath = path.join(jobsDir, `${jobId}.json`);

  // sauvegarde état initial
  fs.writeFileSync(
    jobPath,
    JSON.stringify({ status: "processing", output: null })
  );

  // 🔥 lancer traitement en arrière-plan
  setImmediate(async () => {
    try {
      const result = await heavyProcessing(formData);

      fs.writeFileSync(
        jobPath,
        JSON.stringify({ status: "done", output: result })
      );
    } catch (e) {
      fs.writeFileSync(
        jobPath,
        JSON.stringify({ status: "error", output: null })
      );
    }
  });

  return NextResponse.json({ jobId });
}

// Tu mets ici TON pipeline actuel
async function heavyProcessing(formData: FormData) {
  // 👉 ici tu copies ton code actuel
  // transcription + GPT + génération
  // et tu retournes juste le output final

  return "Résultat généré ici";
}