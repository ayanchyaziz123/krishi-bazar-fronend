import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Sprout } from 'lucide-react'
import { activeBusiness } from '../admin_components/roles'
import { shopSlug } from './shopSlug'

// The store's name, details and colour, read from the server and shared by every page.
// The colour becomes the brand palette (brand-50 … brand-950) used across the site.

export const DEFAULT_STORE = {
    name: 'Krishi Bazar',
    tagline: 'Fresh produce and crafts from local farms',
    location: 'Sylhet',
    address: '121, Zindabazar, Sylhet, Bangladesh',
    phone: '',
    email: '',
    accent: '#059669',
    logo: '',
    shipping: {
        delivery_enabled: true, pickup_enabled: true, delivery_fee: '10', free_delivery_over: '100',
        min_order: '0', tax_rate: '5', delivery_time: '', pickup_time: '', delivery_pincodes: '',
    },
    receipt_footer: 'Thank you for shopping with us.',
}

const CACHE_KEY = 'storeBrand'
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
// Lightness of each shade. 600 is the colour the store picked, used for buttons.
const LIGHTNESS = { 50: 0.975, 100: 0.945, 200: 0.89, 300: 0.81, 400: 0.71, 500: 0.62, 700: 0.42, 800: 0.36, 900: 0.31, 950: 0.22 }
const CHROMA = { 50: 0.18, 100: 0.32, 200: 0.55, 300: 0.8, 400: 0.95, 500: 1, 700: 0.9, 800: 0.8, 900: 0.7, 950: 0.55 }

// sRGB hex → OKLCH, so shades keep the same hue and only lightness changes.
function hexToOklch(hex) {
    const n = parseInt(hex.slice(1), 16)
    const lin = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
        const c = v / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    const [r, g, b] = lin
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    return { L, C: Math.hypot(A, B), H: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 }
}

export function brandPalette(hex) {
    const safe = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : DEFAULT_STORE.accent
    const { C, H } = hexToOklch(safe)
    const palette = {}
    STEPS.forEach((step) => {
        palette[step] = step === 600 ? safe : `oklch(${LIGHTNESS[step]} ${(C * CHROMA[step]).toFixed(4)} ${H.toFixed(2)})`
    })
    return palette
}

// The browser tab icon: the store's logo when it has one, else the default icon.
let defaultFavicon = null
function applyFavicon(logo) {
    const link = document.querySelector('link[rel="icon"]')
    if (!link) return
    if (defaultFavicon === null) defaultFavicon = link.getAttribute('href')
    link.setAttribute('href', logo || defaultFavicon)
}

// Two brands: the store's own (Settings) for the admin, counter, receipts and staff sign-in,
// and the online shop's (Website → Theme) for the shop pages. Empty shop values fall back
// to the store's.
let shopTheme = { accent: '', logo: '' }
const ADMIN_PAGES = /^#\/(admin|dashboard|brand|staff)(\/|$|\?)/
export const onShopPage = () => typeof window !== 'undefined' && !ADMIN_PAGES.test(window.location.hash || '#/')

// The colour and logo for the page being shown.
export function brandFor(store) {
    if (!onShopPage()) return { accent: store.accent, logo: store.logo }
    return { accent: shopTheme.accent || store.accent, logo: shopTheme.logo || store.logo }
}

// The website content sets the shop's theme (the editor's preview sends its draft).
export function setShopTheme(theme) {
    shopTheme = { accent: (theme && theme.accent) || '', logo: (theme && theme.logo) || '' }
    applyBrand(current)
    listeners.forEach((fn) => fn({ ...current }))
}

export function applyBrand(store) {
    const brand = brandFor(store || DEFAULT_STORE)
    const palette = brandPalette(brand.accent)
    const root = document.documentElement
    Object.entries(palette).forEach(([step, value]) => {
        root.style.setProperty(`--color-brand-${step}`, value)
        // The plain shades, so the dark theme can build its own brand colours from them.
        root.style.setProperty(`--brand-${step}`, value)
    })
    applyFavicon(brand.logo)
    if (store && store.name && !document.documentElement.dataset.seoTitle) document.title = store.tagline ? `${store.name} · ${store.tagline}` : store.name
}

