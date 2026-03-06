import type { FlowSection } from "@/types/reference-team";

export type Song = {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  availableKeys?: string[];
  bpm?: number;
  hymnNumber?: string;
  themeTags: string[];
  scriptureTags: string[];
  moodTags: string[];
  flowTags: FlowSection[];
  sourceTeamIds?: string[];
  notes?: string;
  isCustom?: boolean;
};
