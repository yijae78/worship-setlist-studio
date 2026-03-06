"use client";

import { useMemo, useState } from "react";
import type { FlowSection, Song } from "@/types";
import { songCatalog } from "@/lib/song-catalog";
import { useSetlistStore } from "@/state/use-setlist-store";
import { SECTION_LABELS } from "@/lib/constants";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (song: Song) => void;
  title?: string;
};

const allSections: FlowSection[] = ["opening", "confession", "grace", "response", "sending"];

export function SongPickerModal({ open, onClose, onSelect, title = "곡 선택" }: Props) {
  const customSongs = useSetlistStore((s) => s.customSongs);
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState<FlowSection | "">("");

  const allSongs = useMemo(() => [...songCatalog, ...customSongs], [customSongs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allSongs.filter((song) => {
      if (q && !song.title.toLowerCase().includes(q) && !song.themeTags.some((t) => t.includes(q))) {
        return false;
      }
      if (filterSection && !song.flowTags.includes(filterSection)) {
        return false;
      }
      return true;
    });
  }, [allSongs, search, filterSection]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="split-header">
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="ghost-button" type="button" onClick={onClose}>닫기</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            className="input"
            placeholder="곡 제목 또는 태그 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <select
            className="select"
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value as FlowSection | "")}
            style={{ width: 120 }}
          >
            <option value="">전체 섹션</option>
            {allSections.map((s) => (
              <option key={s} value={s}>{SECTION_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <p className="hint" style={{ margin: "8px 0" }}>
          {filtered.length}곡 표시 / 전체 {allSongs.length}곡
        </p>

        <div className="modal-list">
          {filtered.map((song) => (
            <div key={song.id} className="modal-song-row">
              <div style={{ flex: 1 }}>
                <strong>{song.title}</strong>
                {song.isCustom && <span className="badge" style={{ marginLeft: 6 }}>내 곡</span>}
                <div className="hint">
                  {song.artist && `${song.artist} · `}
                  {song.key && `Key: ${song.key} · `}
                  {song.bpm && `BPM: ${song.bpm} · `}
                  {song.flowTags.map((f) => SECTION_LABELS[f]).join(", ")}
                </div>
                <div className="badge-row" style={{ marginTop: 4 }}>
                  {song.themeTags.slice(0, 4).map((tag) => (
                    <span key={tag} className="badge">{tag}</span>
                  ))}
                </div>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => { onSelect(song); onClose(); }}
              >
                선택
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="hint" style={{ textAlign: "center", padding: 24 }}>
              검색 결과가 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
