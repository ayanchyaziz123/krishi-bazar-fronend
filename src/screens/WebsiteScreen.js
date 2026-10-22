import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import {
    ArrowDown, ArrowUp, ArrowLeft, Eye, EyeOff, Trash2, Plus, ChevronDown, ChevronRight, Monitor, Smartphone, ExternalLink,
    Image as ImageIcon, GalleryHorizontal, LayoutGrid, ShoppingBag, Megaphone, AlignLeft, List, Upload, X, FileText, Pencil, RotateCcw, Rocket, Check,
} from 'lucide-react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import { Alert, Badge, Button, Card, Checkbox, Field, Input, Modal, Select, Spinner, Textarea, cn } from '../components/ui'
import { useCategories } from '../components/categories'
import { PREVIEW_FRAME } from '../components/siteContent'
import { activeBusinessInfo } from '../admin_components/roles'
import { brandPalette } from '../components/storeBrand'
import { THEME_PRESETS, isHex, whiteContrast } from '../components/shop/theme'

const errorText = (e) => (e.response && e.response.data && e.response.data.detail) || e.message
const newId = () => Math.random().toString(36).slice(2, 12)

const SECTION_TYPES = {
    hero: { label: 'Hero banner', icon: ImageIcon, hint: 'Big headline at the top, with a photo and buttons.' },
    slides: { label: 'Banner slider', icon: GalleryHorizontal, hint: 'Your own banner photos that change every few seconds.' },
    categories: { label: 'Category tiles', icon: LayoutGrid, hint: 'Tiles that open each category.' },
    products: { label: 'Product row', icon: ShoppingBag, hint: 'A row of products: hand-picked, on offer, newest and more.' },
    promo: { label: 'Promo banner', icon: Megaphone, hint: 'A coloured banner for an offer or season.' },
    text_image: { label: 'Text and image', icon: AlignLeft, hint: 'Tell your story: farms, quality, delivery.' },
    catalog: { label: 'All products', icon: List, hint: 'The full product list with filters. Also used for search results.' },
}

const NEW_SECTION = {
    hero: { badge: 'Straight from local farms', title: 'Fresh, honest food from the people who grow it', text: '', button_label: 'Shop now', button_link: '/', second_label: '', second_link: '', image: '' },
    slides: { title: '', subtitle: '', slides: [] },
    categories: { title: 'Shop by category', subtitle: '', categories: [] },
    products: { title: 'Featured products', subtitle: '', source: 'newest', category: '', product_ids: [], limit: 4, link_label: '', link: '' },
    promo: { title: 'Seasonal offer', text: '', button_label: 'Shop the offer', button_link: '/', image: '', style: 'brand' },
    text_image: { title: 'Our story', subtitle: '', text: '', image: '', image_side: 'right', button_label: '', button_link: '' },
    catalog: { title: 'All products', subtitle: '' },
}

const BUILT_IN_LINKS = [
    ['Home / shop', '/'], ['Shop by budget', '/priceRange'], ['Top reviewed', '/topReviewProductScreen'],
    ['Contact', '/contact'], ['Cart', '/cart'],
]

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')

