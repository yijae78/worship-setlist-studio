"use client";

import { useState } from "react";
import type { FlowSection, Song } from "@/types";
import { SECTION_LABELS } from "@/lib/constants";
import { uid } from "@/lib/helpers";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (song: Song) => void;
  onDelete?: (songId: string) => void;
  song?: Song | null;
};

const allSections: FlowSection[] = ["opening", "confession", "grace", "response", "sending"];
const moodOptions = ["경배", "은혜", "회개", "소망", "결단", "기도", "감사", "부흥", "묵상", "선포", "기쁨"];

export function SongEditorModal({ open, onClose, onSave, onDelete, song }: Props) {
  const isEdit = !!song;

  const [title, setTitle] = useState(song?.title ?? "");
  const [artist, setArtist] = useState(song?.artist ?? "");
  const [key, setKey] = useState(song?.key ?? "");
  const [bpm, setBpm] = useState(song?.bpm?.toString() ?? "");
  const [hymnNumber, setHymnNumber] = useState(song?.hymnNumber ?? "");
  const [themeTags, setThemeTags] = useState(song?.themeTags.join(", ") ?? "");
  const [scriptureTags, setScriptureTags] = useState(song?.scriptureTags.join(", ") ?? "");
  const [moodTags, setMoodTags] = useState<string[]>(song?.moodTags ?? []);
  const [flowTags, setFlowTags] = useState<FlowSection[]>(song?.flowTags ?? []);

  const toggleMood = (m: string) =>
    setMoodTags((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const toggleFlow = (f: FlowSection) =>
    setFlowTags((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const handleSave = () => {
    if (!title.trim()) {
      alert("곡 제목을 입력해 주세요.");
      return;
    }
    if (flowTags.length === 0) {
      alert("예배 흐름 섹션을 하나 이상 선택해 주세요.");
      return;
    }
    const result: Song = {
      id: song?.id ?? uid("custom"),
      title: title.trim(),
      artist: artist.trim() || undefined,
      key: key.trim() || undefined,
      bpm: bpm ? Number(bpm) : undefined,
      hymnNumber: hymnNumber.trim() || undefined,
      themeTags: themeTags.split(",").map((t) => t.trim()).filter(Boolean),
      scriptureTags: scriptureTags.split(",").map((t) => t.trim()).filter(Boolean),
      moodTags,
      flowTags,
      isCustom: true
    };
    onSave(result);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="split-header">
          <h2 style={{ margin: 0 }}>{isEdit ? "곡 편집" : "새 곡 추가"}</h2>
          <button className="ghost-button" type="button" onClick={onClose}>닫기</button>
        </div>

        <div className="field">
          <label className="label">곡 제목 *</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="곡 제목" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="field">
            <label className="label">아티스트</label>
            <input className="input" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="선택사항" />
          </div>
          <div className="field">
            <label className="label">찬송가 번호</label>
            <input className="input" value={hymnNumber} onChange={(e) => setHymnNumber(e.target.value)} placeholder="예: 405" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="field">
            <label className="label">원키 (Key)</label>
            <input className="input" value={key} onChange={(e) => setKey(e.target.value)} placeholder="예: D, Eb" />
          </div>
          <div className="field">
            <label className="label">BPM</label>
            <input className="input" type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="예: 80" />
          </div>
        </div>

        <div className="field">
          <label className="label">주제 태그 (쉼표 구분)</label>
          <input className="input" value={themeTags} onChange={(e) => setThemeTags(e.target.value)} placeholder="예: 은혜, 회복, 사랑" />
        </div>

        <div className="field">
          <label className="label">성경 태그 (쉼표 구분)</label>
          <input className="input" value={scriptureTags} onChange={(e) => setScriptureTags(e.target.value)} placeholder="예: 시편, 이사야" />
        </div>

        <div className="field">
          <label className="label">분위기</label>
          <div className="option-grid">
            {moodOptions.map((m) => (
              <button
                key={m}
                type="button"
                className={`tag-button ${moodTags.includes(m) ? "active" : ""}`}
                onClick={() => toggleMood(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">예배 흐름 섹션 *</label>
          <div className="option-grid">
            {allSections.map((s) => (
              <button
                key={s}
                type="button"
                className={`tag-button ${flowTags.includes(s) ? "active" : ""}`}
                onClick={() => toggleFlow(s)}
              >
                {SECTION_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="button-row" style={{ marginTop: 16 }}>
          <button className="primary-button" type="button" onClick={handleSave}>
            {isEdit ? "수정 저장" : "곡 추가"}
          </button>
          {isEdit && onDelete && song && (
            <button
              className="ghost-button"
              type="button"
              style={{ color: "var(--danger)" }}
              onClick={() => { onDelete(song.id); onClose(); }}
            >
              삭제
            </button>
          )}
          <button className="ghost-button" type="button" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}
