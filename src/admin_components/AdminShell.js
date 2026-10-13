import React, { useEffect, useRef, useState } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Sprout, Maximize, Minimize, Menu, X, ExternalLink, Plus } from 'lucide-react'
import AdminSideBar from './AdminSideBar'
import { Button, Modal, cn } from '../components/ui'
import ErrorBoundary from '../components/ErrorBoundary'
import { logout } from '../actions/userActions'
import { ROLE_LABELS, canOpen, homeFor, roleOf } from './roles'

// Sign out after this long without activity, so the next person at a shared
// computer can't use the previous login. A warning shows for the last minute.
const IDLE_MINUTES = 30
const WARN_SECONDS = 60
const ACTIVITY_KEY = 'staffLastActive'
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel']

// Shared across tabs through localStorage, so activity in one tab keeps the others signed in.
const readActivity = () => {
    try { return Number(localStorage.getItem(ACTIVITY_KEY)) || 0 } catch (e) { return 0 }
}
const writeActivity = (time) => {
    try { localStorage.setItem(ACTIVITY_KEY, String(time)) } catch (e) { /* storage unavailable */ }
}

function useIdleSignOut(onSignOut) {
    const [secondsLeft, setSecondsLeft] = useState(null)
    const lastWrite = useRef(0)

    useEffect(() => {
        let local = Date.now()
        writeActivity(local)
        const bump = () => {
            local = Date.now()
            // Writing on every mouse move is wasteful; every few seconds is enough.
            if (local - lastWrite.current > 5000) {
                lastWrite.current = local
                writeActivity(local)
            }
        }
        ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, bump, { passive: true }))
        const timer = setInterval(() => {
            const last = Math.max(local, readActivity())
            const remaining = IDLE_MINUTES * 60 - (Date.now() - last) / 1000
            if (remaining <= 0) onSignOut()
            else setSecondsLeft(remaining <= WARN_SECONDS ? Math.ceil(remaining) : null)
        }, 1000)
        return () => {
            clearInterval(timer)
            ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, bump))
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const stayIn = () => { writeActivity(Date.now()); setSecondsLeft(null) }
    return { secondsLeft, stayIn }
}

const todayText = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

function Logo({ compact, home = '/dashboard' }) {
    return (
        <Link to={home} className={cn('flex h-14 shrink-0 items-center gap-2.5 font-bold text-white', compact ? 'justify-center' : 'px-5')}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white"><Sprout className="h-4 w-4" /></span>
            {!compact && <span>Krishi <span className="text-brand-400">Bazar</span></span>}
        </Link>
    )
}

// Full-window frame for every admin page: dark left menu, light top bar, grey work area.
// It replaces the storefront header, footer and chat on admin pages.
function AdminShell({ children }) {
    const { pathname } = useLocation()
    const history = useHistory()
    const dispatch = useDispatch()
    const { userInfo } = useSelector((state) => state.userLogin)
    const { secondsLeft, stayIn } = useIdleSignOut(() => {
        // The admin gate sends signed-out staff to the sign-in page with a link back
        // to this page; the flag tells that page to explain why.
        try { sessionStorage.setItem('staffSignedOutIdle', '1') } catch (e) { /* ignore */ }
        dispatch(logout())
    })
    const [menuOpen, setMenuOpen] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))

    // The counter needs every pixel, so it gets the narrow icon rail and no page padding.
    const isCounter = pathname.startsWith('/admin/counter')

    useEffect(() => {
        const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
        document.addEventListener('fullscreenchange', onChange)
        return () => document.removeEventListener('fullscreenchange', onChange)
    }, [])

    useEffect(() => setMenuOpen(false), [pathname])

    const toggleFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen()
        else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {})
    }

    const name = userInfo && (userInfo.name || userInfo.email)
    const role = roleOf(userInfo)
    const home = homeFor(role)

    return (
        <div className="flex h-screen bg-[#f3f4f6]">
            <aside className={cn('hidden shrink-0 flex-col bg-[#16191d] lg:flex', isCounter ? 'w-[76px]' : 'w-60')}>
                <Logo compact={isCounter} home={home} />
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <AdminSideBar compact={isCounter} />
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
                    <button type="button" onClick={() => setMenuOpen(true)} className="-ml-1 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">Krishi Bazar · Sylhet</p>
                        <p className="hidden truncate text-xs text-slate-500 sm:block">{todayText()}</p>
                    </div>

                    <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                        {!isCounter && canOpen(role, '/admin/counter') && (
                            <Link to="/admin/counter" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">
                                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New sale</span>
                            </Link>
                        )}
                        <Link to="/" className="hidden h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:inline-flex">
                            <ExternalLink className="h-4 w-4" /> View shop
                        </Link>
                        <button type="button" onClick={toggleFullscreen} title={isFullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
                            aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                        </button>
                        {name && (
                            <span className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-3 text-sm text-slate-700">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16191d] text-xs font-bold text-white">
                                    {name.charAt(0).toUpperCase()}
                                </span>
                                <span className="hidden leading-tight md:block">
                                    <span className="block font-medium">{name}</span>
                                    <span className="block text-xs text-slate-500">{ROLE_LABELS[role]}</span>
                                </span>
                            </span>
                        )}
                    </div>
                </header>

                <main className={cn('min-h-0 flex-1 overflow-y-auto', !isCounter && 'px-4 py-6 sm:px-6 lg:px-8')}>
                    {/* A crash on one page leaves the menu working so staff can move on. */}
                    <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
                </main>
            </div>

            <Modal show={secondsLeft !== null} onClose={stayIn} title="Are you still there?" size="sm">
                <p className="text-sm text-slate-600">
                    For security you'll be signed out in <strong className="text-slate-900">{secondsLeft} seconds</strong> because nothing has happened for a while.
                    An open bill at the counter is kept.
                </p>
                <div className="mt-5 flex gap-2">
                    <Button block variant="secondary" onClick={() => { dispatch(logout()); history.push('/staff') }}>Sign out now</Button>
                    <Button block autoFocus onClick={stayIn}>Stay signed in</Button>
                </div>
            </Modal>

            {/* Phone and tablet menu */}
            {menuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuOpen(false)} />
                    <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-[#16191d] shadow-xl">
                        <div className="flex items-center justify-between pr-3">
                            <Logo home={home} />
                            <button type="button" onClick={() => setMenuOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close menu">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <AdminSideBar onNavigate={() => setMenuOpen(false)} />
                        </div>
                        <Link to="/" className="flex items-center gap-2 border-t border-white/10 px-6 py-3 text-sm font-medium text-slate-400 hover:text-white">
                            <ExternalLink className="h-4 w-4" /> View shop
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminShell
