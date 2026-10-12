import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Sprout, Maximize, Minimize, Menu, X, ExternalLink, Plus } from 'lucide-react'
import AdminSideBar from './AdminSideBar'
import { cn } from '../components/ui'
import { ROLE_LABELS, canOpen, homeFor, roleOf } from './roles'

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
    const { userInfo } = useSelector((state) => state.userLogin)
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
                    {children}
                </main>
            </div>

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
