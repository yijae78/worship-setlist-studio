import type { FlowSection } from "@/types/reference-team";

export type AttachmentMeta = {
  id: string;
  name: string;
  type: "image" | "pdf";
  size: number;
  dataUrl?: string;
};

export type SetlistItem = {
  id: string;
  order: number;
  title: string;
  songId?: string;
  section: FlowSection;
  selectedKey?: string;
  reason: string;
  memo: string;
  attachments: AttachmentMeta[];
  confirmed: boolean;
};

export type SetlistDraft = {
  id: string;
  topic: string;
  scripture: string;
  worshipType: string;
  moods: string[];
  preferredTeams: string[];
  songCount: number;
  slowCount: number;
  fastCount: number;
  items: SetlistItem[];
  status: "draft" | "confirmed";
  createdAt: string;
  updatedAt: string;
};
