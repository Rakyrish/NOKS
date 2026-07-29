"use client";

import { motion, useReducedMotion } from "framer-motion";

import { brand } from "@/lib/site";

/**
 * Animated laboratory scene — bubbling reagents in a glass card.
 * Pure SVG so it stays crisp, weighs nothing and needs no image request.
 */
export const LabIllustration = () => {
  const reduced = useReducedMotion();

  const bubbles = [
    { cx: 62, cy: 150, r: 3.2, delay: 0 },
    { cx: 70, cy: 158, r: 2.2, delay: 0.7 },
    { cx: 55, cy: 162, r: 2.6, delay: 1.3 },
    { cx: 66, cy: 168, r: 1.8, delay: 2.0 },
  ];

  const flaskBubbles = [
    { cx: 196, cy: 152, r: 2.8, delay: 0.4 },
    { cx: 205, cy: 160, r: 2.0, delay: 1.1 },
    { cx: 188, cy: 165, r: 2.4, delay: 1.8 },
  ];

  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* Glow behind the glass card */}
      <div
        className="absolute inset-6 rounded-[2.5rem] bg-[var(--brand-primary)]/12 blur-3xl"
        aria-hidden
      />

      <div
        className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/70
                   p-6 shadow-[0_28px_70px_-30px_rgba(7,18,51,0.45)] backdrop-blur-xl sm:p-8"
      >
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />

        <svg
          viewBox="0 0 300 240"
          className="relative w-full"
          role="img"
          aria-label="Laboratory glassware with reagents"
        >
          <defs>
            <linearGradient id="liquid-blue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="liquid-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-emerald-light)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--brand-emerald)" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="glass-sheen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.15" />
            </linearGradient>

            <clipPath id="beaker-clip">
              <path d="M44 108 h44 v62 a10 10 0 0 1 -10 10 h-24 a10 10 0 0 1 -10 -10 z" />
            </clipPath>
            <clipPath id="flask-clip">
              <path d="M186 108 l-24 58 a12 12 0 0 0 11 17 h44 a12 12 0 0 0 11 -17 l-24 -58 z" />
            </clipPath>
            <clipPath id="tube-clip">
              <path d="M256 96 h20 v78 a10 10 0 0 1 -20 0 z" />
            </clipPath>
          </defs>

          {/* ── Beaker ─────────────────────────────────────── */}
          <g>
            <path
              d="M44 108 h44 v62 a10 10 0 0 1 -10 10 h-24 a10 10 0 0 1 -10 -10 z"
              fill="url(#glass-sheen)"
              stroke="var(--brand-navy)"
              strokeOpacity="0.28"
              strokeWidth="2"
            />
            <g clipPath="url(#beaker-clip)">
              <motion.rect
                x="42"
                width="48"
                fill="url(#liquid-blue)"
                initial={reduced ? { y: 132, height: 50 } : { y: 182, height: 0 }}
                animate={{ y: 132, height: 50 }}
                transition={{ duration: 1.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* Meniscus */}
              <motion.ellipse
                cx="66"
                rx="24"
                ry="3"
                fill="#ffffff"
                fillOpacity="0.35"
                initial={{ cy: 132 }}
                animate={reduced ? { cy: 132 } : { cy: [132, 130, 132] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
              />
              {!reduced &&
                bubbles.map((bubble, index) => (
                  <motion.circle
                    key={index}
                    cx={bubble.cx}
                    r={bubble.r}
                    fill="#ffffff"
                    fillOpacity="0.55"
                    initial={{ cy: bubble.cy, opacity: 0 }}
                    animate={{ cy: [bubble.cy, 136], opacity: [0, 0.8, 0] }}
                    transition={{
                      duration: 2.6,
                      delay: 1.6 + bubble.delay,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                ))}
            </g>
            {/* Graduation marks */}
            {[124, 138, 152, 166].map((y) => (
              <line
                key={y}
                x1="50"
                y1={y}
                x2="60"
                y2={y}
                stroke="var(--brand-navy)"
                strokeOpacity="0.25"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ))}
            <rect
              x="40"
              y="102"
              width="52"
              height="7"
              rx="3.5"
              fill="var(--brand-navy)"
              fillOpacity="0.14"
            />
          </g>

          {/* ── Erlenmeyer flask ───────────────────────────── */}
          <g>
            <path
              d="M186 108 l-24 58 a12 12 0 0 0 11 17 h44 a12 12 0 0 0 11 -17 l-24 -58 z"
              fill="url(#glass-sheen)"
              stroke="var(--brand-navy)"
              strokeOpacity="0.28"
              strokeWidth="2"
            />
            <g clipPath="url(#flask-clip)">
              <motion.rect
                x="158"
                width="70"
                fill="url(#liquid-green)"
                initial={reduced ? { y: 146, height: 40 } : { y: 186, height: 0 }}
                animate={{ y: 146, height: 40 }}
                transition={{ duration: 1.4, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
              {!reduced &&
                flaskBubbles.map((bubble, index) => (
                  <motion.circle
                    key={index}
                    cx={bubble.cx}
                    r={bubble.r}
                    fill="#ffffff"
                    fillOpacity="0.5"
                    initial={{ cy: bubble.cy, opacity: 0 }}
                    animate={{ cy: [bubble.cy, 150], opacity: [0, 0.75, 0] }}
                    transition={{
                      duration: 2.4,
                      delay: 1.8 + bubble.delay,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                ))}
            </g>
            <rect x="180" y="96" width="20" height="13" rx="3" fill="var(--brand-navy)" fillOpacity="0.12" />
            {/* Escaping vapour */}
            {!reduced &&
              [0, 1, 2].map((index) => (
                <motion.circle
                  key={index}
                  cx={190 + index * 5}
                  r={2.4}
                  fill="var(--brand-emerald)"
                  fillOpacity="0.28"
                  initial={{ cy: 94, opacity: 0 }}
                  animate={{ cy: [94, 58], opacity: [0, 0.5, 0], scale: [0.6, 1.5, 1.9] }}
                  transition={{
                    duration: 3.4,
                    delay: index * 1.1,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              ))}
          </g>

          {/* ── Test tube ──────────────────────────────────── */}
          <g>
            <path
              d="M256 96 h20 v78 a10 10 0 0 1 -20 0 z"
              fill="url(#glass-sheen)"
              stroke="var(--brand-navy)"
              strokeOpacity="0.28"
              strokeWidth="2"
            />
            <g clipPath="url(#tube-clip)">
              <motion.rect
                x="254"
                width="24"
                fill="url(#liquid-blue)"
                initial={reduced ? { y: 128, height: 58 } : { y: 186, height: 0 }}
                animate={{ y: 128, height: 58 }}
                transition={{ duration: 1.3, delay: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            </g>
            <rect x="253" y="90" width="26" height="7" rx="3.5" fill="var(--brand-navy)" fillOpacity="0.14" />
          </g>

          {/* ── Bench ──────────────────────────────────────── */}
          <motion.rect
            x="24"
            y="188"
            height="4"
            rx="2"
            fill="var(--brand-navy)"
            fillOpacity="0.14"
            initial={reduced ? { width: 260 } : { width: 0 }}
            animate={{ width: 260 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          />

          {/* Molecule diagram floating above */}
          <g opacity="0.55">
            {[
              [110, 52],
              [136, 38],
              [160, 54],
              [136, 70],
            ].map(([cx, cy], index) => (
              <motion.circle
                key={index}
                cx={cx}
                cy={cy}
                r="4.5"
                fill="var(--brand-primary)"
                initial={reduced ? { opacity: 0.8 } : { opacity: 0, scale: 0 }}
                animate={{ opacity: [0.5, 1, 0.5], scale: 1 }}
                transition={{
                  duration: 3,
                  delay: 0.8 + index * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />
            ))}
            {[
              [110, 52, 136, 38],
              [136, 38, 160, 54],
              [160, 54, 136, 70],
              [136, 70, 110, 52],
            ].map(([x1, y1, x2, y2], index) => (
              <motion.line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--brand-primary)"
                strokeOpacity="0.4"
                strokeWidth="1.4"
                initial={reduced ? undefined : { pathLength: 0 }}
                animate={reduced ? undefined : { pathLength: 1 }}
                transition={{ duration: 1, delay: 0.9 + index * 0.15, ease: "easeOut" }}
              />
            ))}
          </g>
        </svg>

        {/* Floating spec chips */}
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="absolute top-7 left-6 rounded-xl border border-line bg-white/90 px-3 py-2
                     shadow-[var(--shadow-soft)] backdrop-blur-sm"
        >
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">
            Assay
          </p>
          <p className="font-display text-sm font-bold text-navy-900">≥ 98.0%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="absolute right-6 bottom-7 rounded-xl border border-line bg-white/90 px-3 py-2
                     shadow-[var(--shadow-soft)] backdrop-blur-sm"
        >
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">
            Batch COA
          </p>
          <p className="flex items-center gap-1.5 font-display text-sm font-bold text-navy-900">
            <span className="size-1.5 rounded-full bg-[var(--brand-emerald)]" />
            Verified
          </p>
        </motion.div>
      </div>

      <p className="mt-4 text-center text-[12px] text-slate-400">
        {brand.name} quality control — every batch, every delivery.
      </p>
    </div>
  );
};
