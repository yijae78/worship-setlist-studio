"use client";

import { useMemo, useRef, useState } from "react";
import { toPng, toJpeg } from "html-to-image";
import { exportDraftToDocx, exportDraftToPdf } from "@/lib/exporters";
import { useSetlistStore } from "@/state/use-setlist-store";
import { songCatalog } from "@/lib/song-catalog";
import { SECTION_LABELS } from "@/lib/constants";
import type { SetlistDraft, Song } from "@/types";

export function PreviewPanel() {
  const draft = useSetlistStore((s) => s.currentDraft);
  const customSongs = useSetlistStore((s) => s.customSongs);
  const churchName = useSetlistStore((s) => s.churchName);
  const worshipDate = useSetlistStore((s) => s.worshipDate);
  const footerNote = useSetlistStore((s) => s.footerNote);
  const setFooterNote = useSetlistStore((s) => s.setFooterNote);
  const savedDrafts = useSetlistStore((s) => s.savedDrafts);
  const deleteSavedDraft = useSetlistStore((s) => s.deleteSavedDraft);
  const resetDraft = useSetlistStore((s) => s.resetDraft);
  const previewRef = useRef<HTMLDivElement>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const songMap = useMemo(() => {
    const map = new Map<string, Song>();
    for (const s of [...songCatalog, ...customSongs]) map.set(s.id, s);
    return map;
  }, [customSongs]);

  const exportMap = useMemo(() => {
    const map = new Map<string, { key?: string; bpm?: number }>();
    if (!draft) return map;
    for (const item of draft.items) {
      map.set(item.songId ?? "", { key: item.selectedKey, bpm: songMap.get(item.songId ?? "")?.bpm });
    }
    return map;
  }, [songMap, draft]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const downloadImage = async (format: "png" | "jpg") => {
    if (!previewRef.current) return;
    try {
      const fn = format === "png" ? toPng : toJpeg;
      const dataUrl = await fn(previewRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        quality: 0.95
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `찬양콘티-${(draft?.topic || "setlist").replace(/[\\/:*?"<>|\s]+/g, "-").slice(0, 30)}.${format === "png" ? "png" : "jpg"}`;
      a.click();
    } catch {
      alert("이미지 다운로드에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  if (!draft) {
    return (
      <>
        <section className="panel panel-preview">
          <div className="panel-header-bar preview-bar">
            <span className="panel-step">STEP 3</span>
            <h2>내보내기</h2>
          </div>
          <p className="hint">콘티가 생성되면 내보내기 설정과 하단 문구를 작성할 수 있습니다.</p>
        </section>

        <section className="panel panel-final">
          <div className="panel-header-bar final-bar">
            <span className="panel-step">STEP 4</span>
            <h2>최종수정본</h2>
          </div>
          {savedDrafts.length === 0 ? (
            <p className="hint">저장된 최종수정본이 없습니다.</p>
          ) : (
            <div className="final-list">
              {savedDrafts.map((d) => (
                <FinalCard
                  key={d.id}
                  draft={d}
                  songMap={songMap}
                  expanded={expandedIds.has(d.id)}
                  onToggle={() => toggleExpand(d.id)}
                  onDelete={() => { if (confirm("이 최종수정본을 삭제할까요?")) deleteSavedDraft(d.id); }}
                />
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  const otherDrafts = savedDrafts.filter((d) => d.id !== draft.id);

  return (
    <>
      {/* STEP 3: 내보내기 설정 */}
      <section className="panel panel-preview">
        <div className="panel-header-bar preview-bar">
          <span className="panel-step">STEP 3</span>
          <h2>내보내기</h2>
        </div>
        <p className="hint" style={{ marginBottom: 14 }}>파일 형식을 선택해 다운로드하세요.</p>

        <div className="export-buttons">
          <button className="secondary-button" type="button" onClick={() => exportDraftToDocx(draft, exportMap, churchName, worshipDate, footerNote)}>Word</button>
          <button className="secondary-button" type="button" onClick={() => exportDraftToPdf(draft, exportMap, churchName, worshipDate, footerNote)}>PDF</button>
          <button className="secondary-button" type="button" onClick={() => downloadImage("png")}>PNG</button>
          <button className="secondary-button" type="button" onClick={() => downloadImage("jpg")}>JPG</button>
        </div>

        <div className="field" style={{ marginTop: 18 }}>
          <label className="label">하단 문구</label>
          <textarea
            className="textarea footer-note-input"
            value={footerNote}
            onChange={(e) => setFooterNote(e.target.value)}
            placeholder={"예: 오늘 예배를 통해 하나님께 온전히 나아갑시다.\n\n리더가 전하고 싶은 메시지를 자유롭게 작성하세요."}
            rows={5}
          />
        </div>
      </section>

      {/* STEP 4: 최종수정본 */}
      <section className="panel panel-final">
        <div className="panel-header-bar final-bar">
          <span className="panel-step">STEP 4</span>
          <h2>최종수정본</h2>
        </div>

        <div className="final-list">
          {/* 현재 편집 중인 콘티 */}
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

          {/* 저장된 이전 콘티 */}
          {otherDrafts.map((d) => (
            <FinalCard
              key={d.id}
              draft={d}
              songMap={songMap}
              expanded={expandedIds.has(d.id)}
              onToggle={() => toggleExpand(d.id)}
              onDelete={() => { if (confirm("이 최종수정본을 삭제할까요?")) deleteSavedDraft(d.id); }}
            />
          ))}
        </div>

        {/* 이미지 내보내기용 숨김 프리뷰 */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div className="preview-sheet" ref={previewRef} style={{ width: 700 }}>
            {(churchName || worshipDate) && (
              <p className="preview-church">
                {churchName}{churchName && worshipDate && " · "}{worshipDate && formatDate(worshipDate)}
              </p>
            )}
            <h3 className="preview-title">{draft.topic || "찬양콘티"}</h3>
            <p className="preview-subtitle">
              본문: {draft.scripture || "-"} · 예배유형: {draft.worshipType} · 분위기: {draft.moods.join(", ") || "-"}
            </p>

            {draft.items.map((item) => {
              const song = songMap.get(item.songId ?? "");
              const keyDisplay = item.selectedKey ?? song?.key;
              const bpmDisplay = song?.bpm;
              const meta = [keyDisplay && `Key: ${keyDisplay}`, bpmDisplay && `BPM: ${bpmDisplay}`].filter(Boolean).join(" / ");

              return (
                <div key={item.id} className="preview-item">
                  <strong>{item.order}. [{SECTION_LABELS[item.section]}] {item.title}</strong>
                  {meta && <span className="hint" style={{ marginLeft: 8 }}>({meta})</span>}
                  <div className="hint" style={{ marginTop: 6 }}>{item.reason}</div>
                  {item.memo && <div style={{ marginTop: 8 }}>{item.memo}</div>}
                </div>
              );
            })}

            {footerNote && (
              <div className="preview-footer-note">{footerNote}</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/* ---- Accordion Card ---- */

function FinalCard({ draft, songMap, expanded, onToggle, onDelete, isCurrent, churchName, worshipDate, footerNote }: {
  draft: SetlistDraft;
  songMap: Map<string, Song>;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
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
