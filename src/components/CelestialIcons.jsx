// src/components/CelestialIcons.jsx
import React, { useId } from "react";

/** Shared gradient stops (pink → lavender → aqua → star-yellow) */
function GradientDefs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-gal`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0"   stopColor="#f5b0cf" />
        <stop offset="0.45" stopColor="#b9a7e1" />
        <stop offset="0.75" stopColor="#7ec3f6" />
        <stop offset="1"   stopColor="#ffe28a" />
      </linearGradient>

      {/* ring stroke gradient */}
      <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0"   stopColor="#ffe28a" />
        <stop offset="0.5" stopColor="#b9a7e1" />
        <stop offset="1"   stopColor="#7ec3f6" />
      </linearGradient>

      {/* soft outer glow */}
      <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="rgba(168,85,247,.65)" />
      </filter>
    </defs>
  );
}

export function PlanetIcon({ className = "", ...props }) {
  const gid = useId(); // unique ids so multiple icons don’t clash
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <GradientDefs id={gid} />
      {/* Saturn-ish planet */}
      <g filter={`url(#${gid}-glow)`}>
        <circle cx="12" cy="12" r="6.5" fill={`url(#${gid}-gal)`} />
        {/* rings */}
        <ellipse cx="12" cy="12.5" rx="9.5" ry="3.1" fill="none" stroke={`url(#${gid}-ring)`} strokeWidth="1.6" opacity=".9"/>
        <ellipse cx="12" cy="10.2" rx="8.3" ry="2.5" fill="none" stroke={`url(#${gid}-ring)`} strokeWidth="1.1" opacity=".45"/>
        {/* tiny sparkles */}
        <circle cx="6.8" cy="7.4" r=".6" fill="#fff" opacity=".85"/>
        <circle cx="17.6" cy="15.7" r=".5" fill="#fff" opacity=".75"/>
      </g>
    </svg>
  );
}

export function MoonIcon({ className = "", ...props }) {
  const gid = useId();
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <defs>
        <radialGradient id={`${gid}-moon`} cx="60%" cy="40%" r="70%">
          <stop offset="0" stopColor="#ffe28a" />
          <stop offset="0.6" stopColor="#f5b0cf" />
          <stop offset="1" stopColor="#b9a7e1" />
        </radialGradient>
        <filter id={`${gid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.1" floodColor="rgba(185,167,225,.75)" />
        </filter>
      </defs>

      {/* crescent */}
      <g filter={`url(#${gid}-glow)`}>
        <path
          d="M20 13.6A8.6 8.6 0 0 1 10.4 4a7.6 7.6 0 1 0 9.6 9.6Z"
          fill={`url(#${gid}-moon)`}
        />
        {/* tiny craters */}
        <circle cx="12.2" cy="9.2" r=".8" fill="#fff" opacity=".35"/>
        <circle cx="14.4" cy="12.6" r=".5" fill="#fff" opacity=".28"/>
      </g>
    </svg>
  );
}

export function SparklesIcon({ className = "", ...props }) {
  const gid = useId();
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <GradientDefs id={gid} />
      <g filter={`url(#${gid}-glow)`}>
        {/* main 4-point star */}
        <path
          d="M12 3.5l1.8 4.3L18 9.6l-4.2 1.8L12 15.8l-1.8-4.4L6 9.6l4.2-1.8L12 3.5Z"
          fill={`url(#${gid}-gal)`}
        />
        {/* two side sparkles */}
        <path d="M18.6 5.2l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7.7-1.5Z" fill={`url(#${gid}-gal)`} opacity=".9"/>
        <path d="M6 15.2l.6 1.3 1.3.6-1.3.6L6 19l-.6-1.3-1.3-.6 1.3-.6.6-1.3Z" fill={`url(#${gid}-gal)`} opacity=".8"/>
      </g>
    </svg>
  );
}
