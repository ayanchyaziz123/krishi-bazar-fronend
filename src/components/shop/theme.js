// The shop colour choices and a readability check for white text on that colour.

// Ready-made colours. Each keeps white text readable (contrast of at least 4.5 to 1).
export const THEME_PRESETS = [
    ['Forest', '#063c2b'], ['Green', '#15803d'], ['Emerald', '#047857'], ['Teal', '#0f766e'], ['Blue', '#2563eb'],
    ['Indigo', '#4f46e5'], ['Violet', '#7c3aed'], ['Rose', '#e11d48'], ['Orange', '#c2410c'], ['Amber', '#b45309'], ['Slate', '#475569'],
]

export const isHex = (value) => /^#[0-9a-f]{6}$/i.test(value || '')

function luminance(hex) {
    const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

// How readable white text is on this colour (1 = invisible, 21 = black). Buttons and the
// header use white text, so 4.5 or more is comfortable, under 3 is hard to read.
export const whiteContrast = (hex) => (isHex(hex) ? 1.05 / (luminance(hex) + 0.05) : 21)

export const headerBackground = (style) => (style === 'gradient'
    ? 'bg-gradient-to-r from-brand-800 via-brand-600 to-brand-500'
    : 'bg-brand-600')
