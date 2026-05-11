import { useRef, useState } from 'react'
import styles from './StudioPage.module.css'
import PhaserRoom from '../components/PhaserRoom'

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

export default function StudioPage({ onBack }) {
  const [draggingId, setDraggingId] = useState(null)
  const dragImageRef = useRef(null)

  /* ── Toolbar drag handlers ── */
  function handleDragStart(e, id) {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('furnitureId', id)
    setDraggingId(id)

    // Use a small off-screen element as the drag ghost so it stays crisp
    const ghost = dragImageRef.current
    ghost.innerHTML = ''
    const svg = e.currentTarget.querySelector('svg')
    if (svg) ghost.appendChild(svg.cloneNode(true))
    e.dataTransfer.setDragImage(ghost, 18, 18)
  }

  function handleDragEnd() {
    setDraggingId(null)
  }

  return (
    <div className={styles.page}>
      {/* Off-screen drag ghost */}
      <div ref={dragImageRef} className={styles.dragGhost} aria-hidden />

      <nav className={styles.nav}>
        <span className={styles.logo}>AUX</span>
        <span className={styles.navTitle}>My Studio</span>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
      </nav>

      <div className={styles.body}>
        {/* ── Isometric viewport ── */}
        <div className={styles.viewport}>
          <PhaserRoom />
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
