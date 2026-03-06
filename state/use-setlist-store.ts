"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AttachmentMeta, FlowSection, SetlistDraft, SetlistItem, Song } from "@/types";
import { STORAGE_KEYS, MAX_SAVED_DRAFTS } from "@/lib/constants";
import { nowIso, uid } from "@/lib/helpers";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type StoreState = {
  currentDraft: SetlistDraft | null;
  savedDrafts: SetlistDraft[];
  customSongs: Song[];
  saveStatus: SaveStatus;
  wizardStep: number;
  churchName: string;
  worshipDate: string;
  footerNote: string;

  setDraft: (draft: SetlistDraft) => void;
  resetDraft: () => void;
  setChurchName: (name: string) => void;
  setWorshipDate: (date: string) => void;
  setFooterNote: (note: string) => void;
  setWizardStep: (step: number) => void;
  confirmDraft: () => void;

  saveDraftToHistory: () => void;
  restoreDraft: (draftId: string) => void;
  deleteSavedDraft: (draftId: string) => void;

  moveItem: (itemId: string, direction: "up" | "down") => void;
  reorderItem: (fromIndex: number, toIndex: number) => void;
  removeItem: (itemId: string) => void;
  addItem: (song: Song, section: FlowSection) => void;
  replaceItem: (itemId: string, song: Song) => void;
  duplicateItem: (itemId: string) => void;
  updateItemMemo: (itemId: string, memo: string) => void;
  updateItemSection: (itemId: string, section: FlowSection) => void;
  updateItemKey: (itemId: string, key: string) => void;

  attachFile: (itemId: string, attachment: AttachmentMeta) => void;
  removeAttachment: (itemId: string, attachmentId: string) => void;

  addCustomSong: (song: Song) => void;
  updateCustomSong: (songId: string, updates: Partial<Song>) => void;
  deleteCustomSong: (songId: string) => void;
};

function touchDraft(draft: SetlistDraft): SetlistDraft {
  return { ...draft, updatedAt: nowIso() };
}

function stripAttachmentData(draft: SetlistDraft): SetlistDraft {
  return {
    ...draft,
    items: draft.items.map((item) => ({
      ...item,
      attachments: item.attachments.map(({ dataUrl: _d, ...rest }) => rest)
    }))
  };
}

