"use client";

import { useMemo, useState } from "react";
import { WizardShell } from "@/components/wizard-shell";
import { useSetlistStore } from "@/state/use-setlist-store";

const DEVICES = [
  { id: "desktop", label: "Desktop", icon: "desktop", width: 800 },
  { id: "tablet", label: "Tablet", icon: "tablet", width: 768 },
  { id: "mobile", label: "Mobile", icon: "mobile", width: 375 },
] as const;

type DeviceId = (typeof DEVICES)[number]["id"];

const DeviceIcon = ({ type }: { type: string }) => {
  if (type === "desktop") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
  );
  if (type === "tablet") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/></svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
  );
};

export function HomeScreen() {
  const currentDraft = useSetlistStore((s) => s.currentDraft);
  const saveStatus = useSetlistStore((s) => s.saveStatus);
  const [device, setDevice] = useState<DeviceId>("desktop");

  const activeDevice = DEVICES.find((d) => d.id === device)!;

  const statusLabel = useMemo(() => {
    if (!currentDraft) return "No Draft";
    return currentDraft.status === "confirmed" ? "Confirmed" : "Editing";
  }, [currentDraft]);

  return (
    <main className="page-shell">
      {/* ---- Header ---- */}
      <header className="topbar">
        <div className="brand-box">
          <div className="brand-icon-wrap">
            <svg className="brand-icon" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="url(#g1)" strokeWidth="2"/>
              <circle cx="16" cy="16" r="4" fill="url(#g1)"/>
              <path d="M16 4v8M16 20v8M4 16h8M20 16h8" stroke="url(#g1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#ec4899"/></linearGradient></defs>
            </svg>
          </div>
          <div>
            <p className="eyebrow">Worship Setlist Studio</p>
            <h1 className="title">찬양콘티 스튜디오</h1>
          </div>
        </div>
        <div className="header-right">
          <div className="status-pills">
            <span className={`status-pill ${currentDraft?.status === "confirmed" ? "status-ok" : "status-warn"}`}>
              <span className="status-dot" />
              {statusLabel}
            </span>
            <span className={`status-pill ${saveStatus === "saved" ? "status-ok" : "status-warn"}`}>
              <span className="status-dot" />
              {saveStatus === "saved" ? "Saved" : "Unsaved"}
            </span>
          </div>
          <div className="device-switcher">
            {DEVICES.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`device-btn ${device === d.id ? "device-btn-active" : ""}`}
                onClick={() => setDevice(d.id)}
                title={d.label}
              >
                <DeviceIcon type={d.icon} />
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="device-frame" style={{ maxWidth: activeDevice.width }}>
        <WizardShell />
      </div>

      {/* ---- Footer ---- */}
      <footer className="site-footer">
        <div className="footer-glow" />
        <p className="footer-brand">TRINITY AI FORUM</p>
        <p className="footer-copy">&copy; 2026 Developed by Yijae Shin</p>
      </footer>
    </main>
  );
}
