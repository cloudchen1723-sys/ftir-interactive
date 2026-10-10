/**
 * Visual System & Color Palette — Strict Editorial Refinement
 * Quiet, mathematical, editorial, minimal, precise, warm where physical, cool where informational.
 * No neon. No glow. Strict semantic color hierarchy.
 */

export const PALETTE = {
  // Global Base Palette
  bgVoid: '#0B0F17',
  bgSurface: '#121824',
  
  // Primary neutral geometry / mathematics (White)
  white: '#E7E9EC',
  textPrimary: '#E7E9EC',
  textSubtitle: '#D7DBE1',
  
  // Secondary context (Muted Gray)
  grayContext: '#7D8898',
  textSecondary: '#7D8898',
  textMuted: '#7D8898',
  
  // Inactive geometry / grid / outlines
  grayInactive: '#394352',
  gridLine: '#1F2735',
  atomBond: '#394352',
  
  // Physical infrared light / energy (Amber)
  amberLight: '#E8A85C',
  
  // Measured / encoded mathematical information (Cyan)
  cyanSignal: '#62C5D8',
  laserCyan: '#62C5D8', // Alias
  
  // Selected absorption feature only (Restrained Red)
  redAbsorption: '#D96C75',
} as const;

export const TYPOGRAPHY = {
  // Clean modern sans-serif for Chinese and all normal explanatory text
  sans: "'Plus Jakarta Sans', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  // Monospace used strictly for values and mathematical signal labels (1715 cm⁻¹, δ = 2x, I(δ), S(ν̃))
  mono: "'JetBrains Mono', monospace",
  // Aliases for backward compatibility
  titleFont: "'Plus Jakarta Sans', 'Noto Sans SC', sans-serif",
  bodyFont: "'Plus Jakarta Sans', 'Noto Sans SC', sans-serif",
  monoFont: "'JetBrains Mono', monospace",
  chineseSerif: "'Plus Jakarta Sans', 'Noto Sans SC', sans-serif",
};
