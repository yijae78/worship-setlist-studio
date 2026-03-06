"use client";

import { useMemo, useState } from "react";
import { referenceTeams } from "@/lib/reference-teams";
import { songCatalog } from "@/lib/song-catalog";
import { useSetlistStore } from "@/state/use-setlist-store";
import { validateRecommendInput, normalizeRecommendInput } from "@/lib/validators";
import { buildRecommendation } from "@/lib/recommendation";
import { SongEditorModal } from "@/components/song-editor-modal";
import { CalendarPicker } from "@/components/calendar-picker";
import type { Song } from "@/types";

const moodOptions = ["경배", "은혜", "회개", "소망", "결단", "기도", "감사", "부흥"];
const worshipTypes = ["주일예배", "수요예배", "금요기도회", "청년예배", "수련회", "선교집회"];

export function InputPanel() {
  const setDraft = useSetlistStore((s) => s.setDraft);
  const resetDraft = useSetlistStore((s) => s.resetDraft);
  const churchName = useSetlistStore((s) => s.churchName);
  const setChurchName = useSetlistStore((s) => s.setChurchName);
  const worshipDate = useSetlistStore((s) => s.worshipDate);
  const setWorshipDate = useSetlistStore((s) => s.setWorshipDate);
  const customSongs = useSetlistStore((s) => s.customSongs);
  const addCustomSong = useSetlistStore((s) => s.addCustomSong);
  const updateCustomSong = useSetlistStore((s) => s.updateCustomSong);
  const deleteCustomSong = useSetlistStore((s) => s.deleteCustomSong);

  const [topic, setTopic] = useState("");
  const [scripture, setScripture] = useState("");
  const [worshipType, setWorshipType] = useState("주일예배");
  const [moods, setMoods] = useState<string[]>([]);
  const [preferredTeams, setPreferredTeams] = useState<string[]>([]);
  const [slowCount, setSlowCount] = useState(2);
  const [fastCount, setFastCount] = useState(3);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [songEditorOpen, setSongEditorOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  const totalCount = slowCount + fastCount;

  const teamSummary = useMemo(
    () => referenceTeams.filter((t) => preferredTeams.includes(t.id)).map((t) => t.name).join(", "),
    [preferredTeams]
  );

  const toggleMood = (mood: string) =>
    setMoods((prev) => (prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]));

  const toggleTeam = (id: string) =>
    setPreferredTeams((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const handleGenerate = () => {
    const payload = { topic, scripture, worshipType, moods, preferredTeams, songCount: totalCount, slowCount, fastCount };
    const validation = validateRecommendInput(payload);
    if (validation) { setError(validation); return; }

    setLoading(true);
    setError("");
    try {
      const input = normalizeRecommendInput(payload);
      const allSongs = [...songCatalog, ...customSongs];
      const draft = buildRecommendation(input, allSongs, referenceTeams);
      setDraft(draft);
    } catch {
      setError("추천 결과를 생성하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSong = (song: Song) => {
    if (editingSong) { updateCustomSong(song.id, song); } else { addCustomSong(song); }
    setEditingSong(null);
  };

  return (
    <section className="panel panel-input">
      <div className="split-header">
        <div>
          <div className="panel-header-bar input-bar">
            <span className="panel-step">STEP 1</span>
            <h2>새 콘티 만들기</h2>
          </div>
          <p className="hint">주제 또는 성경본문 중 하나 이상 입력하면 초안을 생성합니다.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="field">
          <label className="label" htmlFor="church-name">교회 이름</label>
          <input id="church-name" className="input" value={churchName} onChange={(e) => setChurchName(e.target.value)} placeholder="예: 00교회" />
        </div>
        <div className="field">
          <label className="label">예배 날짜</label>
          <CalendarPicker value={worshipDate} onChange={setWorshipDate} />
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="topic">주제 (선택)</label>
        <input id="topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="예: 회복과 헌신" />
      </div>

      <div className="field">
        <label className="label" htmlFor="scripture">성경본문 (선택)</label>
        <input id="scripture" className="input" value={scripture} onChange={(e) => setScripture(e.target.value)} placeholder="예: 이사야 61장 1-3절" />
      </div>

      <div className="field">
        <label className="label" htmlFor="worship-type">예배유형</label>
        <select id="worship-type" className="select" value={worshipType} onChange={(e) => setWorshipType(e.target.value)}>
          {worshipTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="field">
        <span className="label">분위기</span>
        <div className="option-grid">
          {moodOptions.map((m) => (
            <button key={m} type="button" className={`tag-button ${moods.includes(m) ? "active" : ""}`} onClick={() => toggleMood(m)}>{m}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="label">참고 예배팀 성향</span>
        <div className="option-grid">
          {referenceTeams.map((team) => (
            <button key={team.id} type="button" className={`tag-button ${preferredTeams.includes(team.id) ? "active" : ""}`} onClick={() => toggleTeam(team.id)}>
              {team.name}
            </button>
          ))}
        </div>
        <p className="hint">
          현재 선택: {teamSummary || "선택 없음"}<br />
          공식 제휴가 아닌, 공개적으로 확인 가능한 예배 흐름을 참고하는 가중치입니다.
        </p>
      </div>

      <div className="field">
        <span className="label">곡 수 구성 (총 {totalCount}곡)</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="hint" htmlFor="slow-count">느린곡</label>
            <select id="slow-count" className="select" value={slowCount} onChange={(e) => setSlowCount(Number(e.target.value))}>
              {Array.from({ length: 10 }, (_, i) => i).map((n) => (
                <option key={n} value={n} disabled={n + fastCount > 10}>{n}곡</option>
              ))}
            </select>
          </div>
          <div>
            <label className="hint" htmlFor="fast-count">빠른곡</label>
            <select id="fast-count" className="select" value={fastCount} onChange={(e) => setFastCount(Number(e.target.value))}>
              {Array.from({ length: 10 }, (_, i) => i).map((n) => (
                <option key={n} value={n} disabled={n + slowCount > 10}>{n}곡</option>
              ))}
            </select>
          </div>
        </div>
        <p className="hint">느린곡 (BPM 95 미만) / 빠른곡 (BPM 95 이상) 기준으로 배분합니다.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="button-row">
        <button className="primary-button" type="button" onClick={handleGenerate} disabled={loading}>
          {loading ? "생성 중..." : "콘티 생성"}
        </button>
        <button className="ghost-button" type="button" onClick={resetDraft}>초기화</button>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="split-header">
          <span className="label">내 곡 카탈로그 ({songCatalog.length + customSongs.length}곡)</span>
          <button className="ghost-button" type="button" onClick={() => { setEditingSong(null); setSongEditorOpen(true); }}>+ 새 곡 등록</button>
        </div>
        {customSongs.length > 0 && (
          <div className="custom-song-list">
            {customSongs.map((song) => (
              <div key={song.id} className="custom-song-row">
                <span>{song.title}</span>
                <button className="ghost-button" type="button" onClick={() => { setEditingSong(song); setSongEditorOpen(true); }} style={{ padding: "4px 8px", fontSize: 12 }}>편집</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="notice" style={{ marginTop: 16 }}>
        추천 로직은 피아워십, 예람워십, 마커스워십, 아이자야씩스티원, 제이어스, WELOVE, 예전단화요모임의
        공개적으로 확인 가능한 예배 흐름과 곡 메타정보를 참고해 설계되었습니다.
        공식 제휴 또는 공식 제공 콘텐츠를 의미하지 않습니다.
      </div>

      <SongEditorModal open={songEditorOpen} onClose={() => setSongEditorOpen(false)} onSave={handleSaveSong} onDelete={deleteCustomSong} song={editingSong} />
    </section>
  );
}
