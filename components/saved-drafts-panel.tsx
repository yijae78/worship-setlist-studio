"use client";

import { useSetlistStore } from "@/state/use-setlist-store";

export function SavedDraftsPanel() {
  const savedDrafts = useSetlistStore((s) => s.savedDrafts);
  const restoreDraft = useSetlistStore((s) => s.restoreDraft);
  const deleteSavedDraft = useSetlistStore((s) => s.deleteSavedDraft);

  if (savedDrafts.length === 0) return null;

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <h2>저장본 목록</h2>
      <p className="hint">
        과거에 확정하거나 수동 저장한 콘티입니다. 불러오기를 누르면 현재 작업을 대체합니다.
      </p>

      <div className="saved-drafts-grid">
        {savedDrafts.map((draft) => (
          <div key={draft.id} className="saved-draft-card">
            <div style={{ flex: 1 }}>
              <strong>{draft.topic || "(주제 없음)"}</strong>
              <div className="hint">
                {draft.scripture} · {draft.worshipType} · {draft.items.length}곡
              </div>
              <div className="hint">
                {draft.status === "confirmed" ? "확정됨" : "초안"} ·{" "}
                {new Date(draft.updatedAt).toLocaleDateString("ko-KR")}
              </div>
            </div>
            <div className="button-row">
              <button
                className="secondary-button"
                type="button"
                onClick={() => restoreDraft(draft.id)}
              >
                불러오기
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => deleteSavedDraft(draft.id)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
