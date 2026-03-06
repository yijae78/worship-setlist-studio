import type { FlowSection, ReferenceTeam, SetlistDraft, SetlistItem, Song } from "@/types";
import { nowIso, tokenize, uid } from "@/lib/helpers";
import { extractScriptureKeywords } from "@/lib/scripture";
import { SECTION_LABELS } from "@/lib/constants";

export type RecommendInput = {
  topic: string;
  scripture: string;
  worshipType: string;
  moods: string[];
  preferredTeams: string[];
  songCount: number;
  slowCount: number;
  fastCount: number;
};

type ScoredSong = { song: Song; score: number };

const SLOW_BPM_THRESHOLD = 95;

const slowMoods = new Set(["묵상", "회개", "기도", "은혜"]);

function isSlow(song: Song): boolean {
  if (song.bpm) return song.bpm < SLOW_BPM_THRESHOLD;
  return song.moodTags.some((m) => slowMoods.has(m));
}

const defaultSections: Record<number, FlowSection[]> = {
  2: ["opening", "sending"],
  3: ["opening", "grace", "sending"],
  4: ["opening", "confession", "grace", "sending"],
  5: ["opening", "confession", "grace", "response", "sending"],
  6: ["opening", "confession", "grace", "grace", "response", "sending"],
  7: ["opening", "confession", "grace", "grace", "response", "response", "sending"],
  8: ["opening", "opening", "confession", "grace", "grace", "response", "response", "sending"],
  9: ["opening", "opening", "confession", "grace", "grace", "response", "response", "sending", "sending"],
  10: ["opening", "opening", "confession", "confession", "grace", "grace", "response", "response", "sending", "sending"]
};

const slowSections = new Set<FlowSection>(["confession", "grace"]);

