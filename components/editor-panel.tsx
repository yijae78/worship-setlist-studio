"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useSetlistStore } from "@/state/use-setlist-store";
import { songCatalog } from "@/lib/song-catalog";
import { referenceTeams } from "@/lib/reference-teams";
import { SECTION_LABELS } from "@/lib/constants";
import { buildRecommendation } from "@/lib/recommendation";
import { SongPickerModal } from "@/components/song-picker-modal";
import type { FlowSection, SetlistItem, Song } from "@/types";

const allSections: FlowSection[] = ["opening", "confession", "grace", "response", "sending"];

export function EditorPanel() {
  const draft = useSetlistStore((s) => s.currentDraft);
  const setDraft = useSetlistStore((s) => s.setDraft);
  const resetDraft = useSetlistStore((s) => s.resetDraft);
  const moveItem = useSetlistStore((s) => s.moveItem);
  const removeItem = useSetlistStore((s) => s.removeItem);
  const duplicateItem = useSetlistStore((s) => s.duplicateItem);
  const updateItemMemo = useSetlistStore((s) => s.updateItemMemo);
  const updateItemSection = useSetlistStore((s) => s.updateItemSection);
  const updateItemKey = useSetlistStore((s) => s.updateItemKey);
  const confirmDraft = useSetlistStore((s) => s.confirmDraft);
  const saveDraftToHistory = useSetlistStore((s) => s.saveDraftToHistory);
  const addItem = useSetlistStore((s) => s.addItem);
  const replaceItem = useSetlistStore((s) => s.replaceItem);
  const reorderItem = useSetlistStore((s) => s.reorderItem);
  const customSongs = useSetlistStore((s) => s.customSongs);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"add" | "replace">("add");
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  // Track initial order to detect reordered items
  const initialOrderRef = useRef<string[] | null>(null);
  const draftId = draft?.id ?? null;

  useEffect(() => {
    if (draft && draft.items.length > 0) {
      if (initialOrderRef.current === null) {
        initialOrderRef.current = draft.items.map((it) => it.id);
      }
    }
    if (!draft) {
      initialOrderRef.current = null;
    }
  }, [draft]);

  // Reset initial order when draft ID changes (new draft generated)
  const prevDraftIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (draftId !== prevDraftIdRef.current) {
      initialOrderRef.current = draft?.items.map((it) => it.id) ?? null;
      prevDraftIdRef.current = draftId;
    }
  }, [draftId, draft]);

  // ---- Undo / Redo history ----
  const [undoStack, setUndoStack] = useState<SetlistItem[][]>([]);
  const [redoStack, setRedoStack] = useState<SetlistItem[][]>([]);
  const skipHistoryRef = useRef(false);
  const itemIds = draft?.items.map((it) => it.id).join(",") ?? "";
  const prevItemIdsRef = useRef(itemIds);
  const prevItemsRef = useRef<SetlistItem[]>(draft?.items ?? []);
  const historyDraftIdRef = useRef(draft?.id ?? null);

  useEffect(() => {
    const currentDraftId = draft?.id ?? null;
    if (currentDraftId !== historyDraftIdRef.current) {
      historyDraftIdRef.current = currentDraftId;
      setUndoStack([]);
      setRedoStack([]);
      prevItemIdsRef.current = itemIds;
      prevItemsRef.current = draft?.items ?? [];
      skipHistoryRef.current = false;
      return;
    }
    if (!draft) return;
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      prevItemIdsRef.current = itemIds;
      prevItemsRef.current = draft.items;
      return;
    }
    if (prevItemIdsRef.current !== itemIds && prevItemIdsRef.current !== "") {
      const snapshot = JSON.parse(JSON.stringify(prevItemsRef.current)) as SetlistItem[];
      setUndoStack((s) => [...s, snapshot]);
      setRedoStack([]);
    }
    prevItemIdsRef.current = itemIds;
    prevItemsRef.current = draft.items;
  }, [draft, itemIds]);

  // Drag state
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const songMap = useMemo(() => {
    const map = new Map<string, Song>();
    for (const s of [...songCatalog, ...customSongs]) map.set(s.id, s);
    return map;
  }, [customSongs]);

  if (!draft) {
    return (
      <section className="panel panel-editor">
        <div className="panel-header-bar editor-bar">
          <span className="panel-step">STEP 2</span>
          <h2>편집</h2>
        </div>
        <p className="hint">STEP 1에서 콘티를 생성하면 이 영역에서 순서 변경, 곡 교체, 메모 작성을 진행할 수 있습니다.</p>
      </section>
    );
  }

  const handleRegenerate = () => {
    const allSongs = [...songCatalog, ...customSongs];
    const newDraft = buildRecommendation(
      {
        topic: draft.topic,
        scripture: draft.scripture,
        worshipType: draft.worshipType,
        moods: draft.moods,
        preferredTeams: draft.preferredTeams,
        songCount: draft.songCount,
        slowCount: draft.slowCount ?? Math.floor(draft.songCount / 2),
        fastCount: draft.fastCount ?? Math.ceil(draft.songCount / 2)
      },
      allSongs,
      referenceTeams,
      true
    );
    setDraft(newDraft);
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || !draft) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, JSON.parse(JSON.stringify(draft.items))]);
    skipHistoryRef.current = true;
    setDraft({ ...draft, items: prev });
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || !draft) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, JSON.parse(JSON.stringify(draft.items))]);
    skipHistoryRef.current = true;
    setDraft({ ...draft, items: next });
  };

  const openAddPicker = () => { setPickerMode("add"); setPickerOpen(true); };
  const openReplacePicker = (itemId: string) => { setPickerMode("replace"); setReplaceTargetId(itemId); setPickerOpen(true); };

  const handlePickSong = (song: Song) => {
    if (pickerMode === "add") {
      addItem(song, song.flowTags[0] ?? "response");
    } else if (pickerMode === "replace" && replaceTargetId) {
      replaceItem(replaceTargetId, song);
    }
  };

  // Simple approach: each card is a drop zone, detect top/bottom half
  const handleCardDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    // If mouse is in top half → insert before this card, bottom half → insert after
    const slot = e.clientY < midY ? idx : idx + 1;
    setDropTarget(slot);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragFrom !== null && dropTarget !== null) {
      let to = dropTarget > dragFrom ? dropTarget - 1 : dropTarget;
      if (to !== dragFrom) {
        reorderItem(dragFrom, to);
      }
    }
    setDragFrom(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDragFrom(null);
    setDropTarget(null);
  };

  // Compute effective drop slot, skipping redundant positions
  const getInsertSlot = () => {
    if (dragFrom === null || dropTarget === null) return null;
    // Don't show indicator for no-op positions
    if (dropTarget === dragFrom || dropTarget === dragFrom + 1) return null;
    return dropTarget;
  };

  const insertSlot = getInsertSlot();

  return (
    <section className="panel panel-editor">
      <div className="split-header">
        <div>
          <div className="panel-header-bar editor-bar">
            <span className="panel-step">STEP 2</span>
            <h2>편집</h2>
          </div>
          <p className="hint">드래그 핸들(⠿)을 잡고 카드를 이동하세요.</p>
        </div>
        <div className="button-row">
          <button className="undo-redo-btn" type="button" onClick={handleUndo} disabled={undoStack.length === 0} title="이전 순서로 되돌리기">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h13a4 4 0 0 1 0 8H7"/><path d="M3 10l4-4"/><path d="M3 10l4 4"/></svg>
            이전
          </button>
          <button className="undo-redo-btn" type="button" onClick={handleRedo} disabled={redoStack.length === 0} title="다음 순서로 다시실행">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10H8a4 4 0 0 0 0 8h9"/><path d="M21 10l-4-4"/><path d="M21 10l-4 4"/></svg>
            이후
          </button>
          <button className="ghost-button" type="button" onClick={handleRegenerate}>다시 제안</button>
          <button className="ghost-button" type="button" onClick={saveDraftToHistory}>저장</button>
          <button className="ghost-button" type="button" onClick={() => { if (confirm("편집 중인 콘티를 모두 초기화할까요?")) resetDraft(); }}>전체 초기화</button>
          <button className="secondary-button" type="button" onClick={confirmDraft}>최종 확정</button>
        </div>
      </div>

      <div className="card-list" ref={listRef} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
        {draft.items.map((item, idx) => {
          const song = songMap.get(item.songId ?? "");
          const keys = song?.availableKeys ?? (song?.key ? [song.key] : []);
          const displayKey = item.selectedKey ?? song?.key ?? "";
          const isDragged = dragFrom === idx;
          const initialIdx = initialOrderRef.current?.indexOf(item.id) ?? idx;
          const isReordered = initialOrderRef.current !== null && initialIdx !== -1 && initialIdx !== idx;

          return (
            <div key={item.id} className="card-slot">
              {insertSlot === idx && <div className="drop-indicator"><span className="drop-indicator-label">여기에 놓기</span></div>}
              <article
                className={`song-card ${isDragged ? "song-card-dragging" : ""} ${isReordered ? "song-card-reordered" : ""}`}
                draggable
                onDragStart={(e) => {
                  setDragFrom(idx);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => handleCardDragOver(e, idx)}
                onDragEnd={handleDragEnd}
              >
                <div className="song-card-header">
                  <div className="drag-handle" title="드래그하여 순서 변경">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                      <rect x="4" y="2" width="3.5" height="2" rx="1"/><rect x="10.5" y="2" width="3.5" height="2" rx="1"/>
                      <rect x="4" y="5.5" width="3.5" height="2" rx="1"/><rect x="10.5" y="5.5" width="3.5" height="2" rx="1"/>
                      <rect x="4" y="9" width="3.5" height="2" rx="1"/><rect x="10.5" y="9" width="3.5" height="2" rx="1"/>
                      <rect x="4" y="12.5" width="3.5" height="2" rx="1"/><rect x="10.5" y="12.5" width="3.5" height="2" rx="1"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className={`song-title ${isReordered ? "song-title-reordered" : ""}`}>
                      {item.order}. {item.title}
                      {isReordered && <span className="reorder-badge">순서 변경됨</span>}
                      {displayKey && (
                        keys.length > 1 ? (
                          <select
                            className="key-select"
                            value={displayKey}
                            onChange={(e) => updateItemKey(item.id, e.target.value)}
                          >
                            {keys.map((k) => <option key={k} value={k}>{k}</option>)}
                          </select>
                        ) : (
                          <span className="key-badge">{displayKey}</span>
                        )
                      )}
                    </p>
                    <div className="song-meta" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <select
                        className="section-select"
                        value={item.section}
                        onChange={(e) => updateItemSection(item.id, e.target.value as FlowSection)}
                      >
                        {allSections.map((s) => <option key={s} value={s}>{SECTION_LABELS[s]}</option>)}
                      </select>
                      <span>{song?.bpm ? `${song.bpm} BPM` : ""}</span>
                    </div>
                  </div>
                </div>

                <div className="reason-box">{item.reason}</div>

                <textarea
                  className="card-memo"
                  value={item.memo}
                  onChange={(e) => updateItemMemo(item.id, e.target.value)}
                  placeholder="메모: 전조, 브릿지 반복, 기도 포인트 등"
                  rows={1}
                />

                <div className="mini-actions">
                  <button className="icon-button" type="button" onClick={() => moveItem(item.id, "up")}>위로</button>
                  <button className="icon-button" type="button" onClick={() => moveItem(item.id, "down")}>아래로</button>
                  <button className="icon-button" type="button" onClick={() => openReplacePicker(item.id)}>교체</button>
                  <button className="icon-button" type="button" onClick={() => duplicateItem(item.id)}>복제</button>
                  <button className="icon-button" type="button" onClick={() => removeItem(item.id)}>삭제</button>
                </div>
              </article>
              {insertSlot === idx + 1 && idx === draft.items.length - 1 && (
                <div className="drop-indicator"><span className="drop-indicator-label">여기에 놓기</span></div>
              )}
            </div>
          );
        })}
      </div>

      <button className="ghost-button" type="button" onClick={openAddPicker} style={{ marginTop: 12, width: "100%" }}>
        + 곡 추가
      </button>

      <p className="footer-note">
        참고 예배팀 성향은 보조 가중치일 뿐이며, 최종 판단은 예배 인도자가 직접 하도록 설계했습니다.
      </p>

      <SongPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handlePickSong} title={pickerMode === "add" ? "곡 추가" : "곡 교체"} />
    </section>
  );
}
