import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("id");

  if (!jobId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const jobPath = `/data/jobs/${jobId}.json`;

  if (!fs.existsSync(jobPath)) {
    return NextResponse.json({ status: "not_found" });
  }

  const data = JSON.parse(fs.readFileSync(jobPath, "utf8"));

  return NextResponse.json(data);
}