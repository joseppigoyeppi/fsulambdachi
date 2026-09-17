"use client";

import type { RankId } from "@/lib/ranks";
import { cn } from "@/lib/utils";

/*
  One badge per rank: a shield with a metallic gradient, the rank's emblem in the
  middle, and a tiny ΛΧΑ at the base. Bronze/Silver/Gold count cans, Platinum is a
  gem, Alcoholic is a can on fire wearing a crown. Pure SVG so it scales anywhere.
*/

const PALETTE: Record<RankId, { top: string; bottom: string; rim: string; glow: string; ink: string }> = {
  bronze: { top: "#d69a5f", bottom: "#6e3f1c", rim: "#f0c39a", glow: "rgba(214,154,95,0.45)", ink: "#3a1f0c" },
  silver: { top: "#f1f1f1", bottom: "#7d8288", rim: "#ffffff", glow: "rgba(220,224,230,0.45)", ink: "#2b2f35" },
  gold: { top: "#ffe08a", bottom: "#a8730b", rim: "#fff3c4", glow: "rgba(255,215,120,0.5)", ink: "#4a3000" },
  platinum: { top: "#f6faff", bottom: "#8fa6c2", rim: "#ffffff", glow: "rgba(170,200,255,0.55)", ink: "#1f3550" },
  alcoholic: { top: "#ff8a4c", bottom: "#7a1140", rim: "#ffd166", glow: "rgba(255,110,70,0.6)", ink: "#3a0a20" },
};

function Can({ x, y, scale = 1, tilt = 0, ink }: { x: number; y: number; scale?: number; tilt?: number; ink: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${scale})`}>
      <rect x="-7" y="-14" width="14" height="28" rx="3.5" fill={ink} opacity="0.85" />
      <rect x="-7" y="-12" width="14" height="3" rx="1.5" fill="#fff" opacity="0.35" />
      <rect x="-5" y="-4" width="10" height="9" rx="1.5" fill="#fff" opacity="0.5" />
      <rect x="-2" y="-16" width="4" height="3" rx="1" fill={ink} />
    </g>
  );
}

function Emblem({ rank, ink }: { rank: RankId; ink: string }) {
  switch (rank) {
    case "bronze":
      return <Can x={0} y={2} scale={1.15} ink={ink} />;
    case "silver":
      return (
        <>
          <Can x={-9} y={3} tilt={-10} ink={ink} />
          <Can x={9} y={3} tilt={10} ink={ink} />
        </>
      );
    case "gold":
      return (
        <>
          <Can x={-15} y={5} tilt={-16} scale={0.92} ink={ink} />
          <Can x={0} y={0} scale={1.05} ink={ink} />
          <Can x={15} y={5} tilt={16} scale={0.92} ink={ink} />
        </>
      );
    case "platinum":
      return (
        <g>
          <polygon points="0,-18 16,-6 0,20 -16,-6" fill={ink} opacity="0.85" />
          <polygon points="0,-18 16,-6 -16,-6" fill="#fff" opacity="0.45" />
          <polygon points="-16,-6 0,20 0,-6" fill="#fff" opacity="0.18" />
          <polygon points="0,-18 6,-6 -6,-6" fill="#fff" opacity="0.35" />
        </g>
      );
    case "alcoholic":
      return (
        <g>
          <path d="M-6 -30 C -2 -38, 4 -38, 4 -30 C 6 -34, 10 -34, 9 -26 C 12 -22, 8 -18, 4 -19 C 6 -24, 2 -26, 0 -22 C -2 -26, -6 -24, -4 -19 C -9 -18, -12 -22, -10 -26 C -11 -32, -8 -33, -6 -30 Z" fill="#ffd166" opacity="0.95" />
          <path d="M-3 -28 C -1 -32, 3 -32, 2 -27 C 4 -25, 2 -22, 0 -22 C -2 -22, -4 -25, -3 -28 Z" fill="#ff5e3a" />
          <Can x={0} y={3} scale={1.15} ink={ink} />
          <path d="M-13 -13 L-13 -22 L-8 -17 L-3 -24 L3 -24 L8 -17 L13 -22 L13 -13 Z" fill="#ffd166" opacity="0" />
        </g>
      );
  }
}

interface RankBadgeProps {
  rank: RankId;
  className?: string;
  /** Adds the rank name under the shield. */
  label?: string;
}

export function RankBadge({ rank, className, label }: RankBadgeProps) {
  const p = PALETTE[rank];
  const id = `rank-${rank}`;
  return (
    <svg viewBox="0 0 100 116" className={cn("block", className)} role="img" aria-label={label ? `${label} rank badge` : `${rank} badge`}>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.top} />
          <stop offset="1" stopColor={p.bottom} />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor={p.glow} />
          <stop offset="1" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="56" r="50" fill={`url(#${id}-glow)`} />
      {/* shield */}
      <path d="M50 6 L86 18 V54 C86 76 70 94 50 104 C30 94 14 76 14 54 V18 Z" fill={`url(#${id}-fill)`} stroke={p.rim} strokeWidth="2" strokeOpacity="0.9" />
      <path d="M50 12 L80 22 V54 C80 72 67 87 50 96 C33 87 20 72 20 54 V22 Z" fill="none" stroke={p.ink} strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M50 6 L86 18 V40 C70 30 40 24 14 30 V18 Z" fill={`url(#${id}-shine)`} />
      <g transform="translate(50 52)">
        <Emblem rank={rank} ink={p.ink} />
      </g>
      <text x="50" y="86" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill={p.ink} opacity="0.8" letterSpacing="1.5">
        ΛΧΑ
      </text>
      {label && (
        <text x="50" y="113" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="9" fontWeight="600" fill="currentColor" letterSpacing="2">
          {label.toUpperCase()}
        </text>
      )}
    </svg>
  );
}
