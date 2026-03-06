"use client";

import { useState, useMemo } from "react";
import { useSetlistStore } from "@/state/use-setlist-store";
import { songCatalog } from "@/lib/song-catalog";
import { referenceTeams } from "@/lib/reference-teams";
import { SECTION_LABELS } from "@/lib/constants";
import { buildRecommendation } from "@/lib/recommendation";
import { SongPickerModal } from "@/components/song-picker-modal";
import type { FlowSection, Song } from "@/types";

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
  const customSongs = useSetlistStore((s) => s.customSongs);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"add" | "replace">("add");
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

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
        <p className="hint">왼쪽에서 콘티를 생성하면 이 영역에서 순서 변경, 곡 교체, 메모 작성을 진행할 수 있습니다.</p>
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

  const openAddPicker = () => { setPickerMode("add"); setPickerOpen(true); };
  const openReplacePicker = (itemId: string) => { setPickerMode("replace"); setReplaceTargetId(itemId); setPickerOpen(true); };

  const handlePickSong = (song: Song) => {
    if (pickerMode === "add") {
      addItem(song, song.flowTags[0] ?? "response");
    } else if (pickerMode === "replace" && replaceTargetId) {
      replaceItem(replaceTargetId, song);
    }
  };

  return (
    <section className="panel panel-editor">
      <div className="split-header">
        <div>
          <div className="panel-header-bar editor-bar">
            <span className="panel-step">STEP 2</span>
            <h2>편집</h2>
          </div>
          <p className="hint">초안을 실제 예배 흐름에 맞게 다듬는 단계입니다.</p>
        </div>
        <div className="button-row">
          <button className="ghost-button" type="button" onClick={handleRegenerate}>다시 제안</button>
          <button className="ghost-button" type="button" onClick={saveDraftToHistory}>저장</button>
          <button className="ghost-button" type="button" onClick={() => { if (confirm("편집 중인 콘티를 모두 초기화할까요?")) resetDraft(); }}>전체 초기화</button>
          <button className="secondary-button" type="button" onClick={confirmDraft}>최종 확정</button>
        </div>
      </div>

      <div className="card-list">
        {draft.items.map((item) => {
          const song = songMap.get(item.songId ?? "");
          const keys = song?.availableKeys ?? (song?.key ? [song.key] : []);
          const displayKey = item.selectedKey ?? song?.key ?? "";

          return (
            <article key={item.id} className="song-card">
              <div className="song-card-header">
                <div style={{ flex: 1 }}>
                  <p className="song-title">
                    {item.order}. {item.title}
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
