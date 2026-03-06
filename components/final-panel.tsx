"use client";

import { useMemo, useState } from "react";
import { useSetlistStore } from "@/state/use-setlist-store";
import { songCatalog } from "@/lib/song-catalog";
import { SECTION_LABELS } from "@/lib/constants";
import type { SetlistDraft, Song } from "@/types";

export function FinalPanel() {
  const draft = useSetlistStore((s) => s.currentDraft);
  const customSongs = useSetlistStore((s) => s.customSongs);
  const churchName = useSetlistStore((s) => s.churchName);
  const worshipDate = useSetlistStore((s) => s.worshipDate);
  const footerNote = useSetlistStore((s) => s.footerNote);
  const savedDrafts = useSetlistStore((s) => s.savedDrafts);
  const deleteSavedDraft = useSetlistStore((s) => s.deleteSavedDraft);
  const restoreDraft = useSetlistStore((s) => s.restoreDraft);
  const resetDraft = useSetlistStore((s) => s.resetDraft);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const songMap = useMemo(() => {
    const map = new Map<string, Song>();
    for (const s of [...songCatalog, ...customSongs]) map.set(s.id, s);
    return map;
  }, [customSongs]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!draft && savedDrafts.length === 0) {
    return (
      <section className="panel panel-final">
        <div className="panel-header-bar final-bar">
          <span className="panel-step">STEP 4</span>
          <h2>최종수정본</h2>
        </div>
        <p className="hint">저장된 최종수정본이 없습니다.</p>
      </section>
    );
  }

  const otherDrafts = draft ? savedDrafts.filter((d) => d.id !== draft.id) : savedDrafts;

  return (
    <section className="panel panel-final">
      <div className="panel-header-bar final-bar">
        <span className="panel-step">STEP 4</span>
        <h2>최종수정본</h2>
      </div>
      <p className="hint">확정하거나 수동 저장한 콘티입니다. 불러오기를 누르면 현재 작업을 대체합니다.</p>

      <div className="final-list">
        {draft && (
          <FinalCard
            draft={draft}
            songMap={songMap}
            expanded={expandedIds.has(draft.id)}
            onToggle={() => toggleExpand(draft.id)}
            onDelete={() => { if (confirm("현재 콘티를 삭제할까요?")) resetDraft(); }}
            isCurrent
            churchName={churchName}
            worshipDate={worshipDate}
            footerNote={footerNote}
          />
        )}

        {otherDrafts.map((d) => (
          <FinalCard
            key={d.id}
            draft={d}
            songMap={songMap}
            expanded={expandedIds.has(d.id)}
            onToggle={() => toggleExpand(d.id)}
            onDelete={() => { if (confirm("이 최종수정본을 삭제할까요?")) deleteSavedDraft(d.id); }}
            onRestore={() => restoreDraft(d.id)}
          />
        ))}
      </div>
    </section>
  );
}

function FinalCard({ draft, songMap, expanded, onToggle, onDelete, onRestore, isCurrent, churchName, worshipDate, footerNote }: {
  draft: SetlistDraft;
  songMap: Map<string, Song>;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  isCurrent?: boolean;
  churchName?: string;
  worshipDate?: string;
  footerNote?: string;
}) {
  const dateDisplay = isCurrent && worshipDate
    ? formatDate(worshipDate)
    : formatDateTime(draft.updatedAt);

  return (
    <div className={`final-card ${isCurrent ? "final-card-current" : ""}`}>
      <div className="final-card-header" onClick={onToggle}>
        <div className="final-card-info">
          {isCurrent && <span className="final-badge-current">현재</span>}
          <span className="final-card-date">{dateDisplay}</span>
          <span className="final-card-topic">{draft.topic || "제목 없음"}</span>
        </div>
        <div className="final-card-actions">
          {onRestore && (
            <button
              className="icon-button"
              type="button"
              onClick={(e) => { e.stopPropagation(); onRestore(); }}
              style={{ color: "var(--brand)", borderColor: "var(--brand-soft)" }}
            >
              불러오기
            </button>
          )}
          <button
            className="icon-button final-delete-btn"
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            삭제
          </button>
          <span className="final-chevron">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="final-card-body">
          {isCurrent && churchName && (
            <p className="preview-church">{churchName}</p>
          )}
          <p className="hint" style={{ margin: "0 0 10px" }}>
            본문: {draft.scripture || "-"} · 예배유형: {draft.worshipType} · 분위기: {draft.moods.join(", ") || "-"}
          </p>

          {draft.items.map((item) => {
            const song = songMap.get(item.songId ?? "");
            const keyDisplay = item.selectedKey ?? song?.key;
            const bpmDisplay = song?.bpm;
            const meta = [keyDisplay && `Key: ${keyDisplay}`, bpmDisplay && `BPM: ${bpmDisplay}`].filter(Boolean).join(" / ");

            return (
              <div key={item.id} className="final-song-row">
                <strong>{item.order}. [{SECTION_LABELS[item.section]}] {item.title}</strong>
                {meta && <span className="hint" style={{ marginLeft: 8 }}>({meta})</span>}
                <div className="hint" style={{ marginTop: 4 }}>{item.reason}</div>
                {item.memo && <div className="final-song-memo">{item.memo}</div>}
              </div>
            );
          })}

          {isCurrent && footerNote && (
            <div className="preview-footer-note">{footerNote}</div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
