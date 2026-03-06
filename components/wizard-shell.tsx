"use client";

import { useSetlistStore } from "@/state/use-setlist-store";
import { StepProgressBar } from "@/components/step-progress-bar";
import { InputPanel } from "@/components/input-panel";
import { EditorPanel } from "@/components/editor-panel";
import { ExportPanel } from "@/components/export-panel";
import { FinalPanel } from "@/components/final-panel";

const STEP_LABELS = ["", "새 콘티", "편집", "내보내기", "최종본"];

export function WizardShell() {
  const wizardStep = useSetlistStore((s) => s.wizardStep);
  const setWizardStep = useSetlistStore((s) => s.setWizardStep);

  return (
    <div className="wizard-shell">
      <StepProgressBar />

      <div className="wizard-panels">
        <div style={{ display: wizardStep === 1 ? "block" : "none" }}>
          <InputPanel />
        </div>
        <div style={{ display: wizardStep === 2 ? "block" : "none" }}>
          <EditorPanel />
        </div>
        <div style={{ display: wizardStep === 3 ? "block" : "none" }}>
          <ExportPanel />
        </div>
        <div style={{ display: wizardStep === 4 ? "block" : "none" }}>
          <FinalPanel />
        </div>
      </div>

      <div className="wizard-nav">
        <button
          className="wiz-btn wiz-btn-back"
          type="button"
          disabled={wizardStep <= 1}
          onClick={() => setWizardStep(wizardStep - 1)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          이전
        </button>
        <span className="wiz-indicator">
          <span className="wiz-indicator-num">{wizardStep}</span>
          <span className="wiz-indicator-sep">/</span>
          <span className="wiz-indicator-total">4</span>
          <span className="wiz-indicator-label">{STEP_LABELS[wizardStep]}</span>
        </span>
        <button
          className="wiz-btn wiz-btn-next"
          type="button"
          disabled={wizardStep >= 4}
          onClick={() => setWizardStep(wizardStep + 1)}
        >
          다음
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}
