import type { ReactNode } from "react";

export type IconName = "calendar" | "receipt" | "tags" | "rows" | "columns" | "home" | "files" | "target" | "user" | "bell" | "upload" | "arrow" | "check" | "search";

// One drawn set: 24px grid, 1.75 stroke, round ends.
const shapes: Record<IconName, ReactNode> = {
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  receipt: <><path d="M6.5 3.5h11v17l-2.75-1.75L12 20.5l-2.75-1.75L6.5 20.5v-17Z" /><path d="M9.5 8.5h5M9.5 12h5M9.5 15.5h3" /></>,
  tags: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></>,
  rows: <path d="M4.5 6.5h15M4.5 12h9M4.5 17.5h12" />,
  columns: <path d="M6 19.5v-6M12 19.5V9M18 19.5V4.5" />,
  home: <><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M8 15.5v-3m4 3V8.5m4 7v-5" /></>,
  files: <><path d="M3.5 7a2 2 0 0 1 2-2H10l2 2h6.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" /><path d="M3.5 10h17" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>,
  user: <><circle cx="12" cy="8" r="3.25" /><path d="M5 20v-1a7 7 0 0 1 14 0v1" /></>,
  bell: <path d="M10 20a2.2 2.2 0 0 0 4 0M5.5 16.5h13l-1.5-2.8V9a5 5 0 0 0-10 0v4.7Z" />,
  upload: <path d="M12 15V4m-4 4 4-4 4 4M4.5 14v4a2 2 0 0 0 2 2v-4" />,
  arrow: <path d="M4.5 12h14m-5-5 5 5-5 5" />,
  check: <path d="m5.5 12.5 4 4 9-9" />,
  search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" /></>,
};

export default function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}
