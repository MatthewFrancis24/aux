import { useId } from 'react'

function darken(hex, factor) {
  const h = hex.replace(/^#/, '').padEnd(6, '0')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const d = c => Math.max(0, Math.round(c * (1 - factor)))
  return `rgb(${d(r)},${d(g)},${d(b)})`
}

// Habbo-style pixel art character
// ViewBox 120×165. Blocky rectangles, rounded-rect head, small eyes.
// Left-side darkening simulates isometric depth. Platform at bottom.

export default function IsoCharacter({
  skinTone    = '#f5cba7',
  hairStyle   = 'short',
  hairColor   = '#2c1810',
  outfitColor = '#1a1a1a',
}) {
  const uid         = useId().replace(/[^a-zA-Z0-9]/g, '')
  const skinShade   = darken(skinTone,    0.20)
  const outfitShade = darken(outfitColor, 0.35)
  const hairShade   = darken(hairColor,   0.25)

  return (
    <svg viewBox="0 0 120 165" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* clip shadows to their parent shape's rounded corners */}
        <clipPath id={`h${uid}`}>
          <rect x="40" y="20" width="40" height="30" rx="4" />
        </clipPath>
        <clipPath id={`b${uid}`}>
          <rect x="43" y="56" width="34" height="38" rx="2" />
        </clipPath>
      </defs>

      {/* ── Isometric platform tile ── */}
      <polygon
        points="60,122 96,140 60,158 24,140"
        fill="#0f0e0c"
        stroke="rgba(212,175,55,0.28)"
        strokeWidth="1"
      />
      <line x1="60" y1="122" x2="60" y2="158" stroke="rgba(212,175,55,0.09)" strokeWidth="1" />
      <line x1="24" y1="140" x2="96" y2="140" stroke="rgba(212,175,55,0.09)" strokeWidth="1" />
      <circle cx="60" cy="122" r="2"   fill="rgba(212,175,55,0.50)" />
      <circle cx="96" cy="140" r="1.5" fill="rgba(212,175,55,0.20)" />
      <circle cx="24" cy="140" r="1.5" fill="rgba(212,175,55,0.15)" />

      {/* ── Ground shadow ── */}
      <ellipse cx="60" cy="125" rx="22" ry="5" fill="rgba(0,0,0,0.4)" />

      {/* ── Shoes ── */}
      <rect x="44" y="112" width="14" height="10" rx="1" fill={outfitShade} />
      <rect x="62" y="112" width="14" height="10" rx="1" fill={darken(outfitColor, 0.15)} />

      {/* ── Legs ── */}
      <rect x="45" y="91" width="13" height="22" rx="1" fill={outfitShade} />
      <rect x="62" y="91" width="13" height="22" rx="1" fill={outfitColor}  />

      {/* ── Left arm + hand (shadow side — drawn before body) ── */}
      <rect x="32" y="59" width="11" height="28" rx="2" fill={outfitShade} />
      <rect x="31" y="85" width="13" height="9"  rx="2" fill={skinShade}   />

      {/* ── Body + left-side shadow ── */}
      <rect x="43" y="56" width="34" height="38" rx="2" fill={outfitColor} />
      <rect x="43" y="56" width="11" height="38" fill="rgba(0,0,0,0.18)" clipPath={`url(#b${uid})`} />

      {/* ── Right arm + hand (drawn after body) ── */}
      <rect x="77" y="59" width="11" height="28" rx="2" fill={outfitColor} />
      <rect x="76" y="85" width="13" height="9"  rx="2" fill={skinTone}    />

      {/* ── Neck ── */}
      <rect x="54" y="50" width="12" height="7" rx="1" fill={skinTone} />

      {/* ── Head + left-side shadow ── */}
      <rect x="40" y="20" width="40" height="30" rx="4" fill={skinTone} />
      <rect x="40" y="20" width="13" height="30" fill="rgba(0,0,0,0.10)" clipPath={`url(#h${uid})`} />

      {/* ── Hair ── */}
      {hairStyle === 'short' && (
        <rect x="38" y="14" width="44" height="12" rx="5" fill={hairColor} />
      )}
      {hairStyle === 'long' && (
        <>
          <rect x="38" y="14" width="44" height="12" rx="5" fill={hairColor} />
          {/* side curtains */}
          <rect x="38" y="22" width="9" height="34" rx="3" fill={hairShade} />
          <rect x="73" y="22" width="9" height="34" rx="3" fill={hairColor} />
        </>
      )}
      {hairStyle === 'curly' && (
        <>
          {/* bumpy puff row */}
          <circle cx="46" cy="17" r="8" fill={hairShade} />
          <circle cx="57" cy="13" r="8" fill={hairColor} />
          <circle cx="68" cy="12" r="8" fill={hairColor} />
          <circle cx="77" cy="16" r="7" fill={hairColor} />
          {/* base fills gaps between bumps */}
          <rect x="38" y="18" width="44" height="12" rx="2" fill={hairColor} />
        </>
      )}

      {/* ── Eyes — small blocky Habbo style ── */}
      <rect x="48" y="30" width="6" height="7" rx="1" fill="#1a0e06" />
      <rect x="65" y="30" width="6" height="7" rx="1" fill="#1a0e06" />
      {/* eye shines */}
      <rect x="52" y="30" width="2" height="2" fill="white" opacity="0.8" />
      <rect x="69" y="30" width="2" height="2" fill="white" opacity="0.8" />

      {/* ── Mouth ── */}
      <rect x="53" y="41" width="14" height="3" rx="1" fill={skinShade} opacity="0.65" />

    </svg>
  )
}
