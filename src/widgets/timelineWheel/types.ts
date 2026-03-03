export type TimelineEvent = {
  id: string;
  year: number;
  title?: string;
  description?: string;
};

export type Period = {
  id: string;
  label: string;
  from: number;
  to: number;
  events: TimelineEvent[];
};
