import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Sprout, Maximize, Minimize, Menu, X, ExternalLink } from 'lucide-react'
import AdminSideBar from './AdminSideBar'
import { Button, cn } from '../components/ui'

// Full-window frame for every admin page: admin top bar, sidebar, scrolling content.
// It replaces the storefront header, footer and chat on admin pages.
function AdminShell({ children }) {
    const { pathname } = useLocation()
    const { userInfo } = useSelector((state) => state.userLogin)
    const [menuOpen, setMenuOpen] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))

    // The counter needs every pixel, so it gets an icon-only sidebar and no page padding.
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

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
                <button type="button" onClick={() => setMenuOpen(true)} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                </button>
                <Link to="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white"><Sprout className="h-4 w-4" /></span>
                    <span className="hidden sm:inline">Krishi <span className="text-brand-600">Bazar</span></span>
                </Link>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">Admin</span>

                <div className="ml-auto flex items-center gap-2">
                    <Link to="/" className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:flex">
                        <ExternalLink className="h-4 w-4" /> View shop
                    </Link>
                    {userInfo && (
                        <span className="hidden items-center gap-2 text-sm text-slate-600 md:flex">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                                {(userInfo.name || '?').charAt(0).toUpperCase()}
                            </span>
                            {userInfo.name}
                        </span>
                    )}
                    <Button variant="secondary" size="sm" onClick={toggleFullscreen} title={isFullscreen ? 'Exit full screen (Esc)' : 'Full screen'}>
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                        <span className="hidden sm:inline">{isFullscreen ? 'Exit full screen' : 'Full screen'}</span>
                    </Button>
                </div>
            </header>

            <div className="flex min-h-0 flex-1">
                <aside className={cn('hidden shrink-0 overflow-y-auto border-r border-slate-200 bg-white lg:block', isCounter ? 'w-16' : 'w-60')}>
                    <AdminSideBar compact={isCounter} />
                </aside>

                <main className={cn('min-w-0 flex-1 overflow-y-auto', !isCounter && 'px-4 py-6 sm:px-6 lg:px-8')}>
                    {children}
                </main>
            </div>

            {/* Phone and tablet menu */}
            {menuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
                        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4">
                            <span className="font-bold text-slate-900">Menu</span>
                            <button type="button" onClick={() => setMenuOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close menu">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <AdminSideBar onNavigate={() => setMenuOpen(false)} />
                        </div>
                        <Link to="/" className="flex items-center gap-2 border-t border-slate-200 px-6 py-3 text-sm font-medium text-slate-600">
                            <ExternalLink className="h-4 w-4" /> View shop
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminShell
