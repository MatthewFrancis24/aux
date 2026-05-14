import Phaser from 'phaser'
import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ── Layout constants ───────────────────────────────────────────────────────────
const GRID   = 10
const TILE_W = 64
const TILE_H = 32
const HALF_W = TILE_W / 2
const HALF_H = TILE_H / 2
const WALL_H = 96
const BOX_F  = 0.72   // box footprint as a fraction of one tile
const BOX_H  = 22     // box height in screen pixels

// ── Colours ────────────────────────────────────────────────────────────────────
const C_TILE           = 0x1e1e1e
const C_TILE_LINE      = 0x2a2a2a
const C_WALL_BACK      = 0x2a2826
const C_WALL_LEFT      = 0x252220
const C_WALL_BACK_LINE = 0x3a3632
const C_WALL_LEFT_LINE = 0x353230
const C_GOLD           = 0xd4af37

const FURNITURE_COLORS = {
  turntable: 0xd4af37,
  speaker:   0x4a90d9,
  couch:     0x4a8c5c,
  table:     0x8b6344,
  lamp:      0xcfc030,
  plant:     0x2d7a42,
  shelf:     0xd4783c,
  neon:      0xe040a0,
}

// Furniture items that have real sprites.  key = Phaser texture key, frame = spritesheet
// index (null = plain image), srcW/srcH = source frame dimensions used for auto-scale.
const FURNITURE_SPRITES = {
  couch:   { key: 'furn-couch',    frame: 0,    srcW: 192, srcH: 192 },
  table:   { key: 'furn-table',    frame: null, srcW: 192, srcH: 192 },
  speaker: { key: 'furn-showcase', frame: 0,    srcW: 128, srcH: 164 },
}

// ── Pure helpers ───────────────────────────────────────────────────────────────

function tileCenter(col, row, ox, oy) {
  return {
    x: ox + (col - row) * HALF_W,
    y: oy + (col + row) * HALF_H,
  }
}

function diamond(cx, cy) {
  return [
    { x: cx,          y: cy - HALF_H },
    { x: cx + HALF_W, y: cy          },
    { x: cx,          y: cy + HALF_H },
    { x: cx - HALF_W, y: cy          },
  ]
}

function wallPanel(ax, ay, bx, by) {
  return [
    { x: ax, y: ay          },
    { x: bx, y: by          },
    { x: bx, y: by - WALL_H },
    { x: ax, y: ay - WALL_H },
  ]
}

/**
 * Inverse isometric projection: screen (sx, sy) → grid (col, row).
 * Returns null when the point falls outside the 10×10 grid.
 */
function screenToTile(sx, sy, ox, oy) {
  const dx = sx - ox
  const dy = sy - oy
  const col = Math.round((dx / HALF_W + dy / HALF_H) / 2)
  const row = Math.round((dy / HALF_H - dx / HALF_W) / 2)
  return (col >= 0 && col < GRID && row >= 0 && row < GRID) ? { col, row } : null
}

/** Multiply each RGB channel of a Phaser hex colour by factor f. */
function shade(hex, f) {
  const r = Math.min(255, Math.round(((hex >> 16) & 0xff) * f))
  const g = Math.min(255, Math.round(((hex >>  8) & 0xff) * f))
  const b = Math.min(255, Math.round(( hex        & 0xff) * f))
  return (r << 16) | (g << 8) | b
}

/**
 * Draw a small isometric box on the tile whose floor-centre is (cx, cy).
 * Three visible faces: top (brightest), right (medium), left (darkest).
 */
