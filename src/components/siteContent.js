import { useEffect, useState } from 'react'
import axios from 'axios'
import { setShopTheme } from './storeBrand'

// The online shop's editable content: home page sections, announcement bar, menu,
// footer and social links, and search-engine text. Customers get the published version
// of the shop they are visiting. Inside the website editor's preview frame, the editor
// sends its draft here instead, so changes show instantly.

export const DEFAULT_SITE = {
    announcement: { enabled: false, text: '', link: '' },
    sections: [
        { id: 'categories', type: 'categories', hidden: false, title: 'Shop by category', subtitle: "Everything from the field, the garden and the craftsman's bench." },
        { id: 'catalog', type: 'catalog', hidden: false, title: 'Fresh from the farm', subtitle: 'New harvests and handmade goods, added as they arrive.' },
    ],
    menu: [
        { label: 'Shop', link: '/' },
        { label: 'Shop by Budget', link: '/priceRange' },
        { label: 'Top Reviewed', link: '/topReviewProductScreen' },
        { label: 'Contact', link: '/contact' },
    ],
    footer_links: [
        { label: 'Shop all products', link: '/' },
        { label: 'Top reviewed', link: '/topReviewProductScreen' },
        { label: 'Shop by budget', link: '/priceRange' },
        { label: 'Contact us', link: '/contact' },
    ],
    social: { website: '', facebook: '', instagram: '', youtube: '' },
    seo: { title: '', description: '' },
    theme: { accent: '', header: 'solid' },
    pages: [],
}

// The editor opens the shop in a frame with this name.
export const PREVIEW_FRAME = 'site-preview'
export const isPreview = () => typeof window !== 'undefined' && window.name === PREVIEW_FRAME

let current = DEFAULT_SITE
let loaded = false
const listeners = new Set()

function publish(next) {
    current = { ...DEFAULT_SITE, ...next }
    applySeo(current.seo)
    setShopTheme(current.theme)
    listeners.forEach((fn) => fn(current))
}

// The browser tab title and the description search engines and link previews show.
// Left empty, the page keeps the store name set by the store settings.
function applySeo(seo) {
    if (typeof document === 'undefined' || !seo) return
    if (seo.title) {
        document.title = seo.title
        document.documentElement.dataset.seoTitle = '1'
    }
    if (seo.description) {
        let tag = document.querySelector('meta[name="description"]')
        if (!tag) {
            tag = document.createElement('meta')
            tag.setAttribute('name', 'description')
            document.head.appendChild(tag)
        }
        tag.setAttribute('content', seo.description)
    }
}

function load() {
    if (loaded) return
    loaded = true
    axios.get('/api/site/').then(({ data }) => { if (!isPreview()) publish(data) }).catch(() => {})
    if (isPreview()) {
        // Only accept drafts from the editor on this same site.
        window.addEventListener('message', (e) => {
            if (e.origin === window.location.origin && e.data && e.data.type === 'site-draft') {
                publish(e.data.content)
            }
        })
        if (window.parent !== window) window.parent.postMessage({ type: 'site-preview-ready' }, window.location.origin)
    }
}

export function useSiteContent() {
    const [site, setSite] = useState(current)
    useEffect(() => {
        listeners.add(setSite)
        // The content may have arrived between the first render and now.
        setSite(current)
        load()
        return () => listeners.delete(setSite)
    }, [])
    return site
}

// A link from the editor: internal pages go through the router, full addresses open as normal links.
export const isExternal = (link) => /^https?:\/\//.test(link || '')