// Edit the online shop of the business being worked in: home page sections, announcement
// bar, menu, footer, pages, search-engine text and social links. Changes save to a draft
// automatically and only reach customers when published.
function WebsiteScreen() {
    const { userInfo } = useSelector((state) => state.userLogin)
    const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${userInfo.token}` } }), [userInfo])
    const business = activeBusinessInfo(userInfo)
    const [draft, setDraft] = useState(null)
    const [meta, setMeta] = useState({ unpublished: false, published_at: null, published_by: '' })
    const [pages, setPages] = useState([])
    const history = useHistory()
    const [device, setDevice] = useState('desktop')
    const [pane, setPane] = useState('edit') // phones and tablets: 'edit' or 'preview'
    const wide = useMediaQuery('(min-width: 1024px)')
    const [tab, setTab] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] || '').get('tab') || 'home')
    const [saveState, setSaveState] = useState('saved') // saved | saving | error
    const [error, setError] = useState('')
    const [busy, setBusy] = useState('')
    const [notice, setNotice] = useState('')
    const saveTimer = useRef(null)
    const pendingSave = useRef(null)

    const applyServer = (data) => {
        setMeta({ unpublished: data.unpublished, published_at: data.published_at, published_by: data.published_by })
        if (data.pages) setPages(data.pages)
    }

    useEffect(() => {
        axios.get('/api/site/draft/', auth).then(({ data }) => { setDraft(data.draft); applyServer(data) }).catch((e) => setError(errorText(e)))
    }, [auth])

    const save = useCallback((content) => {
        setSaveState('saving')
        pendingSave.current = axios.put('/api/site/draft/', content, auth)
            .then(({ data }) => { applyServer(data); setSaveState('saved'); setError('') })
            .catch((e) => { setSaveState('error'); setError(errorText(e)) })
        return pendingSave.current
    }, [auth])

    // Every change is saved to the draft a moment after the last keystroke.
    const update = (next) => {
        setDraft(next)
        setNotice('')
        setSaveState('saving')
        clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => save(next), 700)
    }
    useEffect(() => () => clearTimeout(saveTimer.current), [])

    const flush = async () => {
        if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; await save(draft) }
        else if (pendingSave.current) await pendingSave.current
    }

    const publishSite = async () => {
        setBusy('publish')
        await flush()
        axios.post('/api/site/publish/', {}, auth)
            .then(() => axios.get('/api/site/draft/', auth))
            .then(({ data }) => {
                applyServer(data)
                setNotice('Published. Customers now see these changes.')
            })
            .catch((e) => setError(errorText(e)))
            .finally(() => setBusy(''))
    }

    const discard = async () => {
        if (!window.confirm('Throw away all changes since the last publish?')) return
        setBusy('discard')
        clearTimeout(saveTimer.current)
        axios.post('/api/site/discard/', {}, auth)
            .then(({ data }) => { setDraft(data.draft); setMeta((m) => ({ ...m, unpublished: false })); setSaveState('saved'); setNotice('Changes discarded. The draft matches the live site again.') })
            .catch((e) => setError(errorText(e)))
            .finally(() => setBusy(''))
    }

    const reloadPages = () => axios.get('/api/site/pages/', auth).then(({ data }) => setPages(data))

    const exit = () => (window.history.length > 1 ? history.goBack() : history.push('/dashboard'))

    if (!draft) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                {error ? <Alert variant="danger">{error}</Alert> : <Spinner />}
            </div>
        )
    }

    const linkOptions = [...BUILT_IN_LINKS, ...pages.map((p) => [`Page: ${p.title}${p.published ? '' : ' (draft)'}`, `/page/${p.slug}`])]
    const status = saveState === 'saving' ? 'Saving draft…' : saveState === 'error' ? 'The draft could not be saved'
        : meta.unpublished ? 'Unpublished changes' : meta.published_at ? `Live since ${when(meta.published_at)}` : 'Draft saved'

    return (
        <div className="flex h-full flex-col">
            {/* The editor's own top bar */}
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:gap-3 sm:px-4">
                <Button variant="ghost" size="sm" onClick={exit} aria-label="Exit the website editor"><ArrowLeft className="h-4 w-4" /> Exit</Button>
                <span className="hidden h-6 w-px bg-slate-200 sm:block" />
                <div className="hidden min-w-0 sm:block">
                    <p className="truncate text-sm font-semibold text-slate-900">Website{business ? <span className="font-normal text-slate-500"> · {business.name}</span> : null}</p>
                    <p className={cn('truncate text-xs', meta.unpublished ? 'font-medium text-amber-700' : saveState === 'error' ? 'text-rose-600' : 'text-slate-500')}
                        title={meta.published_by ? `Last published by ${meta.published_by}` : undefined}>{status}</p>
                </div>

                <div className="mx-auto hidden gap-1 rounded-lg bg-slate-100 p-1 lg:flex">
                    {[['desktop', Monitor, 'Desktop'], ['phone', Smartphone, 'Phone']].map(([key, Icon, label]) => (
                        <button key={key} type="button" onClick={() => setDevice(key)} aria-label={`${label} preview`} aria-pressed={device === key}
                            className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition', device === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900')}>
                            <Icon className="h-4 w-4" /> {label}
                        </button>
                    ))}
                </div>

                {/* Phones and tablets: switch between the settings and the preview */}
                <div className="ml-auto flex gap-1 rounded-lg bg-slate-100 p-1 lg:hidden">
                    {[['edit', 'Edit'], ['preview', 'Preview']].map(([key, label]) => (
                        <button key={key} type="button" onClick={() => setPane(key)} aria-pressed={pane === key}
                            className={cn('rounded-md px-2.5 py-1 text-xs font-medium', pane === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>{label}</button>
                    ))}
                </div>

                <div className="flex shrink-0 items-center gap-2 lg:ml-0">
                    <span className="hidden xl:block"><Button variant="ghost" size="sm" onClick={() => window.open('/#/', '_blank')}><ExternalLink className="h-4 w-4" /> Live site</Button></span>
                    <span className="hidden sm:block"><Button variant="secondary" size="sm" disabled={!meta.unpublished || Boolean(busy)} onClick={discard}><RotateCcw className="h-4 w-4" /> Discard</Button></span>
                    <Button size="sm" disabled={(!meta.unpublished && saveState === 'saved') || Boolean(busy) || saveState === 'error'} onClick={publishSite}>
                        <Rocket className="h-4 w-4" /> {busy === 'publish' ? 'Publishing…' : 'Publish'}
                    </Button>
                </div>
            </header>

            <div className="flex min-h-0 flex-1">
                {/* Settings */}
                <aside className={cn('relative min-h-0 w-full shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 lg:block lg:w-[25rem]', pane === 'preview' && 'hidden')}>
                    {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
                    {notice && <Alert variant="success" className="mb-4">{notice}</Alert>}
                    <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-sm">
                        {[['home', 'Home page'], ['theme', 'Theme'], ['announcement', 'Top bar'], ['menu', 'Menu & footer'], ['pages', 'Pages'], ['seo', 'Search & social']].map(([key, label]) => (
                            <button key={key} type="button" onClick={() => setTab(key)}
                                className={cn('rounded-lg px-2 py-1.5 font-medium transition', tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900')}>
                                {label}
                            </button>
                        ))}
                    </div>
                    {tab === 'home' && <SectionsEditor draft={draft} update={update} auth={auth} linkOptions={linkOptions} />}
                    {tab === 'announcement' && <AnnouncementEditor draft={draft} update={update} linkOptions={linkOptions} />}
                    {tab === 'menu' && <MenuEditor draft={draft} update={update} linkOptions={linkOptions} />}
                    {tab === 'pages' && <PagesEditor pages={pages} auth={auth} onChanged={reloadPages} />}
                    {tab === 'seo' && <SeoSocialEditor draft={draft} update={update} />}
                    {tab === 'theme' && <ThemeEditor draft={draft} update={update} auth={auth} />}
                </aside>

                {/* Preview of the draft */}
                <section className={cn('min-w-0 flex-1 bg-slate-100 lg:block', pane === 'edit' && 'hidden')} aria-label="Preview of your draft">
                    <Preview draft={draft} device={pane === 'preview' && !wide ? 'fit' : device} />
                </section>
            </div>
        </div>
    )
}

// ------------------------------------------------------------------ live preview

// The window is at least this wide.
function useMediaQuery(query) {
    const [match, setMatch] = useState(() => window.matchMedia(query).matches)
    useEffect(() => {
        const list = window.matchMedia(query)
        const onChange = () => setMatch(list.matches)
        list.addEventListener('change', onChange)
        return () => list.removeEventListener('change', onChange)
    }, [query])
    return match
}

// The shop with the draft applied, filling the panel. Desktop shows the shop at its real
// width scaled down to fit; phone shows it at phone width in a frame; 'fit' (the editor on
// a phone or tablet) shows it at the panel's own width.
function Preview({ draft, device }) {
    const frame = useRef(null)
    const box = useRef(null)
    const [size, setSize] = useState({ width: 800, height: 700 })

    const send = useCallback(() => {
        const win = frame.current && frame.current.contentWindow
        if (win) win.postMessage({ type: 'site-draft', content: draft }, window.location.origin)
    }, [draft])

    useEffect(() => { send() }, [send])
    // The shop in the frame says when it is ready; send it the draft then.
    useEffect(() => {
        const onMessage = (e) => { if (e.origin === window.location.origin && e.data && e.data.type === 'site-preview-ready') send() }
        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
    }, [send])

    useEffect(() => {
        const el = box.current
        if (!el) return undefined
        const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    // Sizes: desktop is shown at its real width scaled down; phone at 390 × 844 scaled to fit.
    const phone = device === 'phone'
    const fit = device === 'fit'
    const gap = fit ? 0 : 16
    const availW = Math.max(size.width - gap * 2, 1)
    const availH = Math.max(size.height - gap * 2, 1)
    let pageWidth = size.width
    let pageHeight = size.height
    let scale = 1
    if (phone) {
        pageWidth = 390
        pageHeight = 844
        scale = Math.min(1, availW / 390, availH / 844)
    } else if (!fit) {
        pageWidth = 1280
        scale = Math.min(1, availW / 1280)
        pageHeight = availH / scale
    }

    return (
        <div ref={box} className="relative h-full overflow-hidden">
            <div className="absolute left-1/2 origin-top" style={{ top: gap, width: pageWidth, height: pageHeight, transform: `translateX(-50%) scale(${scale})` }}>
                <iframe ref={frame} name={PREVIEW_FRAME} title="Website preview" src="/#/" onLoad={send}
                    className={cn('h-full w-full bg-white shadow-sm', phone ? 'rounded-[2rem] border-[10px] border-slate-900' : fit ? '' : 'rounded-xl border border-slate-200')} />
            </div>
        </div>
    )
}

// ------------------------------------------------------------------ home page sections

function SectionsEditor({ draft, update, auth, linkOptions }) {
    const [open, setOpen] = useState(null)
    const [adding, setAdding] = useState(false)
    const sections = draft.sections

    const setSections = (next) => update({ ...draft, sections: next })
    const change = (id, changes) => setSections(sections.map((s) => (s.id === id ? { ...s, ...changes } : s)))
    const move = (index, by) => {
        const next = [...sections]
        const [item] = next.splice(index, 1)
        next.splice(index + by, 0, item)
        setSections(next)
    }
    const remove = (s) => {
        if (window.confirm(`Remove the "${s.title || SECTION_TYPES[s.type].label}" section?`)) setSections(sections.filter((x) => x.id !== s.id))
    }
    const add = (type) => {
        const section = { id: newId(), type, hidden: false, ...NEW_SECTION[type] }
        // A hero banner goes at the top; other new sections go above the full product list.
        const at = type === 'hero' ? 0 : sections.findIndex((s) => s.type === 'catalog')
        const next = [...sections]
        next.splice(at === -1 ? next.length : at, 0, section)
        setSections(next)
        setOpen(section.id)
        setAdding(false)
    }
    const hasCatalog = sections.some((s) => s.type === 'catalog')

    return (
        <div className="space-y-2">
            {sections.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">The home page is empty. Add a section to start.</p>}
            {sections.map((s, i) => {
                const info = SECTION_TYPES[s.type]
                const Icon = info.icon
                const isOpen = open === s.id
                return (
                    <Card key={s.id} className={cn('overflow-hidden rounded-xl', s.hidden && 'opacity-60')}>
                        <div className="flex items-center gap-2 px-3 py-2.5">
                            <button type="button" onClick={() => setOpen(isOpen ? null : s.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon className="h-4 w-4" /></span>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-slate-900">{s.title || info.label}</span>
                                    <span className="block truncate text-xs text-slate-500">{info.label}{s.hidden ? ' · hidden' : ''}</span>
                                </span>
                                {isOpen ? <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-slate-400" /> : <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-400" />}
                            </button>
                            <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></IconButton>
                            <IconButton label="Move down" disabled={i === sections.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></IconButton>
                            <IconButton label={s.hidden ? 'Show section' : 'Hide section'} onClick={() => change(s.id, { hidden: !s.hidden })}>
                                {s.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </IconButton>
                            <IconButton label="Remove section" onClick={() => remove(s)} danger><Trash2 className="h-4 w-4" /></IconButton>
                        </div>
                        {isOpen && (
                            <div className="space-y-4 border-t border-slate-100 bg-slate-50/50 px-4 py-4">
                                <p className="text-xs text-slate-500">{info.hint}</p>
                                <SectionFields section={s} change={(changes) => change(s.id, changes)} auth={auth} linkOptions={linkOptions} />
                            </div>
                        )}
                    </Card>
                )
            })}

            {adding ? (
                <Card className="rounded-xl p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">Add a section</p>
                        <IconButton label="Close" onClick={() => setAdding(false)}><X className="h-4 w-4" /></IconButton>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(SECTION_TYPES).filter(([type]) => type !== 'catalog' || !hasCatalog).map(([type, info]) => {
                            const Icon = info.icon
                            return (
                                <button key={type} type="button" onClick={() => add(type)}
                                    className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-400 hover:bg-brand-50/40">
                                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                                    <span>
                                        <span className="block text-sm font-semibold text-slate-900">{info.label}</span>
                                        <span className="block text-xs text-slate-500">{info.hint}</span>
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </Card>
            ) : (
                <Button block variant="secondary" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add section</Button>
            )}
        </div>
    )
}

function IconButton({ label, onClick, disabled, danger, children }) {
    return (
        <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
            className={cn('rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent',
                danger && 'hover:bg-rose-50 hover:text-rose-600')}>
            {children}
        </button>
    )
}

function SectionFields({ section: s, change, auth, linkOptions }) {
    const set = (key) => (e) => change({ [key]: e.target.value })
    const text = (key, label, placeholder, max) => (
        <Field label={label} id={`${s.id}-${key}`}>
            <Input id={`${s.id}-${key}`} value={s[key] || ''} maxLength={max} placeholder={placeholder} onChange={set(key)} className="!h-10" />
        </Field>
    )
    const button = (labelKey, linkKey, label) => (
        <div className="grid grid-cols-2 gap-2">
            {text(labelKey, `${label} text`, 'e.g. Shop now', 40)}
            <Field label={`${label} link`} id={`${s.id}-${linkKey}`}>
                <LinkPicker value={s[linkKey] || ''} onChange={(v) => change({ [linkKey]: v })} options={linkOptions} />
            </Field>
        </div>
    )

    switch (s.type) {
        case 'hero':
            return (
                <>
                    {text('badge', 'Small label above the headline', 'e.g. Straight from local farms', 60)}
                    {text('title', 'Headline', 'e.g. Fresh food from local farms', 120)}
                    <Field label="Text" id={`${s.id}-text`}><Textarea id={`${s.id}-text`} rows={3} maxLength={400} value={s.text || ''} onChange={set('text')} /></Field>
                    {button('button_label', 'button_link', 'Main button')}
                    {button('second_label', 'second_link', 'Second link')}
                    <ImagePicker value={s.image} onChange={(v) => change({ image: v })} auth={auth} hint="Optional. Wide photos look best. Without one, the store colour is used." />
                </>
            )
        case 'slides':
            return <SlidesFields slides={s.slides || []} onChange={(slides) => change({ slides })} auth={auth} linkOptions={linkOptions} />
        case 'categories':
            return (
                <>
                    {text('title', 'Title', 'e.g. Shop by category', 120)}
                    {text('subtitle', 'Text under the title', '', 300)}
                    <CategoryPicker value={s.categories || []} onChange={(v) => change({ categories: v })} />
                </>
            )
        case 'products':
            return (
                <>
                    {text('title', 'Title', 'e.g. This week\'s picks', 120)}
                    {text('subtitle', 'Text under the title', '', 300)}
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Which products" id={`${s.id}-source`}>
                            <Select id={`${s.id}-source`} value={s.source} onChange={set('source')} className="!h-10">
                                <option value="newest">Newest</option>
                                <option value="offers">On offer</option>
                                <option value="top_rated">Top rated</option>
                                <option value="category">From a category</option>
                                <option value="picked">Hand-picked</option>
                            </Select>
                        </Field>
                        <Field label="How many" id={`${s.id}-limit`}>
                            <Select id={`${s.id}-limit`} value={s.limit} onChange={(e) => change({ limit: Number(e.target.value) })} className="!h-10">
                                {[4, 8, 12].map((n) => <option key={n} value={n}>{n}</option>)}
                            </Select>
                        </Field>
                    </div>
                    {s.source === 'category' && <CategorySelect value={s.category} onChange={(v) => change({ category: v })} />}
                    {s.source === 'picked' && <ProductPicker value={s.product_ids || []} onChange={(v) => change({ product_ids: v })} auth={auth} />}
                    {button('link_label', 'link', '"See all" link')}
                </>
            )
        case 'promo':
            return (
                <>
                    {text('title', 'Headline', 'e.g. Winter rice festival', 120)}
                    <Field label="Text" id={`${s.id}-text`}><Textarea id={`${s.id}-text`} rows={3} maxLength={400} value={s.text || ''} onChange={set('text')} /></Field>
                    {button('button_label', 'button_link', 'Button')}
                    <Field label="Style" id={`${s.id}-style`}>
                        <Select id={`${s.id}-style`} value={s.style} onChange={set('style')} className="!h-10">
                            <option value="brand">Store colour</option>
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                        </Select>
                    </Field>
                    <ImagePicker value={s.image} onChange={(v) => change({ image: v })} auth={auth} hint="Optional. Shown on the right." />
                </>
            )
        case 'text_image':
            return (
                <>
                    {text('title', 'Title', 'e.g. Our story', 120)}
                    {text('subtitle', 'Small label', 'e.g. Since 2020', 300)}
                    <Field label="Text" id={`${s.id}-text`} hint="Leave an empty line between paragraphs.">
                        <Textarea id={`${s.id}-text`} rows={6} maxLength={2000} value={s.text || ''} onChange={set('text')} />
                    </Field>
                    {button('button_label', 'button_link', 'Link')}
                    <ImagePicker value={s.image} onChange={(v) => change({ image: v })} auth={auth} />
                    {s.image && (
                        <Field label="Photo on the" id={`${s.id}-side`}>
                            <Select id={`${s.id}-side`} value={s.image_side} onChange={set('image_side')} className="!h-10">
                                <option value="right">Right</option>
                                <option value="left">Left</option>
                            </Select>
                        </Field>
                    )}
                </>
            )
        case 'catalog':
            return (
                <>
                    {text('title', 'Title', 'e.g. Fresh from the farm', 120)}
                    {text('subtitle', 'Text under the title', '', 300)}
                    <p className="text-xs text-slate-500">This list always includes the filters and is used for search results.</p>
                </>
            )
        default:
            return null
    }
}

function LinkPicker({ value, onChange, options }) {
    const known = options.some(([, link]) => link === value)
    const [custom, setCustom] = useState(Boolean(value) && !known)
    return (
        <div className="space-y-1.5">
            <Select value={custom ? '__custom' : value} onChange={(e) => {
                if (e.target.value === '__custom') { setCustom(true); return }
                setCustom(false)
                onChange(e.target.value)
            }} className="!h-10">
                <option value="">No link</option>
                {options.map(([label, link]) => <option key={link} value={link}>{label}</option>)}
                <option value="__custom">Other address…</option>
            </Select>
            {custom && <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/page/... or https://..." className="!h-10" />}
        </div>
    )
}

// The photos of a banner slider: each with an optional link, in order, up to 8.
function SlidesFields({ slides, onChange, auth, linkOptions }) {
    const set = (i, changes) => onChange(slides.map((x, j) => (j === i ? { ...x, ...changes } : x)))
    const move = (i, by) => {
        const next = [...slides]
        const [item] = next.splice(i, 1)
        next.splice(i + by, 0, item)
        onChange(next)
    }
    return (
        <div className="space-y-3">
            <p className="text-xs text-slate-500">Wide photos (about 2:1) look best. Customers can swipe between them on a phone.</p>
            {slides.map((slide, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">Photo {i + 1}</p>
                        <div className="flex gap-1">
                            <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></IconButton>
                            <IconButton label="Move down" disabled={i === slides.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></IconButton>
                            <IconButton label="Remove photo" danger onClick={() => onChange(slides.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></IconButton>
                        </div>
                    </div>
                    <ImagePicker value={slide.image} onChange={(v) => set(i, { image: v })} auth={auth} />
                    <Field label="Opens when tapped (optional)" id={`slide-${i}-link`}>
                        <LinkPicker value={slide.link || ''} onChange={(v) => set(i, { link: v })} options={linkOptions} />
                    </Field>
                    <Field label="Description for screen readers" id={`slide-${i}-alt`}>
                        <Input id={`slide-${i}-alt`} maxLength={120} value={slide.alt || ''} onChange={(e) => set(i, { alt: e.target.value })} placeholder="e.g. Pickle week: 20% off all pickles" className="!h-10" />
                    </Field>
                </div>
            ))}
            <Button size="sm" variant="secondary" disabled={slides.length >= 8} onClick={() => onChange([...slides, { image: '', link: '', alt: '' }])}>
                <Plus className="h-3.5 w-3.5" /> Add photo
            </Button>
        </div>
    )
}

function ImagePicker({ value, onChange, auth, hint }) {
    const fileRef = useRef(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const upload = (file) => {
        if (!file) return
        const form = new FormData()
        form.append('image', file)
        setBusy(true)
        setError('')
        axios.post('/api/site/images/', form, auth)
            .then(({ data }) => onChange(data.url))
            .catch((e) => setError(errorText(e)))
            .finally(() => setBusy(false))
    }
    return (
        <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Photo</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" aria-label="Upload photo"
                onChange={(e) => { upload(e.target.files[0]); e.target.value = '' }} />
            {value ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
                    <img src={value} alt="" className="h-14 w-20 rounded-lg object-cover" />
                    <div className="flex flex-1 gap-1">
                        <Button size="sm" variant="secondary" onClick={() => fileRef.current.click()} disabled={busy}><Upload className="h-3.5 w-3.5" /> Change</Button>
                        <Button size="sm" variant="ghost" onClick={() => onChange('')}><X className="h-3.5 w-3.5" /> Remove</Button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => fileRef.current.click()} disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-600 hover:border-brand-400">
                    <Upload className="h-4 w-4" /> {busy ? 'Uploading…' : 'Upload a photo'}
                </button>
            )}
            {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
            {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
        </div>
    )
}

function CategoryPicker({ value, onChange }) {
    const categories = useCategories()
    const toggle = (keyword) => onChange(value.includes(keyword) ? value.filter((k) => k !== keyword) : [...value, keyword])
    return (
        <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Categories to show</p>
            <p className="mb-2 text-xs text-slate-500">{value.length ? 'Shown in the order you tick them.' : 'None ticked: all categories are shown.'}</p>
            <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => {
                    const on = value.includes(c.keyword)
                    return (
                        <button key={c.keyword} type="button" onClick={() => toggle(c.keyword)} aria-pressed={on}
                            className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition',
                                on ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50')}>
                            {on && <Check className="h-3 w-3" />}{c.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function CategorySelect({ value, onChange }) {
    const categories = useCategories()
    return (
        <Field label="Category" id="row-category">
            <Select id="row-category" value={value || ''} onChange={(e) => onChange(e.target.value)} className="!h-10">
                <option value="">Choose a category</option>
                {categories.map((c) => <option key={c.keyword} value={c.keyword}>{c.label}</option>)}
            </Select>
        </Field>
    )
}

function ProductPicker({ value, onChange, auth }) {
    const [products, setProducts] = useState(null)
    const [query, setQuery] = useState('')
    useEffect(() => {
        axios.get('/api/products/?scope=all&page_size=100&sort=name', auth).then(({ data }) => setProducts(data.products)).catch(() => setProducts([]))
    }, [auth])
    const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id].slice(0, 24))
    const shown = (products || []).filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    return (
        <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Products <span className="font-normal text-slate-500">({value.length} chosen)</span></p>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className="!h-9 mb-2" aria-label="Search products to add" />
            <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1">
                {!products ? <Spinner /> : shown.map((p) => (
                    <label key={p._id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                        <input type="checkbox" checked={value.includes(p._id)} onChange={() => toggle(p._id)} className="accent-brand-600" />
                        <img src={p.image} alt="" className="h-7 w-7 rounded object-cover" />
                        <span className="flex-1 truncate text-slate-800">{p.name}</span>
                        {p.sell_online === false && <span className="text-xs text-amber-700">not online</span>}
                    </label>
                ))}
            </div>
        </div>
    )
}

// ------------------------------------------------------------------ announcement, menu, footer

function AnnouncementEditor({ draft, update, linkOptions }) {
    const a = draft.announcement || {}
    const set = (changes) => update({ ...draft, announcement: { ...a, ...changes } })
    return (
        <Card className="space-y-4 rounded-xl p-4">
            <div>
                <p className="font-semibold text-slate-900">Announcement bar</p>
                <p className="text-sm text-slate-500">A thin strip above the shop's header, in the store colour. Good for offers and delivery news.</p>
            </div>
            <Checkbox id="ann-on" label="Show the announcement bar" checked={Boolean(a.enabled)} onChange={(e) => set({ enabled: e.target.checked })} />
            <Field label="Message" id="ann-text" hint={`${(a.text || '').length}/200`}>
                <Input id="ann-text" maxLength={200} value={a.text || ''} onChange={(e) => set({ text: e.target.value })} placeholder="e.g. Free delivery on orders over ₹1,000" />
            </Field>
            <Field label="Link (optional)" id="ann-link">
                <LinkPicker value={a.link || ''} onChange={(v) => set({ link: v })} options={linkOptions} />
            </Field>
        </Card>
    )
}

function LinkListEditor({ title, hint, items, onChange, linkOptions, max }) {
    const set = (i, changes) => onChange(items.map((x, j) => (j === i ? { ...x, ...changes } : x)))
    const move = (i, by) => {
        const next = [...items]
        const [item] = next.splice(i, 1)
        next.splice(i + by, 0, item)
        onChange(next)
    }
    return (
        <Card className="rounded-xl p-4">
            <p className="font-semibold text-slate-900">{title}</p>
            <p className="mb-3 text-sm text-slate-500">{hint}</p>
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-2">
                        <div className="flex items-center gap-1">
                            <Input value={item.label} maxLength={40} onChange={(e) => set(i, { label: e.target.value })} placeholder="Link text" className="!h-9 flex-1" aria-label="Link text" />
                            <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></IconButton>
                            <IconButton label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></IconButton>
                            <IconButton label="Remove link" danger onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></IconButton>
                        </div>
                        <div className="mt-1.5"><LinkPicker value={item.link} onChange={(v) => set(i, { link: v })} options={linkOptions} /></div>
                    </div>
                ))}
            </div>
            <Button size="sm" variant="secondary" className="mt-3" disabled={items.length >= max} onClick={() => onChange([...items, { label: 'New link', link: '/' }])}>
                <Plus className="h-3.5 w-3.5" /> Add link
            </Button>
        </Card>
    )
}

function MenuEditor({ draft, update, linkOptions }) {
    return (
        <div className="space-y-4">
            <LinkListEditor title="Menu" hint="The links in the shop's ☰ menu." max={10}
                items={draft.menu || []} onChange={(menu) => update({ ...draft, menu })} linkOptions={linkOptions} />
            <LinkListEditor title="Footer links" hint={'The "Explore" links at the bottom of every page. "Staff sign-in" is always added.'} max={12}
                items={draft.footer_links || []} onChange={(footer_links) => update({ ...draft, footer_links })} linkOptions={linkOptions} />
        </div>
    )
}

// ------------------------------------------------------------------ theme

function ThemeEditor({ draft, update, auth }) {
    const theme = { accent: '', header: 'solid', logo: '', show_name: true, ...(draft.theme || {}) }
    const set = (changes) => update({ ...draft, theme: { ...theme, ...changes } })
    const contrast = whiteContrast(theme.accent)
    const business = activeBusinessInfo(useSelector((state) => state.userLogin).userInfo)
    // The header samples use the colour being chosen, before it is published.
    const palette = brandPalette(theme.accent)
    const sample = (style) => ({ background: style === 'gradient' ? `linear-gradient(to right, ${palette[800]}, ${palette[600]}, ${palette[500]})` : palette[600] })
    const swatch = (hex) => (
        <span className="relative flex h-full w-full items-center justify-center rounded-xl" style={{ background: hex }}>
            {theme.accent.toLowerCase() === hex && <Check className="h-5 w-5 text-white" />}
        </span>
    )
    return (
        <div className="space-y-4">
            <Card className="space-y-4 rounded-xl p-4">
                <div>
                    <p className="font-semibold text-slate-900">Logo</p>
                    <p className="text-sm text-slate-500">Shown in the online shop's header, footer and browser tab. Leave empty to use the store logo from Settings. A PNG with a transparent or white background works best.</p>
                </div>
                {theme.logo && (
                    <div className="flex items-center justify-center rounded-xl p-4" style={sample(theme.header)}>
                        <span className="flex items-center gap-2.5">
                            <img src={theme.logo} alt="" className="h-11 w-auto max-w-[9rem] rounded-lg bg-white object-contain p-1" />
                            {theme.show_name && <span className="text-lg font-extrabold text-white">{business ? business.name : 'Your shop'}</span>}
                        </span>
                    </div>
                )}
                <ImagePicker value={theme.logo} onChange={(v) => set({ logo: v })} auth={auth} hint="JPG, PNG, WEBP or GIF, up to 8 MB. Square or wide logos both fit." />
                <Checkbox id="theme-show-name" label="Show the store name next to the logo" checked={theme.show_name !== false}
                    onChange={(e) => set({ show_name: e.target.checked })} />
            </Card>

            <Card className="space-y-4 rounded-xl p-4">
                <div>
                    <p className="font-semibold text-slate-900">Shop colour</p>
                    <p className="text-sm text-slate-500">The online shop's header, buttons, tabs and highlights. The admin, counter and receipts use their own colour, set in Settings. Prices and Buy buttons stay red so shoppers can always find them.</p>
                </div>
                <div className="grid grid-cols-6 gap-2">
                    {THEME_PRESETS.map(([label, hex]) => (
                        <button key={hex} type="button" onClick={() => set({ accent: hex })} title={label} aria-label={`${label} colour`}
                            aria-pressed={theme.accent.toLowerCase() === hex}
                            className={cn('h-11 rounded-xl p-0.5 transition hover:scale-105', theme.accent.toLowerCase() === hex ? 'ring-2 ring-slate-900 ring-offset-2' : '')}>
                            {swatch(hex)}
                        </button>
                    ))}
                    <label className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white" title="Pick any colour">
                        <input type="color" value={isHex(theme.accent) ? theme.accent : '#047857'} onChange={(e) => set({ accent: e.target.value })}
                            className="h-6 w-7 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Pick any colour" />
                    </label>
                </div>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-4 w-4 rounded" style={{ background: theme.accent }} /> <span className="font-mono">{theme.accent}</span>
                </p>
                {contrast < 3 ? (
                    <Alert variant="danger">White text on this colour is hard to read. Pick a darker shade so buttons and the header stay clear.</Alert>
                ) : contrast < 4.5 ? (
                    <Alert variant="warning">Small white text on this colour can be hard to read for some people. A slightly darker shade works better.</Alert>
                ) : null}
            </Card>

            <Card className="space-y-3 rounded-xl p-4">
                <p className="font-semibold text-slate-900">Header style</p>
                <div className="grid grid-cols-2 gap-3">
                    {[['solid', 'Solid'], ['gradient', 'Gradient']].map(([value, label]) => (
                        <button key={value} type="button" onClick={() => set({ header: value })} aria-pressed={theme.header === value}
                            className={cn('overflow-hidden rounded-xl text-left ring-1 transition', theme.header === value ? 'ring-2 ring-brand-600' : 'ring-slate-200 hover:ring-slate-300')}>
                            <span className="block h-14 px-3 pt-2.5 text-sm font-bold text-white" style={sample(value)}>
                                Your shop
                                <span className="mt-1.5 block h-3 w-3/4 rounded-full bg-white/90" />
                            </span>
                            <span className="block bg-white px-3 py-2 text-sm font-medium text-slate-800">{label}</span>
                        </button>
                    ))}
                </div>
                <p className="text-xs text-slate-500">The preview on the right shows the colour and header straight away. Customers see them after you publish.</p>
            </Card>
        </div>
    )
}

// ------------------------------------------------------------------ search engines and social pages

const SOCIAL_FIELDS = [
    ['website', 'Website', 'https://www.example.com'],
    ['facebook', 'Facebook page', 'https://facebook.com/yourshop'],
    ['instagram', 'Instagram', 'https://instagram.com/yourshop'],
    ['youtube', 'YouTube', 'https://youtube.com/@yourshop'],
]

function SeoSocialEditor({ draft, update }) {
    const seo = draft.seo || {}
    const social = draft.social || {}
    const setSeo = (changes) => update({ ...draft, seo: { ...seo, ...changes } })
    const setSocial = (changes) => update({ ...draft, social: { ...social, ...changes } })
    return (
        <div className="space-y-4">
            <Card className="space-y-4 rounded-xl p-4">
                <div>
                    <p className="font-semibold text-slate-900">Search engines and link previews</p>
                    <p className="text-sm text-slate-500">What Google and shared links show for your shop. Leave empty to use the store name and tagline.</p>
                </div>
                <Field label="Page title" id="seo-title" hint={`${(seo.title || '').length}/70`}>
                    <Input id="seo-title" maxLength={70} value={seo.title || ''} onChange={(e) => setSeo({ title: e.target.value })} placeholder="e.g. Krishi Bazar · Fresh rice, spices and tea" />
                </Field>
                <Field label="Description" id="seo-description" hint={`${(seo.description || '').length}/160`}>
                    <Textarea id="seo-description" rows={3} maxLength={160} value={seo.description || ''} onChange={(e) => setSeo({ description: e.target.value })}
                        placeholder="One or two sentences about what you sell and where you deliver." />
                </Field>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-medium text-slate-400">Search result preview</p>
                    <p className="mt-1 truncate text-base text-blue-700">{seo.title || 'Your store name · your tagline'}</p>
                    <p className="line-clamp-2 text-sm text-slate-600">{seo.description || 'Your description will appear here.'}</p>
                </div>
            </Card>
            <Card className="space-y-4 rounded-xl p-4">
                <div>
                    <p className="font-semibold text-slate-900">Social pages</p>
                    <p className="text-sm text-slate-500">Shown as icons in the footer. Only the ones you fill in appear. Use full https:// addresses.</p>
                </div>
                {SOCIAL_FIELDS.map(([key, label, placeholder]) => (
                    <Field key={key} label={label} id={`social-${key}`}>
                        <Input id={`social-${key}`} type="url" maxLength={300} value={social[key] || ''} onChange={(e) => setSocial({ [key]: e.target.value.trim() })} placeholder={placeholder} />
                    </Field>
                ))}
            </Card>
        </div>
    )
}

// ------------------------------------------------------------------ custom pages

function PagesEditor({ pages, auth, onChanged }) {
    const [editing, setEditing] = useState(null)
    const remove = (p) => {
        if (!window.confirm(`Delete the page "${p.title}"? Links to it will stop working.`)) return
        axios.delete(`/api/site/pages/${p.id}/`, auth).then(onChanged)
    }
    return (
        <div className="space-y-2">
            <p className="text-sm text-slate-500">Pages like About us, Delivery and returns or FAQ. Add them to the menu or footer from the "Menu & footer" tab.</p>
            {pages.map((p) => (
                <Card key={p.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{p.title}</p>
                        <p className="truncate text-xs text-slate-500">/page/{p.slug}</p>
                    </div>
                    {p.published ? <Badge variant="green">Published</Badge> : <Badge variant="amber">Draft</Badge>}
                    <IconButton label="Open page" onClick={() => window.open(`/#/page/${p.slug}`, '_blank')}><ExternalLink className="h-4 w-4" /></IconButton>
                    <IconButton label={`Edit ${p.title}`} onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></IconButton>
                    <IconButton label={`Delete ${p.title}`} danger onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></IconButton>
                </Card>
            ))}
            <Button block variant="secondary" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New page</Button>
            {editing && <PageModal page={editing} auth={auth} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged() }} />}
        </div>
    )
}