function drawBox(g, cx, cy, baseColor) {
  const bw = HALF_W * BOX_F
  const bh = HALF_H * BOX_F
  const h  = BOX_H

  // Six vertices  ─── bottom ring ────────────────────────  top ring ──────────
  const BotFront = { x: cx,     y: cy + bh     }
  const BotRight = { x: cx + bw, y: cy          }
  const BotLeft  = { x: cx - bw, y: cy          }
  const TopFront = { x: cx,      y: cy + bh - h }
  const TopRight = { x: cx + bw, y: cy      - h }
  const TopLeft  = { x: cx - bw, y: cy      - h }
  const TopBack  = { x: cx,      y: cy - bh - h }

  // Left face  (deepest shadow)
  g.fillStyle(shade(baseColor, 0.5), 1)
  g.fillPoints([BotFront, BotLeft, TopLeft, TopFront], true)

  // Right face  (mid tone)
  g.fillStyle(shade(baseColor, 0.75), 1)
  g.fillPoints([BotRight, BotFront, TopFront, TopRight], true)

  // Top face  (highlight)
  g.fillStyle(shade(baseColor, 1.3), 1)
  g.fillPoints([TopBack, TopRight, TopFront, TopLeft], true)

  // Edge lines for crispness
  const edge = shade(baseColor, 0.3)
  g.lineStyle(1, edge, 1)
  g.strokePoints([TopBack, TopRight, TopFront, TopLeft], true)
  g.lineBetween(BotRight.x, BotRight.y, TopRight.x, TopRight.y)
  g.lineBetween(BotFront.x, BotFront.y, TopFront.x, TopFront.y)
  g.lineBetween(BotLeft.x,  BotLeft.y,  TopLeft.x,  TopLeft.y)
}

