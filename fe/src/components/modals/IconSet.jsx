import React from "react";

const base = {
  width: 26,
  height: 26,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor", 
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const CalendarIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 9h18" />
    <rect x="7.5" y="12" width="3" height="3" rx="0.5" />
  </svg>
);

export const TrashIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3.5 7h17" />
    <path d="M9.5 7l.7 12M13.8 7L13.1 19" />
    <path d="M10 3h4" />
    <rect x="6" y="7" width="12" height="14" rx="2" />
  </svg>
);

export const RepeatIcon = (p) => (
  <svg {...base} {...p}>
   
    <path d="M21 12a9 9 0 1 1-9-9" />
    <path d="M21 3v6h-6" />
  </svg>
);

export const ColorDot = ({ color, ...p }) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8" fill={color ? color : "none"} />
  </svg>
);

export const BellIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M6 16v-4a6 6 0 1 1 12 0v4" />
    <path d="M8 17h8" />
    <path d="M10 17a2 2 0 0 0 4 0" />
  </svg>
);

export const UserPlusIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="10" cy="8" r="3" />
    <path d="M4 19a6 6 0 0 1 12 0" />
    <path d="M18 8h4M20 6v4" />
  </svg>
);

export const KebabIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="7" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="17" cy="12" r="1.6" />
  </svg>
);

export default {
  CalendarIcon,
  TrashIcon,
  RepeatIcon,
  ColorDot,
  BellIcon,
  UserPlusIcon,
  KebabIcon,
};
