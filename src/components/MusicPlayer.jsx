import { useEffect, useRef, useState } from 'react'
import styles from './MusicPlayer.module.css'
import { supabase } from '../lib/supabase'

function buildSrc(url) {
  return (
    'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) +
    '&color=%23d4af37&auto_play=false&buying=false&liking=false' +
    '&download=false&sharing=false&show_comments=false' +
    '&show_playcount=false&show_user=true&hide_related=true' +
    '&show_reposts=false&show_teaser=false&visual=false'
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function MusicPlayer({ vibe, userId }) {
  const iframeRef  = useRef(null)
  const widgetRef  = useRef(null)
  const volumeRef  = useRef(70)
  const cleanupRef = useRef(null)   // cancels in-flight bind when URL changes

  const [mode,    setMode]    = useState('input')   // 'input' | 'player'
  const [input,   setInput]   = useState('')
  const [playing, setPlaying] = useState(false)
  const [volume,  setVolume]  = useState(70)
  const [ready,   setReady]   = useState(false)

  // Inject SC Widget API script once
  useEffect(() => {
    if (document.getElementById('sc-widget-api')) return
    const s = document.createElement('script')
    s.id    = 'sc-widget-api'
    s.src   = 'https://w.soundcloud.com/player/api.js'
    s.async = true
    document.head.appendChild(s)
  }, [])

  // Load saved music URL from Supabase on mount
  useEffect(() => {
    if (!userId) return
    supabase
      .from('rooms')
      .select('music_url')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.music_url) {
          setInput(data.music_url)
          loadUrl(data.music_url, false)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  function loadUrl(url, autoPlay = true) {
    const iframe = iframeRef.current
    if (!iframe || !url.trim()) return

    // Cancel any previous in-flight bind
    cleanupRef.current?.()
    let active = true
    cleanupRef.current = () => { active = false }

    setReady(false)
    setPlaying(false)
    setMode('player')

    // Unbind previous widget events
    if (widgetRef.current && window.SC) {
      try {
        const Ev = window.SC.Widget.Events
        widgetRef.current.unbind(Ev.READY)
        widgetRef.current.unbind(Ev.PLAY)
        widgetRef.current.unbind(Ev.PAUSE)
        widgetRef.current.unbind(Ev.FINISH)
      } catch (_) {}
    }
    widgetRef.current = null
    iframe.src = buildSrc(url)

    // Bind widget — poll until SC API script is ready
    function bind() {
      if (!active) return
      if (!window.SC) { setTimeout(bind, 100); return }
      const w = window.SC.Widget(iframe)
      widgetRef.current = w
      w.bind(window.SC.Widget.Events.READY, () => {
        if (!active) return
        setReady(true)
        w.setVolume(volumeRef.current)
        if (autoPlay) w.play()
      })
      w.bind(window.SC.Widget.Events.PLAY,   () => { if (active) setPlaying(true)  })
      w.bind(window.SC.Widget.Events.PAUSE,  () => { if (active) setPlaying(false) })
      w.bind(window.SC.Widget.Events.FINISH, () => { if (active) setPlaying(false) })
    }
    bind()
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    const url = input.trim()
    if (!url) return
    loadUrl(url, true)
    if (userId) {
      const { error } = await supabase
        .from('rooms')
        .upsert(
          { user_id: userId, music_url: url, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
      if (error) console.error('save music_url:', error)
    }
  }

  function togglePlay() {
    const w = widgetRef.current
    if (!w || !ready) return
    playing ? w.pause() : w.play()
  }

  function handleVolume(e) {
    const v = Number(e.target.value)
    setVolume(v)
    volumeRef.current = v
    widgetRef.current?.setVolume(v)
  }

  if (!vibe) return null

  return (
    <div className={styles.bar}>
      {/* Off-screen iframe — audio plays without display:none */}
      <iframe
        ref={iframeRef}
        className={styles.iframe}
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        title="SoundCloud player"
      />

      <div className={styles.inner}>
        <span className={styles.dot}>●</span>
        <span className={styles.label}>{vibe}</span>
        <span className={styles.sep} />

        {mode === 'input' ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              className={styles.urlInput}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste a SoundCloud link"
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!input.trim()}
              aria-label="Load"
            >
              ↵
            </button>
          </form>
        ) : (
          <>
            <button
              className={styles.playBtn}
              onClick={togglePlay}
              disabled={!ready}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div className={styles.volWrap}>
              <VolumeIcon silent={volume === 0} />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolume}
                className={styles.slider}
                aria-label="Volume"
              />
            </div>

            {!ready && <span className={styles.status}>Loading…</span>}

            <button className={styles.changeBtn} onClick={() => setMode('input')}>
              change link
            </button>
          </>
        )}

        <a
          className={styles.scLink}
          href="https://soundcloud.com"
          target="_blank"
          rel="noreferrer"
          tabIndex={-1}
        >
          SC
        </a>
      </div>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <rect x="2.5" y="2.5" width="4" height="11" rx="1" />
      <rect x="9.5" y="2.5" width="4" height="11" rx="1" />
    </svg>
  )
}

function VolumeIcon({ silent }) {
  return silent ? (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2 5.5h3l4-3v11l-4-3H2V5.5z" />
      <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"
        d="M11.5 6L14 8.5m0-2.5L11.5 8.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2 5.5h3l4-3v11l-4-3H2V5.5z" />
      <path stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"
        d="M11 5c1.2 0.8 2 2.1 2 3s-.8 2.2-2 3" />
    </svg>
  )
}