/** Render the static room (walls + floor + gold trim) onto g. */
function drawStaticRoom(g, ox, oy) {
  // Back wall (right side of room, along row = 0)
  for (let col = GRID - 1; col >= 0; col--) {
    const { x: cx, y: cy } = tileCenter(col, 0, ox, oy)
    const pts = wallPanel(cx, cy - HALF_H, cx + HALF_W, cy)
    g.fillStyle(C_WALL_BACK, 1);  g.fillPoints(pts, true)
    g.lineStyle(1, C_WALL_BACK_LINE, 0.7); g.strokePoints(pts, true)
  }

  // Left wall (left side of room, along col = 0)
  for (let row = GRID - 1; row >= 0; row--) {
    const { x: cx, y: cy } = tileCenter(0, row, ox, oy)
    const pts = wallPanel(cx - HALF_W, cy, cx, cy - HALF_H)
    g.fillStyle(C_WALL_LEFT, 1);  g.fillPoints(pts, true)
    g.lineStyle(1, C_WALL_LEFT_LINE, 0.7); g.strokePoints(pts, true)
  }

  // Corner seam
  const { x: cx0, y: cy0 } = tileCenter(0, 0, ox, oy)
  g.lineStyle(1, 0x3a3632, 1)
  g.lineBetween(cx0, cy0 - HALF_H - WALL_H, cx0, cy0 - HALF_H)

  // Floor tiles (back-to-front along iso diagonals)
  for (let sum = 0; sum < GRID * 2 - 1; sum++) {
    for (let col = 0; col < GRID; col++) {
      const row = sum - col
      if (row < 0 || row >= GRID) continue
      const { x: cx, y: cy } = tileCenter(col, row, ox, oy)
      const pts  = diamond(cx, cy)
      g.fillStyle(C_TILE, 1);  g.fillPoints(pts, true)
      g.lineStyle(1, C_TILE_LINE, 0.55); g.strokePoints(pts, true)
    }
  }

  // Gold floor-wall junction lines
  g.lineStyle(1.5, C_GOLD, 0.6)
  for (let col = 0; col < GRID; col++) {
    const { x: cx, y: cy } = tileCenter(col, 0, ox, oy)
    g.lineBetween(cx, cy - HALF_H, cx + HALF_W, cy)
  }
  g.lineStyle(1.5, C_GOLD, 0.45)
  for (let row = 0; row < GRID; row++) {
    const { x: cx, y: cy } = tileCenter(0, row, ox, oy)
    g.lineBetween(cx - HALF_W, cy, cx, cy - HALF_H)
  }

  // Corner apex dot
  g.fillStyle(C_GOLD, 0.7)
  g.fillCircle(cx0, cy0 - HALF_H, 2)
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function PhaserRoom({ userId, onFurnitureClick, actionRef }) {
  const containerRef   = useRef(null)
  const placedItemsRef = useRef({})   // "col,row" → furnitureId | { id, r }
  const hoverTileRef   = useRef(null) // { col, row } | null
  const redrawRef      = useRef(null) // () => void — set once scene is ready
  const saveTimerRef   = useRef(null) // debounce handle
  const userIdRef      = useRef(userId)

  // Keep userIdRef current if userId changes (e.g. late hydration)
  useEffect(() => { userIdRef.current = userId }, [userId])

  // ── Load saved layout on mount (or when userId arrives) ────────────────────
  useEffect(() => {
    if (!userId) return
    supabase
      .from('rooms')
      .select('layout')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error('load layout:', error); return }
        if (data?.layout && typeof data.layout === 'object') {
          placedItemsRef.current = data.layout
          redrawRef.current?.()
        }
      })
  }, [userId])

  // ── Phaser game ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const W = el.clientWidth  || 800
    const H = el.clientHeight || 600

    const roomScreenH = WALL_H + (GRID - 1) * TILE_H
    const ox = W / 2
    const oy = (H - roomScreenH) / 2 + WALL_H

    function scheduleSave() {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        const uid = userIdRef.current
        if (!uid) return
        const { error } = await supabase
          .from('rooms')
          .upsert(
            { user_id: uid, layout: placedItemsRef.current, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          )
        if (error) console.error('save layout:', error)
      }, 1000)
    }

    class RoomScene extends Phaser.Scene {
      preload() {
        this.load.spritesheet('char-idle', '/Character0_Idle.png', {
          frameWidth: 460, frameHeight: 460,
        })
        this.load.spritesheet('char-walk', '/Character0_Walk.png', {
          frameWidth: 460, frameHeight: 460,
        })
        // Furniture sprites
        this.load.spritesheet('furn-couch', '/RetroDiner_Furniture/Classic_Black/Sofa_192x192_Classic_Black.png', {
          frameWidth: 192, frameHeight: 192,
        })
        this.load.image('furn-table', '/RetroDiner_Furniture/Classic_Black/Table_192x192_Classic_Black.png')
        this.load.spritesheet('furn-showcase', '/RetroDiner_Furniture/BloodyNight/Showcase_164x164_BloodyNight.png', {
          frameWidth: 128, frameHeight: 164,
        })
      }

      create() {
        const scene = this   // captured for use inside non-arrow callbacks

        // ── Static room layer (drawn once) ─────────────────────────────────
        const roomG = this.add.graphics()
        drawStaticRoom(roomG, ox, oy)

        // ── Character sprite & click-to-move ───────────────────────────────
        //
        // Sprite sheets are 460×460 frames, 5 direction rows.
        // Grid movement → screen direction:
        //   dCol+1,dRow+1 → S (straight down)   dCol-1,dRow-1 → N (straight up)
        //   dCol 0,dRow+1 → SW                  dCol 0,dRow-1 → NE (mirror row 3)
        //   dCol-1,dRow+1 → W                   dCol+1,dRow-1 → E  (mirror row 2)
        //   dCol-1,dRow 0 → NW                  dCol+1,dRow 0 → SE (mirror row 1)
        const DIR_MAP = {
          ' 1, 1': { row: 0, flip: false }, // S
          ' 0, 1': { row: 1, flip: false }, // SW
          '-1, 1': { row: 2, flip: false }, // W
          '-1, 0': { row: 3, flip: false }, // NW
          '-1,-1': { row: 4, flip: false }, // N
          ' 0,-1': { row: 3, flip: true  }, // NE
          ' 1,-1': { row: 2, flip: true  }, // E
          ' 1, 0': { row: 1, flip: true  }, // SE
        }

        // Idle anims: 8 frames per row (3680px wide ÷ 460 = 8 cols)
        for (let d = 0; d < 5; d++) {
          this.anims.create({
            key: `idle-${d}`,
            frames: this.anims.generateFrameNumbers('char-idle', {
              start: d * 8, end: d * 8 + 7,
            }),
            frameRate: 6, repeat: -1,
          })
        }
        // Walk anims: 6 frames per row (2760px wide ÷ 460 = 6 cols)
        for (let d = 0; d < 5; d++) {
          this.anims.create({
            key: `walk-${d}`,
            frames: this.anims.generateFrameNumbers('char-walk', {
              start: d * 6, end: d * 6 + 5,
            }),
            frameRate: 10, repeat: -1,
          })
        }

        let charCol = 5, charRow = 5
        let targetCol = 5, targetRow = 5
        let isWalking = false
        let lastRow = 0, lastFlip = false

        const charScale = (TILE_W * 1.4) / 460
        const { x: charStartX, y: charStartY } = tileCenter(charCol, charRow, ox, oy)
        const char = this.add.sprite(charStartX, charStartY, 'char-idle')
        char.setOrigin(0.5, 0.88)
        char.setScale(charScale)
        char.play('idle-0')
        char.setDepth((charCol + charRow) * 10 + 5)

        const walkStep = () => {
          if (charCol === targetCol && charRow === targetRow) {
            isWalking = false
            char.setFlipX(lastFlip)
            char.play(`idle-${lastRow}`, true)
            return
          }
          isWalking = true
          const dCol = Math.sign(targetCol - charCol)
          const dRow = Math.sign(targetRow - charRow)
          const key  = `${dCol >= 0 ? ' ' : ''}${dCol},${dRow >= 0 ? ' ' : ''}${dRow}`
          const { row, flip } = DIR_MAP[key]
          lastRow = row; lastFlip = flip
          char.setFlipX(flip)
          char.play(`walk-${row}`, true)
          charCol += dCol
          charRow += dRow
          char.setDepth((charCol + charRow) * 10 + 5)
          const { x: tx, y: ty } = tileCenter(charCol, charRow, ox, oy)
          this.tweens.add({
            targets: char, x: tx, y: ty,
            duration: 320, ease: 'Linear',
            onComplete: walkStep,
          })
        }

        // ── Dynamic layers ─────────────────────────────────────────────────
        // furnG: ONLY the drag-hover highlight (redrawn on every dragover).
        // furnObjects: individual Phaser objects per placed item (sprites or
        //   per-item Graphics).  Recreated only when the layout changes.
        const furnG = this.add.graphics()
        furnG.setDepth(1000)   // hover highlight always on top

        let furnObjects = []
        let movingKey   = null   // tile key of item being repositioned

        function updateFurniture() {
          furnObjects.forEach(o => o.destroy())
          furnObjects = []

          Object.entries(placedItemsRef.current)
            .sort(([a], [b]) => {
              const [ac, ar] = a.split(',').map(Number)
              const [bc, br] = b.split(',').map(Number)
              return (ac + ar) - (bc + br)
            })
            .forEach(([key, value]) => {
              // value is either a bare string id (legacy) or { id, r } (with rotation)
              const id       = typeof value === 'string' ? value : value.id
              const rotation = typeof value === 'object' && value !== null ? (value.r ?? 0) : 0
              const [col, row] = key.split(',').map(Number)
              const { x: cx, y: cy } = tileCenter(col, row, ox, oy)
              const depth = (col + row) * 10

              const spriteDef = FURNITURE_SPRITES[id]
              if (spriteDef) {
                // Real sprite — scale so frame width ≈ one tile width
                const img = spriteDef.frame !== null
                  ? scene.add.image(cx, cy, spriteDef.key, spriteDef.frame)
                  : scene.add.image(cx, cy, spriteDef.key)
                // originY 0.88 places the visible furniture base at the tile centre,
                // accounting for the transparent padding at the bottom of each sprite.
                img.setOrigin(0.5, 0.88)
                img.setScale(TILE_W / spriteDef.srcW)
                img.setAngle(rotation)
                img.setDepth(depth)
                furnObjects.push(img)
              } else {
                // Fallback coloured box — own Graphics so depth works per-item
                const g = scene.add.graphics()
                g.setDepth(depth)
                g.setAngle(rotation)
                drawBox(g, cx, cy, FURNITURE_COLORS[id] ?? 0x888888)
                furnObjects.push(g)
              }
            })
        }

        function redraw() {
          furnG.clear()
          // Drag-over hover highlight (gold)
          const hover = hoverTileRef.current
          if (hover) {
            const { x: cx, y: cy } = tileCenter(hover.col, hover.row, ox, oy)
            furnG.fillStyle(C_GOLD, 0.18)
            furnG.fillPoints(diamond(cx, cy), true)
            furnG.lineStyle(2, C_GOLD, 0.85)
            furnG.strokePoints(diamond(cx, cy), true)
          }
          // Move-mode source highlight (blue)
          if (movingKey) {
            const [mc, mr] = movingKey.split(',').map(Number)
            const { x: cx, y: cy } = tileCenter(mc, mr, ox, oy)
            furnG.fillStyle(0x4a90d9, 0.22)
            furnG.fillPoints(diamond(cx, cy), true)
            furnG.lineStyle(2, 0x6ab0f5, 1)
            furnG.strokePoints(diamond(cx, cy), true)
          }
        }

        // Expose a combined refresh so the load effect triggers both
        redrawRef.current = () => { updateFurniture(); redraw() }
        updateFurniture()
        redraw()

        // ── Imperative actions exposed to context menu ─────────────────────
        if (actionRef) {
          actionRef.current = {
            deleteTile(key) {
              delete placedItemsRef.current[key]
              if (movingKey === key) movingKey = null
              updateFurniture(); redraw(); scheduleSave()
            },
            rotateTile(key) {
              const v  = placedItemsRef.current[key]
              const id = typeof v === 'string' ? v : v.id
              const r  = typeof v === 'object' && v !== null ? (v.r ?? 0) : 0
              placedItemsRef.current[key] = { id, r: (r + 90) % 360 }
              updateFurniture(); scheduleSave()
            },
            beginMove(key) {
              movingKey = key
              canvas.style.cursor = 'crosshair'
              redraw()
            },
            cancelMove() {
              movingKey = null
              canvas.style.cursor = 'default'
              redraw()
            },
          }
        }

        // ── Canvas events ──────────────────────────────────────────────────
        const canvas = this.sys.game.canvas

        canvas.addEventListener('dragenter', e => {
          if (e.dataTransfer.types.includes('furnitureid')) e.preventDefault()
        })

        canvas.addEventListener('dragover', e => {
          if (!e.dataTransfer.types.includes('furnitureid')) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
          const rect = canvas.getBoundingClientRect()
          const tile = screenToTile(e.clientX - rect.left, e.clientY - rect.top, ox, oy)
          const prev = hoverTileRef.current
          if (tile?.col !== prev?.col || tile?.row !== prev?.row) {
            hoverTileRef.current = tile
            redraw()
          }
        })

        canvas.addEventListener('dragleave', () => {
          hoverTileRef.current = null
          redraw()
        })

        canvas.addEventListener('drop', e => {
          e.preventDefault()
          const id = e.dataTransfer.getData('furnitureId')
          if (id) {
            const rect = canvas.getBoundingClientRect()
            const tile = screenToTile(e.clientX - rect.left, e.clientY - rect.top, ox, oy)
            if (tile) placedItemsRef.current[`${tile.col},${tile.row}`] = id
          }
          hoverTileRef.current = null
          updateFurniture()
          redraw()
          scheduleSave()
        })

        canvas.addEventListener('click', e => {
          const rect = canvas.getBoundingClientRect()
          const tile = screenToTile(e.clientX - rect.left, e.clientY - rect.top, ox, oy)
          if (!tile) return
          const key = `${tile.col},${tile.row}`

          // ── Move mode: resolve destination click ─────────────────────────
          if (movingKey) {
            if (key === movingKey) {
              // Same tile → cancel
              movingKey = null
            } else if (!placedItemsRef.current[key]) {
              // Empty tile → complete the move
              placedItemsRef.current[key] = placedItemsRef.current[movingKey]
              delete placedItemsRef.current[movingKey]
              movingKey = null
              updateFurniture()
              scheduleSave()
            }
            canvas.style.cursor = 'default'
            redraw()
            return
          }

          // ── Normal click ─────────────────────────────────────────────────
          if (placedItemsRef.current[key]) {
            // Open context menu — let React handle the action
            onFurnitureClick?.(key, e.clientX, e.clientY)
            return
          }
          // Walk to empty floor tile
          if (tile.col === charCol && tile.row === charRow) return
          targetCol = tile.col
          targetRow = tile.row
          if (!isWalking) walkStep()
        })

        // Pointer cursor over occupied tiles
        canvas.addEventListener('mousemove', e => {
          const rect = canvas.getBoundingClientRect()
          const tile = screenToTile(e.clientX - rect.left, e.clientY - rect.top, ox, oy)
          canvas.style.cursor =
            tile && placedItemsRef.current[`${tile.col},${tile.row}`]
              ? 'pointer'
              : 'default'
        })
      }
    }

    const game = new Phaser.Game({
      type:        Phaser.AUTO,
      width:       W,
      height:      H,
      transparent: true,
      parent:      el,
      scene:       [RoomScene],
      scale:       { mode: Phaser.Scale.NONE },
      banner:      false,
    })

    return () => {
      clearTimeout(saveTimerRef.current)
      if (actionRef) actionRef.current = null
      game.destroy(true)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width:  '100%',
        height: '100%',
        filter: [
          'drop-shadow(0px 32px 64px rgba(0,0,0,0.95))',
          'drop-shadow(0px 12px 24px rgba(0,0,0,0.75))',
          'drop-shadow(0px 4px   8px rgba(0,0,0,0.5))',
        ].join(' '),
      }}
    />
  )
}
