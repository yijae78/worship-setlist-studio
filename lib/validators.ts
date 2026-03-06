import { clampNumber } from "@/lib/helpers";
import type { RecommendInput } from "@/lib/recommendation";

export function normalizeRecommendInput(input: RecommendInput): RecommendInput {
  return {
    topic: input.topic.trim(),
    scripture: input.scripture.trim(),
    worshipType: input.worshipType.trim(),
    moods: input.moods.filter(Boolean),
    preferredTeams: input.preferredTeams.filter(Boolean),
    songCount: clampNumber(Number(input.songCount) || 5, 2, 10),
    slowCount: clampNumber(Number(input.slowCount) || 2, 0, 10),
    fastCount: clampNumber(Number(input.fastCount) || 3, 0, 10)
  };
}

export function validateRecommendInput(input: RecommendInput) {
  if (!input.topic.trim() && !input.scripture.trim()) {
    return "주제 또는 성경본문 중 하나 이상 입력해 주세요.";
  }
  if (!input.worshipType.trim()) {
    return "예배유형을 선택해 주세요.";
  }
  const total = (input.slowCount ?? 0) + (input.fastCount ?? 0);
  if (total < 2 || total > 10) {
    return "총 곡 수는 2~10곡 사이로 선택해 주세요.";
  }
  return null;
}
