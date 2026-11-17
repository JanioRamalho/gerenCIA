import type { ReactNode } from "react";

export type IconName = "calendar" | "receipt" | "tags" | "rows" | "columns" | "food" | "car" | "heart" | "book" | "home" | "bag" | "repeat" | "tool" | "plane" | "spark" | "more" | "arrow" | "upload" | "user" | "bell" | "search" | "logout";

// One drawn set: 24px grid, 1.75 stroke, round ends.
const shapes: Record<IconName, ReactNode> = {
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  receipt: <><path d="M6.5 3.5h11v17l-2.75-1.75L12 20.5l-2.75-1.75L6.5 20.5v-17Z" /><path d="M9.5 8.5h5M9.5 12h5M9.5 15.5h3" /></>,
  tags: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></>,
  rows: <path d="M4.5 6.5h15M4.5 12h9M4.5 17.5h12" />,
  columns: <path d="M6 19.5v-6M12 19.5V9M18 19.5V4.5" />,
  food: <><path d="M5 3v6a3 3 0 0 0 6 0V3M8 3v18M18 3c-3 3-3 7 0 9h2M20 3v18" /></>,
  car: <><path d="m5 8 2-4h10l2 4M4 16h16V9H4v7ZM6 16v4M18 16v4M7 12h1M16 12h1" /></>,
  heart: <><path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-4 4 1 10 8 15 7-5 12-11 8-15Z" /><path d="M5 11h4l2-3 2 7 2-4h4" /></>,
  book: <><path d="M12 6v15M12 6C9 3 5 3 3 4v15c4-1 6-1 9 2 3-3 5-3 9-2V4c-2-1-6-1-9 2Z" /></>,
  home: <><path d="m3 11 9-8 9 8M5 9v12h14V9M9 21v-8h6v8" /></>,
  bag: <><path d="M4 7h16l-1 14H5L4 7ZM8 8V6a4 4 0 0 1 8 0v2" /></>,
  repeat: <><path d="M20 8H5l3-3M4 16h15l-3 3M20 8v5M4 16v-5" /></>,
  tool: <><path d="m14 4 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5ZM5 16l-2 5 5-2" /></>,
  plane: <><path d="m3 11 7 2 4 8 2-1-1-7 6-6c3-3 0-6-3-3l-6 6-7-1-2 2Z" /></>,
  spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  bell: <><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3ZM10 21h4" /></>,
  search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
  logout: <><path d="M10 4H4v16h6M8 12h13m-4-4 4 4-4 4" /></>,
};

export default function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}
