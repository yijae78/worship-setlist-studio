export const STORAGE_KEYS = {
  currentDraft: "worship:setlist:current",
  savedDrafts: "worship:setlist:saved",
  settings: "worship:setlist:settings"
} as const;

export const MAX_SAVED_DRAFTS = 20;
export const MAX_STORAGE_WARNING_MB = 4;

export const MAX_ATTACHMENT_MB = 1;
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;

export const SECTION_LABELS = {
  opening: "도입",
  confession: "고백",
  grace: "은혜",
  response: "결단",
  sending: "파송"
} as const;
