import { supabase } from '../lib/supabase'
import styles from './HomePage.module.css'

export default function HomePage({ user, onEnterStudio }) {
  return (
    <div className={styles.page}>

      <nav className={styles.nav}>
        <span className={styles.navLogo}>AUX</span>
        <div className={styles.navRight}>
          <span className={styles.navEmail}>{user.email}</span>
          <button className={styles.signOut} onClick={() => supabase.auth.signOut()}>
            Sign Out
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.welcome}>Welcome to AUX</h1>
          <p className={styles.subtitle}>Your virtual music social world</p>
        </div>

        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h2 className={styles.cardTitle}>My Studio</h2>
            <p className={styles.cardDesc}>Build and customize your room</p>
            <button className={styles.cardBtn} onClick={onEnterStudio}>Enter Studio</button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h2 className={styles.cardTitle}>Explore</h2>
            <p className={styles.cardDesc}>Discover other studios</p>
            <button className={styles.cardBtn}>Start Exploring</button>
          </div>
        </div>
      </main>

    </div>
  )
}
