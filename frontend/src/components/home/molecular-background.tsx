"use client";

import { motion, useReducedMotion } from "framer-motion";
import * as React from "react";

/**
 * Animated molecular lattice behind the hero.
 * Node positions are deterministic (seeded), so SSR and the client agree.
 */

type Node = { x: number; y: number; r: number; delay: number };

const NODES: Node[] = [
  { x: 12, y: 22, r: 5, delay: 0 },
  { x: 26, y: 12, r: 3.5, delay: 0.4 },
  { x: 38, y: 30, r: 6, delay: 0.8 },
  { x: 22, y: 44, r: 4, delay: 1.2 },
  { x: 8, y: 58, r: 3, delay: 0.6 },
  { x: 34, y: 62, r: 5, delay: 1.6 },
  { x: 52, y: 18, r: 4.5, delay: 0.2 },
  { x: 64, y: 38, r: 6.5, delay: 1.0 },
  { x: 50, y: 52, r: 3.5, delay: 1.4 },
  { x: 76, y: 20, r: 4, delay: 0.5 },
  { x: 88, y: 42, r: 5.5, delay: 1.1 },
  { x: 72, y: 62, r: 4, delay: 1.8 },
  { x: 90, y: 70, r: 3, delay: 0.9 },
  { x: 58, y: 78, r: 4.5, delay: 2.0 },
  { x: 20, y: 82, r: 3.5, delay: 1.5 },
  { x: 42, y: 88, r: 3, delay: 0.7 },
];

// Index pairs that form the bond lattice.
const BONDS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [3, 5], [2, 6], [6, 7],
  [7, 8], [8, 5], [6, 9], [9, 10], [10, 11], [7, 11], [11, 12],
  [11, 13], [8, 13], [5, 14], [14, 15], [15, 13],
];

export const MolecularBackground = () => {
  const reduced = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Drifting colour fields */}
      <div
        className="absolute -top-32 -left-24 size-[38rem] rounded-full bg-[var(--brand-primary)]/12
                   blur-[110px] motion-safe:animate-[drift_24s_ease-in-out_infinite]"
      />
      <div
        className="absolute top-1/3 -right-32 size-[34rem] rounded-full bg-[var(--brand-emerald)]/10
                   blur-[110px] motion-safe:animate-[drift_30s_ease-in-out_infinite_reverse]"
      />
      <div
        className="absolute -bottom-40 left-1/4 size-[30rem] rounded-full bg-[var(--brand-accent)]/10
                   blur-[110px] motion-safe:animate-[drift_27s_ease-in-out_infinite]"
      />

      {/* Molecular lattice */}
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="bond-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--brand-emerald)" stopOpacity="0.22" />
          </linearGradient>
          <radialGradient id="node-gradient">
            <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0.35" />
          </radialGradient>
        </defs>

        {BONDS.map(([from, to], index) => {
          const a = NODES[from];
          const b = NODES[to];
          return (
            <motion.line
              key={`bond-${index}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#bond-gradient)"
              strokeWidth={0.18}
              initial={reduced ? undefined : { pathLength: 0, opacity: 0 }}
              animate={reduced ? undefined : { pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.6, delay: index * 0.045, ease: "easeOut" }}
            />
          );
        })}

        {NODES.map((node, index) => (
          <motion.circle
            key={`node-${index}`}
            cx={node.x}
            cy={node.y}
            r={node.r / 8}
            fill="url(#node-gradient)"
            initial={reduced ? undefined : { scale: 0, opacity: 0 }}
            animate={
              reduced
                ? undefined
                : { scale: [0, 1, 0.9, 1], opacity: [0, 1, 0.75, 1] }
            }
            transition={{
              duration: 5,
              delay: node.delay,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            style={{ transformOrigin: `${node.x}px ${node.y}px` }}
          />
        ))}
      </svg>

      {/* Rising particles — the "reaction" layer */}
      <div className="absolute inset-0">
        {Array.from({ length: 14 }).map((_, index) => {
          const left = (index * 37) % 100;
          const size = 3 + ((index * 7) % 5);
          const duration = 11 + ((index * 3) % 9);
          return (
            <motion.span
              key={`particle-${index}`}
              className="absolute rounded-full bg-[var(--brand-primary)]/25"
              style={{
                left: `${left}%`,
                bottom: "-6%",
                width: size,
                height: size,
              }}
              initial={reduced ? undefined : { y: 0, opacity: 0 }}
              animate={
                reduced
                  ? undefined
                  : { y: ["0vh", "-92vh"], opacity: [0, 0.85, 0], x: [0, index % 2 ? 26 : -26, 0] }
              }
              transition={{
                duration,
                delay: index * 0.85,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          );
        })}
      </div>

      {/* Fade the lattice into the page */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
};
