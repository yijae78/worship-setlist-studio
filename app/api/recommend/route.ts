import { NextResponse } from "next/server";
import { buildRecommendation } from "@/lib/recommendation";
import { songCatalog } from "@/lib/song-catalog";
import { referenceTeams } from "@/lib/reference-teams";
import { normalizeRecommendInput, validateRecommendInput } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = normalizeRecommendInput(body);
    const error = validateRecommendInput(input);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const draft = buildRecommendation(input, songCatalog, referenceTeams);
    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json(
      { error: "추천 결과를 생성하지 못했습니다." },
      { status: 500 }
    );
  }
}
