import styles from './CharacterCreator.module.css'
import IsoCharacter from '../components/IsoCharacter'

export default function CharacterCreator({ onBack }) {
  // Default appearance — customisation panel comes later
  const skinTone    = '#f5cba7'
  const hairStyle   = 'short'
  const hairColor   = '#2c1810'
  const outfitColor = '#1a1a1a'

  return (
    <div className={styles.page}>

      <nav className={styles.nav}>
        <span className={styles.logo}>AUX</span>
        <span className={styles.navTitle}>My Character</span>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
      </nav>

      <div className={styles.stage}>
        {/* Atmospheric spotlight behind character */}
        <div className={styles.glow} />

        {/* Character (platform tile is embedded inside IsoCharacter SVG) */}
        <div className={styles.characterWrap}>
          <IsoCharacter
            skinTone={skinTone}
            hairStyle={hairStyle}
            hairColor={hairColor}
            outfitColor={outfitColor}
          />
        </div>
      </div>

    </div>
  )
}