export function buildRecommendation(
  input: RecommendInput,
  songs: Song[],
  teams: ReferenceTeam[],
  shuffle = false
): SetlistDraft {
  const ranked = rankSongs(input, songs, teams);

  if (shuffle) {
    for (const entry of ranked) {
      entry.score += Math.random() * 20 - 8;
    }
    ranked.sort((a, b) => b.score - a.score);
  }

  const picked = pickSlowFast(ranked, input.slowCount, input.fastCount);
  const items = assignSections(input, picked);
  const timestamp = nowIso();

  return {
    id: uid("draft"),
    topic: input.topic,
    scripture: input.scripture,
    worshipType: input.worshipType,
    moods: input.moods,
    preferredTeams: input.preferredTeams,
    songCount: input.slowCount + input.fastCount,
    slowCount: input.slowCount,
    fastCount: input.fastCount,
    items,
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function rankSongs(input: RecommendInput, songs: Song[], teams: ReferenceTeam[]): ScoredSong[] {
  return songs
    .map((song) => ({ song, score: scoreSong(song, input, teams) }))
    .sort((a, b) => b.score - a.score);
}

function scoreSong(song: Song, input: RecommendInput, teams: ReferenceTeam[]) {
  const topicTokens = tokenize(input.topic);
  const scriptureTokens = extractScriptureKeywords(input.scripture);
  const moodTokens = input.moods;
  const preferred = teams.filter((t) => input.preferredTeams.includes(t.id));

  let score = 0;
  score += overlap(topicTokens, song.themeTags) * 30;
  score += overlap(scriptureTokens, song.scriptureTags) * 24;
  score += overlap(moodTokens, song.moodTags) * 18;

  if (input.worshipType.includes("기도")) {
    score += song.flowTags.includes("response") ? 10 : 0;
    score += song.flowTags.includes("confession") ? 6 : 0;
  }
  if (input.worshipType.includes("주일")) {
    score += song.flowTags.includes("opening") ? 6 : 0;
    score += song.flowTags.includes("grace") ? 6 : 0;
  }

  for (const team of preferred) {
    score += overlap(team.styleTags, [...song.themeTags, ...song.moodTags]) * 6;
    score += overlap(team.flowBias, song.flowTags) * 5;
    if (song.sourceTeamIds?.includes(team.id)) score += 4;
  }

  return score;
}

function overlap(source: string[], target: string[]) {
  const set = new Set(target.map((s) => s.toLowerCase()));
  return source.reduce((c, s) => (set.has(s.toLowerCase()) ? c + 1 : c), 0);
}

function pickSlowFast(ranked: ScoredSong[], slowCount: number, fastCount: number): Song[] {
  const slowPool = ranked.filter((e) => isSlow(e.song));
  const fastPool = ranked.filter((e) => !isSlow(e.song));

  const seenIds = new Set<string>();
  const result: Song[] = [];

  const pickFrom = (pool: ScoredSong[], count: number) => {
    for (const entry of pool) {
      if (result.length >= result.length + count - (result.length - (result.length - result.length))) break;
      if (count <= 0) break;
      if (seenIds.has(entry.song.id)) continue;
      seenIds.add(entry.song.id);
      result.push(entry.song);
      count--;
      if (count <= 0) break;
    }
  };

  // Pick slow songs
  let remaining = slowCount;
  for (const entry of slowPool) {
    if (remaining <= 0) break;
    if (seenIds.has(entry.song.id)) continue;
    seenIds.add(entry.song.id);
    result.push(entry.song);
    remaining--;
  }

  // Pick fast songs
  remaining = fastCount;
  for (const entry of fastPool) {
    if (remaining <= 0) break;
    if (seenIds.has(entry.song.id)) continue;
    seenIds.add(entry.song.id);
    result.push(entry.song);
    remaining--;
  }

  // If not enough in one pool, fill from the other
  const total = slowCount + fastCount;
  if (result.length < total) {
    for (const entry of ranked) {
      if (result.length >= total) break;
      if (seenIds.has(entry.song.id)) continue;
      seenIds.add(entry.song.id);
      result.push(entry.song);
    }
  }

  return result;
}

function assignSections(input: RecommendInput, songs: Song[]): SetlistItem[] {
  const count = songs.length;
  const sections = defaultSections[count] ?? defaultSections[5];

  // Sort: slow songs → slow sections (confession, grace), fast songs → fast sections (opening, response, sending)
  const slowSongs = songs.filter((s) => isSlow(s));
  const fastSongs = songs.filter((s) => !isSlow(s));

  const slowSectionIndices = sections.map((s, i) => ({ s, i })).filter((x) => slowSections.has(x.s)).map((x) => x.i);
  const fastSectionIndices = sections.map((s, i) => ({ s, i })).filter((x) => !slowSections.has(x.s)).map((x) => x.i);

  const arranged: (Song | null)[] = new Array(sections.length).fill(null);

  let si = 0;
  for (const idx of slowSectionIndices) {
    if (si < slowSongs.length) {
      arranged[idx] = slowSongs[si++];
    }
  }

  let fi = 0;
  for (const idx of fastSectionIndices) {
    if (fi < fastSongs.length) {
      arranged[idx] = fastSongs[fi++];
    }
  }

  // Fill remaining slots
  const remaining = [...slowSongs.slice(si), ...fastSongs.slice(fi)];
  let ri = 0;
  for (let i = 0; i < arranged.length; i++) {
    if (!arranged[i] && ri < remaining.length) {
      arranged[i] = remaining[ri++];
    }
  }

  return arranged
    .filter((s): s is Song => s !== null)
    .map((song, index) => {
      const section = sections[index] ?? "response";
      return {
        id: uid("item"),
        order: index + 1,
        title: song.title,
        songId: song.id,
        section,
        selectedKey: song.key ?? song.availableKeys?.[0],
        reason: buildReason(song, input, section),
        memo: "",
        attachments: [],
        confirmed: false
      };
    });
}

function buildReason(song: Song, input: RecommendInput, section: FlowSection) {
  const hints: string[] = [];
  if (song.themeTags.some((tag) => input.topic.includes(tag))) {
    hints.push("주제와 맞닿아 있습니다");
  }
  if (song.scriptureTags.some((tag) => input.scripture.includes(tag))) {
    hints.push("본문 정서와 연결됩니다");
  }
  if (input.moods.some((mood) => song.moodTags.includes(mood))) {
    hints.push("선택한 분위기에 어울립니다");
  }
  const tempo = isSlow(song) ? "느린 곡" : "빠른 곡";
  return hints[0]
    ? `${hints[0]} (${tempo})`
    : `${SECTION_LABELS[section]} 구간에 어울리는 ${tempo}입니다`;
}
