import { useEffect, useRef, useState } from 'react'
import styles from './StudioPage.module.css'
import PhaserRoom from '../components/PhaserRoom'
import MusicPlayer from '../components/MusicPlayer'
import { supabase } from '../lib/supabase'

const FURNITURE = [
  { id: 'turntable', label: 'Turntable' },
  { id: 'speaker',   label: 'Speaker'   },
  { id: 'couch',     label: 'Couch'     },
  { id: 'table',     label: 'Coffee Table' },
  { id: 'lamp',      label: 'Floor Lamp' },
  { id: 'plant',     label: 'Plant'     },
  { id: 'shelf',     label: 'Bookshelf' },
  { id: 'neon',      label: 'Neon Sign' },
]

const GENRES = [
  'Hip Hop', 'R&B', 'Electronic', 'House', 'Techno', 'Drum & Bass',
  'Afrobeats', 'Reggae', 'Reggaeton', 'Latin', 'Pop', 'Rock',
  'Indie', 'Jazz', 'Soul', 'Lo-Fi', 'Ambient',
]

export default function StudioPage({ onBack, user }) {
  const [draggingId, setDraggingId] = useState(null)
  const [vibe,       setVibe]       = useState(null)
  const [vibeOpen,   setVibeOpen]   = useState(false)
  const dragImageRef = useRef(null)
  const vibeWrapRef  = useRef(null)

  /* ── Load saved vibe ── */
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('rooms')
      .select('vibe')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data?.vibe) setVibe(data.vibe) })
  }, [user?.id])

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    if (!vibeOpen) return
    function onDown(e) {
      if (vibeWrapRef.current && !vibeWrapRef.current.contains(e.target)) {
        setVibeOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [vibeOpen])

  async function selectVibe(genre) {
    setVibe(genre)
    setVibeOpen(false)
    if (!user?.id) return
    const { error } = await supabase
      .from('rooms')
      .upsert(
        { user_id: user.id, vibe: genre, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    if (error) console.error('save vibe:', error)
  }

  /* ── Toolbar drag handlers ── */
  function handleDragStart(e, id) {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('furnitureId', id)
    setDraggingId(id)

    const ghost = dragImageRef.current
    ghost.innerHTML = ''
    const svg = e.currentTarget.querySelector('svg')
    if (svg) ghost.appendChild(svg.cloneNode(true))
    e.dataTransfer.setDragImage(ghost, 18, 18)
  }

  function handleDragEnd() { setDraggingId(null) }

  return (
    <div className={styles.page}>
      {/* Off-screen drag ghost */}
      <div ref={dragImageRef} className={styles.dragGhost} aria-hidden />

      <nav className={styles.nav}>
        <span className={styles.logo}>AUX</span>

        {/* ── Vibe selector ── */}
        <div className={styles.vibeWrap} ref={vibeWrapRef}>
          <button
            className={`${styles.vibeBtn} ${vibeOpen ? styles.vibeBtnOpen : ''}`}
            onClick={() => setVibeOpen(o => !o)}
          >
            <svg className={styles.vibeBtnIcon} viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.25" />
              <path d="M5 8.5 Q8 5 11 8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" fill="none" />
              <circle cx="8" cy="10" r="1.25" fill="currentColor" />
            </svg>
            Set Vibe
          </button>

          {vibeOpen && (
            <div className={styles.vibeMenu}>
              <p className={styles.vibeMenuLabel}>Select a vibe</p>
              {GENRES.map(g => (
                <button
                  key={g}
                  className={`${styles.vibeItem} ${vibe === g ? styles.vibeItemActive : ''}`}
                  onClick={() => selectVibe(g)}
                >
                  <span className={styles.vibeItemDot}>
                    {vibe === g ? '●' : '○'}
                  </span>
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>

        {vibe && (
          <span className={styles.vibeTag}>
            <span className={styles.vibeTagDot}>●</span>
            {vibe}
          </span>
        )}

        <span className={styles.navTitle}>My Studio</span>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
      </nav>

      <div className={styles.body}>
        {/* ── Isometric viewport ── */}
        <div className={styles.viewport}>
          <PhaserRoom userId={user?.id} />
        </div>

        {/* ── Furniture toolbar ── */}
        <aside className={styles.toolbar}>
          <p className={styles.toolbarHeading}>Furniture</p>
          <p className={styles.toolbarSub}>Drag onto a tile</p>
          <div className={styles.items}>
            {FURNITURE.map(item => (
              <div
                key={item.id}
                className={`${styles.item} ${draggingId === item.id ? styles.itemDragging : ''}`}
                draggable
                onDragStart={e => handleDragStart(e, item.id)}
                onDragEnd={handleDragEnd}
              >
                <span className={styles.itemIcon}>
                  <FurnitureIcon id={item.id} />
                </span>
                <span className={styles.itemLabel}>{item.label}</span>
                <span className={styles.dragHandle}>⠿</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <MusicPlayer vibe={vibe} userId={user?.id} />
    </div>
  )
}

function FurnitureIcon({ id }) {
  switch (id) {
    case 'turntable': return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        <line x1="12" y1="3" x2="15.5" y2="7.5" />
        <line x1="15.5" y1="7.5" x2="19" y2="5" />
      </svg>
    )
    case 'speaker': return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <circle cx="12" cy="14" r="4" />
        <circle cx="12" cy="14" r="1.5" />
        <rect x="9.5" y="5" width="5" height="2.5" rx="0.75" />
      </svg>
    )
    case 'couch': return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
        <path d="M2 10a2 2 0 0 1 2 2v2h16v-2a2 2 0 0 1 4 0" />
        <line x1="6" y1="14" x2="6" y2="18" />
        <line x1="18" y1="14" x2="18" y2="18" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
    )
    case 'table': return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="8" width="20" height="3" rx="1" />
        <line x1="6.5" y1="11" x2="5.5" y2="19" />
        <line x1="17.5" y1="11" x2="18.5" y2="19" />
      </svg>
    )
    case 'lamp': return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3h8l2.5 8H5.5z" />
        <line x1="12" y1="11" x2="12" y2="21" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="9" y1="7" x2="7" y2="7" />
      </svg>
    )
    case 'plant': return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 22v-9" />
        <path d="M12 13C11 9 8 7 4 8c.5 4.5 4 6 8 5z" />
        <path d="M12 13c1-4 4-6 8-5-.5 4.5-4 6-8 5z" />
        <path d="M12 17c-1-2-3-3-5-2.5" />
        <rect x="9" y="20" width="6" height="3" rx="1" />
      </svg>
    )
    case 'shelf': return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="2" width="20" height="20" rx="1" />
        <line x1="2" y1="9" x2="22" y2="9" />
        <line x1="2" y1="16" x2="22" y2="16" />
        <line x1="9" y1="2" x2="9" y2="9" />
        <line x1="16" y1="9" x2="16" y2="16" />
        <line x1="7" y1="16" x2="7" y2="22" />
      </svg>
    )
    case 'neon': return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M7 15V9l3 4 3-4v6" />
        <line x1="17" y1="9" x2="17" y2="15" />
        <line x1="14.5" y1="12" x2="17" y2="12" />
      </svg>
    )
    default: return null
  }
}
