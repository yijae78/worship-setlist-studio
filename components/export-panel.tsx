"use client";

import { useMemo, useRef } from "react";
import { toPng, toJpeg } from "html-to-image";
import { exportDraftToDocx, exportDraftToPdf } from "@/lib/exporters";
import { useSetlistStore } from "@/state/use-setlist-store";
import { songCatalog } from "@/lib/song-catalog";
import { SECTION_LABELS } from "@/lib/constants";
import type { Song } from "@/types";

export function ExportPanel() {
  const draft = useSetlistStore((s) => s.currentDraft);
  const customSongs = useSetlistStore((s) => s.customSongs);
  const churchName = useSetlistStore((s) => s.churchName);
  const worshipDate = useSetlistStore((s) => s.worshipDate);
  const footerNote = useSetlistStore((s) => s.footerNote);
  const setFooterNote = useSetlistStore((s) => s.setFooterNote);
  const previewRef = useRef<HTMLDivElement>(null);

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
      <section className="panel panel-preview">
        <div className="panel-header-bar preview-bar">
          <span className="panel-step">STEP 3</span>
          <h2>내보내기</h2>
        </div>
        <p className="hint">콘티가 생성되면 내보내기 설정과 하단 문구를 작성할 수 있습니다.</p>
      </section>
    );
  }

  return (
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

      {/* Hidden preview for image export */}
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
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}