function PageModal({ page, auth, onClose, onSaved }) {
    const isNew = !page.id
    const [title, setTitle] = useState(page.title || '')
    const [slug, setSlug] = useState(page.slug || '')
    const [body, setBody] = useState('')
    const [published, setPublished] = useState(Boolean(page.published))
    const [loading, setLoading] = useState(!isNew)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isNew) return
        axios.get(`/api/site/pages/${page.id}/`, auth).then(({ data }) => setBody(data.body || '')).finally(() => setLoading(false))
    }, [isNew, page.id, auth])

    const save = (e) => {
        e.preventDefault()
        setSaving(true)
        const data = { title, slug, body, published }
        const req = isNew ? axios.post('/api/site/pages/', data, auth) : axios.patch(`/api/site/pages/${page.id}/`, data, auth)
        req.then(onSaved).catch((err) => { setError(errorText(err)); setSaving(false) })
    }

    return (
        <Modal show onClose={onClose} title={isNew ? 'New page' : `Edit ${page.title}`} size="lg">
            {loading ? <Spinner /> : (
                <form onSubmit={save} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Title" id="page-title"><Input id="page-title" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Delivery and returns" /></Field>
                        <Field label="Address" id="page-slug" hint={`/page/${slug || (title || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '…'}`}>
                            <Input id="page-slug" maxLength={80} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Made from the title if empty" />
                        </Field>
                    </div>
                    <div>
                        <p className="mb-1.5 text-sm font-medium text-slate-700">Content</p>
                        <CKEditor editor={ClassicEditor} data={body} onChange={(e, editor) => setBody(editor.getData())} />
                    </div>
                    <Checkbox id="page-published" label="Published (customers can open it)" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                    {error && <Alert variant="danger">{error}</Alert>}
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Create page' : 'Save page'}</Button>
                    </div>
                </form>
            )}
        </Modal>
    )
}

export default WebsiteScreen