// Which business's details the page needs: in the admin, the signed-in person's business;
// elsewhere, the shop in the web address. Matches the business the server is asked for.
const ADMIN_AREA = /^#\/(admin|dashboard|brand)/
function brandKey() {
    if (ADMIN_AREA.test(window.location.hash || '')) {
        try { return `staff:${activeBusiness(JSON.parse(localStorage.getItem('userInfo') || 'null')) || ''}` } catch (e) { return 'staff:' }
    }
    return `shop:${shopSlug()}`
}

// The last brand seen for each business, so a page paints at once with the right one.
function readCache(key) {
    try {
        const all = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
        return all && all[key] ? { ...DEFAULT_STORE, ...all[key] } : DEFAULT_STORE
    } catch (e) { return DEFAULT_STORE }
}

let loadedKey = typeof window !== 'undefined' ? brandKey() : ''
let current = readCache(loadedKey)
const listeners = new Set()

function publish(next, key) {
    if (key !== loadedKey) return // the page has moved on to another business
    current = { ...DEFAULT_STORE, ...next }
    try {
        const all = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ...(all && !all.name ? all : {}), [key]: current }))
    } catch (e) { /* storage unavailable */ }
    applyBrand(current)
    listeners.forEach((fn) => fn(current))
}

function load() {
    const key = loadedKey
    axios.get('/api/store/').then(({ data }) => publish(data, key)).catch(() => {})
}

// Called once at start-up: paint with the last known brand at once, then refresh it.
export function initStoreBrand() {
    applyBrand(current)
    window.addEventListener('hashchange', () => {
        const key = brandKey()
        if (key !== loadedKey) {
            // Signing in, or moving between the shop and the admin, can mean another business.
            loadedKey = key
            current = readCache(key)
            load()
        }
        // Moving between the shop and the admin switches between the two brands.
        applyBrand(current)
        listeners.forEach((fn) => fn({ ...current }))
    })
    load()
}

export function saveStoreBrand(changes, token) {
    return axios.put('/api/store/', changes, { headers: { Authorization: `Bearer ${token}` } })
        .then(({ data }) => { publish(data, loadedKey); return data })
}

// Preview a colour without saving it (the settings page uses this while choosing).
export const previewAccent = (hex) => applyBrand({ ...current, accent: hex })
export const resetPreview = () => applyBrand(current)

export function useStoreBrand() {
    const [store, setStore] = useState(current)
    useEffect(() => {
        listeners.add(setStore)
        // The details may have arrived between the first render and now.
        setStore(current)
        return () => listeners.delete(setStore)
    }, [])
    return store
}

// The store name with its last word in the brand colour, e.g. "Krishi Bazar".
export function StoreName({ accentClassName = 'text-brand-600' }) {
    const { name } = useStoreBrand()
    const words = (name || '').trim().split(/\s+/)
    if (words.length < 2) return <span>{name}</span>
    return <>{words.slice(0, -1).join(' ')} <span className={accentClassName}>{words[words.length - 1]}</span></>
}

// The store's logo, or a sprout in the store colour when no logo has been uploaded.
// `src` overrides the saved logo (the website editor's preview passes the draft one).
export function StoreLogo({ src, className = 'h-9 w-9 rounded-xl', iconClassName = 'h-5 w-5' }) {
    const store = useStoreBrand()
    const logo = src === undefined ? brandFor(store).logo : src
    if (logo) {
        return (
            <span className={`flex shrink-0 items-center justify-center overflow-hidden bg-white ${className}`}>
                <img src={logo} alt={`${store.name} logo`} className="h-full w-full object-contain" />
            </span>
        )
    }
    return (
        <span className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white ${className}`}>
            <Sprout className={iconClassName} />
        </span>
    )
}
