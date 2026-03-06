export type FlowSection =
  | "opening"
  | "confession"
  | "grace"
  | "response"
  | "sending";

export type ReferenceTeam = {
  id: string;
  name: string;
  description: string;
  styleTags: string[];
  flowBias: FlowSection[];
  emphasis: string[];
  sourceNote?: string;
};
