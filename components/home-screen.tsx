"use client";

import { useMemo } from "react";
import { InputPanel } from "@/components/input-panel";
import { EditorPanel } from "@/components/editor-panel";
import { PreviewPanel } from "@/components/preview-panel";
import { SavedDraftsPanel } from "@/components/saved-drafts-panel";
import { useSetlistStore } from "@/state/use-setlist-store";

export function HomeScreen() {
  const currentDraft = useSetlistStore((s) => s.currentDraft);
  const saveStatus = useSetlistStore((s) => s.saveStatus);
  const previewOpen = useSetlistStore((s) => s.previewOpen);
  const togglePreview = useSetlistStore((s) => s.togglePreview);

  const statusLabel = useMemo(() => {
    if (!currentDraft) return "초안 없음";
    return currentDraft.status === "confirmed" ? "최종 확정본" : "편집 중 초안";
  }, [currentDraft]);

  return (
    <main className="page-shell">
      <div className="topbar">
        <div className="brand-box">
          <span className="eyebrow">WORSHIP SETLIST STUDIO</span>
          <h1 className="title">찬양콘티 스튜디오</h1>
          <p className="subtitle">
            주제, 성경본문, 예배유형을 바탕으로 초안을 만들고 수정 · 저장 · 출력까지 이어지는 예배 설계 도구입니다.
          </p>
        </div>
        <div className="pill-row">
          <span className={`status-badge ${currentDraft?.status === "confirmed" ? "saved" : "draft"}`}>
            {statusLabel}
          </span>
          <span className={`status-badge ${saveStatus === "saved" ? "saved" : "draft"}`}>
            {saveStatus === "saved" ? "자동 저장됨" : "저장 대기"}
          </span>
          <button className="secondary-button" type="button" onClick={togglePreview}>
            {previewOpen ? "미리 보기 닫기" : "미리 보기 열기"}
          </button>
        </div>
      </div>

      <div className="layout-grid">
        <InputPanel />
        <EditorPanel />
        {previewOpen && <PreviewPanel />}
      </div>

      <SavedDraftsPanel />
    </main>
  );
}