export const useSetlistStore = create<StoreState>()(
  persist(
    (set) => ({
      currentDraft: null,
      savedDrafts: [],
      customSongs: [],
      saveStatus: "idle",
      wizardStep: 1,
      churchName: "",
      worshipDate: "",
      footerNote: "",

      setDraft: (draft) => set({ currentDraft: draft, saveStatus: "saved", wizardStep: 2 }),
      resetDraft: () => set({ currentDraft: null, saveStatus: "idle", wizardStep: 1 }),
      setChurchName: (name) => set({ churchName: name }),
      setWorshipDate: (date) => set({ worshipDate: date }),
      setFooterNote: (note) => set({ footerNote: note }),
      setWizardStep: (step) => set({ wizardStep: step }),

      confirmDraft: () =>
        set((state) => {
          if (!state.currentDraft) return state;
          const confirmed = touchDraft({
            ...state.currentDraft,
            status: "confirmed",
            items: state.currentDraft.items.map((it) => ({ ...it, confirmed: true }))
          });
          const stripped = stripAttachmentData(confirmed);
          const others = state.savedDrafts.filter((d) => d.id !== confirmed.id);
          return {
            currentDraft: confirmed,
            savedDrafts: [stripped, ...others].slice(0, MAX_SAVED_DRAFTS),
            saveStatus: "saved",
            wizardStep: 4
          };
        }),

      saveDraftToHistory: () =>
        set((state) => {
          if (!state.currentDraft) return state;
          const stripped = stripAttachmentData(state.currentDraft);
          const others = state.savedDrafts.filter((d) => d.id !== stripped.id);
          return { savedDrafts: [stripped, ...others].slice(0, MAX_SAVED_DRAFTS) };
        }),

      restoreDraft: (draftId) =>
        set((state) => {
          const found = state.savedDrafts.find((d) => d.id === draftId);
          if (!found) return state;
          return { currentDraft: { ...found, status: "draft", updatedAt: nowIso() }, saveStatus: "saved" };
        }),

      deleteSavedDraft: (draftId) =>
        set((state) => ({ savedDrafts: state.savedDrafts.filter((d) => d.id !== draftId) })),

      moveItem: (itemId, direction) =>
        set((state) => {
          if (!state.currentDraft) return state;
          const items = [...state.currentDraft.items];
          const idx = items.findIndex((it) => it.id === itemId);
          if (idx === -1) return state;
          const target = direction === "up" ? idx - 1 : idx + 1;
          if (target < 0 || target >= items.length) return state;
          [items[idx], items[target]] = [items[target], items[idx]];
          const reordered = items.map((it, i) => ({ ...it, order: i + 1 }));
          return { currentDraft: touchDraft({ ...state.currentDraft, items: reordered }), saveStatus: "saved" };
        }),

      reorderItem: (fromIndex, toIndex) =>
        set((state) => {
          if (!state.currentDraft) return state;
          const items = [...state.currentDraft.items];
          const [moved] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, moved);
          const reordered = items.map((it, i) => ({ ...it, order: i + 1 }));
          return { currentDraft: touchDraft({ ...state.currentDraft, items: reordered }), saveStatus: "saved" };
        }),

      removeItem: (itemId) =>
        set((state) => {
          if (!state.currentDraft) return state;
          const next = state.currentDraft.items
            .filter((it) => it.id !== itemId)
            .map((it, i) => ({ ...it, order: i + 1 }));
          return { currentDraft: touchDraft({ ...state.currentDraft, items: next }), saveStatus: "saved" };
        }),

      addItem: (song, section) =>
        set((state) => {
          if (!state.currentDraft) return state;
          const newItem: SetlistItem = {
            id: uid("item"),
            order: state.currentDraft.items.length + 1,
            title: song.title,
            songId: song.id,
            section,
            selectedKey: song.key ?? song.availableKeys?.[0],
            reason: "수동으로 추가된 곡입니다.",
            memo: "",
            attachments: [],
            confirmed: false
          };
          return {
            currentDraft: touchDraft({ ...state.currentDraft, items: [...state.currentDraft.items, newItem] }),
            saveStatus: "saved"
          };
        }),

      replaceItem: (itemId, song) =>
        set((state) => {
          if (!state.currentDraft) return state;
          const items = state.currentDraft.items.map((it) =>
            it.id === itemId
              ? { ...it, title: song.title, songId: song.id, selectedKey: song.key ?? song.availableKeys?.[0], reason: "교체된 곡입니다.", confirmed: false }
              : it
          );
          return { currentDraft: touchDraft({ ...state.currentDraft, items }), saveStatus: "saved" };
        }),

      duplicateItem: (itemId) =>
        set((state) => {
          if (!state.currentDraft) return state;
          const items = [...state.currentDraft.items];
          const idx = items.findIndex((it) => it.id === itemId);
          if (idx === -1) return state;
          const src = items[idx];
          const clone: SetlistItem = { ...src, id: uid("item"), confirmed: false, attachments: [...src.attachments] };
          items.splice(idx + 1, 0, clone);
          const renumbered = items.map((it, i) => ({ ...it, order: i + 1 }));
          return { currentDraft: touchDraft({ ...state.currentDraft, items: renumbered }), saveStatus: "saved" };
        }),

      updateItemMemo: (itemId, memo) =>
        set((state) => {
          if (!state.currentDraft) return state;
          const items = state.currentDraft.items.map((it) => (it.id === itemId ? { ...it, memo } : it));
          return { currentDraft: touchDraft({ ...state.currentDraft, items }), saveStatus: "saved" };
        }),

      updateItemSection: (itemId, section) =>
        set((state) => {
          if (!state.currentDraft) return state;
          const items = state.currentDraft.items.map((it) => (it.id === itemId ? { ...it, section } : it));
          return { currentDraft: touchDraft({ ...state.currentDraft, items }), saveStatus: "saved" };
        }),

      updateItemKey: (itemId, key) =>
        set((state) => {
          if (!state.currentDraft) return state;
          const items = state.currentDraft.items.map((it) => (it.id === itemId ? { ...it, selectedKey: key } : it));
          return { currentDraft: touchDraft({ ...state.currentDraft, items }), saveStatus: "saved" };
        }),

      attachFile: (itemId, attachment) =>
        set((state) => {
          if (!state.currentDraft) return state;
          const items = state.currentDraft.items.map((it) =>
            it.id === itemId ? { ...it, attachments: [...it.attachments, attachment] } : it
          );
          return { currentDraft: touchDraft({ ...state.currentDraft, items }), saveStatus: "saved" };
        }),

      removeAttachment: (itemId, attachmentId) =>
        set((state) => {
          if (!state.currentDraft) return state;
          const items = state.currentDraft.items.map((it) =>
            it.id === itemId ? { ...it, attachments: it.attachments.filter((f) => f.id !== attachmentId) } : it
          );
          return { currentDraft: touchDraft({ ...state.currentDraft, items }), saveStatus: "saved" };
        }),

      addCustomSong: (song) =>
        set((state) => ({ customSongs: [...state.customSongs, { ...song, isCustom: true }] })),

      updateCustomSong: (songId, updates) =>
        set((state) => ({ customSongs: state.customSongs.map((s) => (s.id === songId ? { ...s, ...updates } : s)) })),

      deleteCustomSong: (songId) =>
        set((state) => ({ customSongs: state.customSongs.filter((s) => s.id !== songId) })),

    }),
    {
      name: STORAGE_KEYS.currentDraft,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentDraft: state.currentDraft,
        savedDrafts: state.savedDrafts,
        customSongs: state.customSongs,
        wizardStep: state.wizardStep,
        churchName: state.churchName,
        worshipDate: state.worshipDate,
        footerNote: state.footerNote
      })
    }
  )
);
