"use client";

import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import type { SetlistDraft } from "@/types";
import { SECTION_LABELS } from "@/lib/constants";

// --- Word (.docx) Export ---

export async function exportDraftToDocx(draft: SetlistDraft, songMap?: Map<string, { key?: string; bpm?: number }>, churchName?: string, worshipDate?: string, footerNote?: string) {
  const headerParts = [churchName, worshipDate && fmtDate(worshipDate)].filter(Boolean).join(" · ");
  const children = [
    ...(headerParts ? [new Paragraph({ children: [new TextRun({ text: headerParts, size: 28, color: "555555" })] })] : []),
    new Paragraph({ text: "찬양콘티", heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun(`주제: ${draft.topic || "-"}`)] }),
    new Paragraph({ children: [new TextRun(`본문: ${draft.scripture || "-"}`)] }),
    new Paragraph({ children: [new TextRun(`예배유형: ${draft.worshipType}`)] }),
    new Paragraph({ children: [new TextRun({ text: `분위기: ${draft.moods.join(", ") || "-"}`, italics: true })] }),
    new Paragraph("")
  ];

  for (const item of draft.items) {
    const info = songMap?.get(item.songId ?? "");
    const key = item.selectedKey ?? info?.key;
    const bpm = info?.bpm;
    const meta = [key && `Key: ${key}`, bpm && `BPM: ${bpm}`].filter(Boolean).join(" / ");
    const metaSuffix = meta ? ` (${meta})` : "";

    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${item.order}. [${SECTION_LABELS[item.section]}] ${item.title}${metaSuffix}`, bold: true })]
      })
    );
    if (item.reason) children.push(new Paragraph(`  추천 이유: ${item.reason}`));
    if (item.memo) children.push(new Paragraph(`  메모: ${item.memo}`));
    children.push(new Paragraph(""));
  }

  if (footerNote) {
    children.push(new Paragraph(""));
    children.push(new Paragraph({
      children: [new TextRun({ text: footerNote, size: 20, color: "555555", italics: true })]
    }));
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `찬양콘티-${sanitize(draft.topic || "setlist")}.docx`);
}

// --- PDF Export (via browser print for full Korean support) ---

export function exportDraftToPdf(draft: SetlistDraft, songMap?: Map<string, { key?: string; bpm?: number }>, churchName?: string, worshipDate?: string, footerNote?: string) {
  const html = buildPrintHtml(draft, songMap, churchName, worshipDate, footerNote);
  const w = window.open("", "_blank");
  if (!w) { alert("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해 주세요."); return; }
  w.document.write(html);
  w.document.close();
  w.onload = () => { setTimeout(() => w.print(), 300); };
}

function buildPrintHtml(draft: SetlistDraft, songMap?: Map<string, { key?: string; bpm?: number }>, churchName?: string, worshipDate?: string, footerNote?: string): string {
  const rows = draft.items.map((item) => {
    const info = songMap?.get(item.songId ?? "");
    const key = item.selectedKey ?? info?.key;
    const bpm = info?.bpm;
    const meta = [key && `Key: ${key}`, bpm && `BPM: ${bpm}`].filter(Boolean).join(" / ");
    const metaHtml = meta ? ` <span style="color:#888;font-size:13px;">(${meta})</span>` : "";
    const memoHtml = item.memo ? `<div style="color:#555;margin:4px 0 0 18px;">메모: ${esc(item.memo)}</div>` : "";
    return `<div style="border-top:1px dashed #ccc;padding:10px 0;">
      <strong>${item.order}. [${SECTION_LABELS[item.section]}] ${esc(item.title)}</strong>${metaHtml}
      <div style="color:#666;font-size:13px;margin:4px 0 0 18px;">${esc(item.reason)}</div>
      ${memoHtml}
    </div>`;
  }).join("");

  const footerHtml = footerNote
    ? `<div style="margin-top:24px;padding:12px 14px;background:#f8f7f4;border-radius:10px;color:#555;font-size:13px;font-style:italic;">${esc(footerNote)}</div>`
    : "";

  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"/><title>찬양콘티 - ${esc(draft.topic)}</title>
<style>body{font-family:"Pretendard","Noto Sans KR",sans-serif;max-width:700px;margin:30px auto;color:#222}h1{font-size:24px;margin-bottom:4px}.sub{color:#666;font-size:14px;margin-bottom:16px}@media print{body{margin:0}}</style>
</head><body>
${(churchName || worshipDate) ? `<div style="color:#555;font-size:16px;margin-bottom:4px;">${[churchName && esc(churchName), worshipDate && esc(fmtDate(worshipDate))].filter(Boolean).join(" · ")}</div>` : ""}
<h1>${esc(draft.topic || "찬양콘티")}</h1>
<div class="sub">본문: ${esc(draft.scripture || "-")} · 예배유형: ${esc(draft.worshipType)} · 분위기: ${esc(draft.moods.join(", ") || "-")}</div>
${rows}
${footerHtml}
<script>window.onafterprint=function(){window.close();}</script>
</body></html>`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName; a.click();
  window.URL.revokeObjectURL(url);
}

function sanitize(input: string) {
  return input.replace(/[\\/:*?"<>|\s]+/g, "-").slice(0, 30);
}

function esc(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}
