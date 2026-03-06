"use client";

import { useSetlistStore } from "@/state/use-setlist-store";

const STEPS = [
  { num: 1, label: "새 콘티" },
  { num: 2, label: "편집" },
  { num: 3, label: "내보내기" },
  { num: 4, label: "최종본" },
];

export function StepProgressBar() {
  const wizardStep = useSetlistStore((s) => s.wizardStep);
  const setWizardStep = useSetlistStore((s) => s.setWizardStep);

  return (
    <nav className="progress-nav">
      <span className="progress-nav-label">FLOW</span>
      <div className="progress-track">
        {/* background track */}
        <div className="progress-track-bg" />
        {/* filled track */}
        <div
          className="progress-track-fill"
          style={{ width: `${((wizardStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {/* step dots */}
        {STEPS.map((step) => {
          const state = wizardStep === step.num ? "current" : wizardStep > step.num ? "done" : "future";
          const pct = ((step.num - 1) / (STEPS.length - 1)) * 100;
          return (
            <button
              key={step.num}
              type="button"
              className={`progress-dot progress-dot-${state}`}
              style={{ left: `${pct}%` }}
              onClick={() => setWizardStep(step.num)}
            >
              <span className="progress-dot-inner">
                {state === "done" ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : step.num}
              </span>
              <span className="progress-dot-label">{step.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
