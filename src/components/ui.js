import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

// Small Tailwind UI kit that replaces the React-Bootstrap components.

export function cn(...classes) {
    return classes.filter(Boolean).join(' ')
}

// A page column. Pages that want a narrower column (e.g. checkout) pass their own max-w-*.
export function Container({ className, children }) {
    const ownWidth = /(^|\s)max-w-/.test(className || '')
    return <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', !ownWidth && 'max-w-7xl', className)}>{children}</div>
}

const buttonVariants = {
    primary: 'bg-brand-600 text-white shadow-xs hover:bg-brand-700',
    dark: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-white text-slate-700 shadow-xs ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-900',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    'danger-soft': 'bg-rose-50 text-rose-600 hover:bg-rose-100',
    accent: 'bg-amber-400 text-slate-900 hover:bg-amber-300',
}

const buttonSizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-3.5 text-sm gap-2',
    lg: 'h-11 px-5 text-[15px] gap-2',
    icon: 'h-9 w-9',
}

export function Button({ variant = 'primary', size = 'md', block, to, className, children, ...props }) {
    const classes = cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        block && 'w-full',
        className
    )
    if (to) {
        return <Link to={to} className={classes} {...props}>{children}</Link>
    }
    return <button type="button" className={classes} {...props}>{children}</button>
}

export function Card({ className, children, ...props }) {
    return (
        <div className={cn('rounded-xl border border-slate-200 bg-white shadow-xs', className)} {...props}>
            {children}
        </div>
    )
}

export function CardHeader({ title, subtitle, action, className }) {
    return (
        <div className={cn('flex items-start justify-between gap-4 border-b border-slate-200/70 px-5 py-3.5', className)}>
            <div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
            {action}
        </div>
    )
}

export function PageHeader({ eyebrow, title, subtitle, action }) {
    return (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>}
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
            </div>
            {action}
        </div>
    )
}

const controlBase =
    'block w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition-colors focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 disabled:bg-slate-50 disabled:text-slate-500'

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlBase, 'h-10', className)} {...props} />
})

export function Select({ className, children, ...props }) {
    return (
        <select className={cn(controlBase, 'h-10 pr-8', className)} {...props}>
            {children}
        </select>
    )
}

export function Textarea({ className, ...props }) {
    return <textarea className={cn(controlBase, 'py-2.5', className)} {...props} />
}

export function Label({ htmlFor, children, className }) {
    return (
        <label htmlFor={htmlFor} className={cn('mb-1.5 block text-sm font-medium text-slate-700', className)}>
            {children}
        </label>
    )
}

export function Field({ label, id, hint, className, children }) {
    return (
        <div className={cn('space-y-0', className)}>
            {label && <Label htmlFor={id}>{label}</Label>}
            {children}
            {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
        </div>
    )
}

export function Checkbox({ label, id, className, ...props }) {
    return (
        <label htmlFor={id} className={cn('flex cursor-pointer items-center gap-2.5 text-sm text-slate-700', className)}>
            <input
                id={id}
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600 accent-brand-600 focus:ring-brand-500"
                {...props}
            />
            {label}
        </label>
    )
}

const badgeVariants = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-600/10',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    red: 'bg-rose-50 text-rose-700 ring-rose-600/10',
    sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    slate: 'bg-slate-100 text-slate-700 ring-slate-500/10',
    dark: 'bg-slate-900 text-white ring-slate-900',
}

export function Badge({ variant = 'slate', className, children }) {
    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', badgeVariants[variant], className)}>
            {children}
        </span>
    )
}

const alertVariants = {
    danger: { cls: 'bg-rose-50 text-rose-800 ring-rose-200', Icon: AlertCircle },
    success: { cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200', Icon: CheckCircle2 },
    info: { cls: 'bg-sky-50 text-sky-800 ring-sky-200', Icon: Info },
    warning: { cls: 'bg-amber-50 text-amber-800 ring-amber-200', Icon: AlertTriangle },
}

export function Alert({ variant = 'info', className, children }) {
    const { cls, Icon } = alertVariants[variant] || alertVariants.info
    return (
        <div role="alert" className={cn('flex items-start gap-3 rounded-lg px-3.5 py-2.5 text-sm ring-1 ring-inset', cls, className)}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    )
}

export function Spinner({ className }) {
    return (
        <div className={cn('flex justify-center py-10', className)}>
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-brand-600" />
        </div>
    )
}

export function Table({ children, className }) {
    return (
        <div className={cn('overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs', className)}>
            <table className="min-w-full divide-y divide-slate-100 text-sm">{children}</table>
        </div>
    )
}

export function Th({ children, className }) {
    return (
        <th className={cn('whitespace-nowrap bg-slate-50 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500', className)}>
            {children}
        </th>
    )
}

export function Td({ children, className, ...props }) {
    return <td className={cn('whitespace-nowrap px-4 py-2.5 text-slate-700', className)} {...props}>{children}</td>
}

export function Modal({ show, onClose, title, children, size = 'md' }) {
    useEffect(() => {
        if (!show) return undefined
        const onKey = (e) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [show, onClose])

    if (!show) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="anim-fade absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}
                className={cn('anim-pop relative flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-xl border border-slate-200 bg-white shadow-xl', size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-3xl' : 'max-w-lg')}>
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200/70 px-5 py-3.5">
                    <h3 className="pr-6 text-[15px] font-semibold text-slate-900">{title}</h3>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="overflow-y-auto px-5 py-4">{children}</div>
            </div>
        </div>
    )
}

export function Carousel({ slides, interval = 4000, className, renderSlide }) {
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const count = slides.length

    const go = useCallback((i) => setIndex((i + count) % count), [count])

    useEffect(() => {
        if (paused || count < 2) return undefined
        const t = setInterval(() => setIndex((i) => (i + 1) % count), interval)
        return () => clearInterval(t)
    }, [paused, count, interval])

    if (!count) return null

    return (
        <div
            className={cn('group relative overflow-hidden', className)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="flex h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
                {slides.map((slide, i) => (
                    <div key={i} className="h-full w-full shrink-0">{renderSlide(slide, i)}</div>
                ))}
            </div>

            {count > 1 && (
                <>
                    <button
                        type="button"
                        onClick={() => go(index - 1)}
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100 hover:bg-white"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => go(index + 1)}
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100 hover:bg-white"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => go(i)}
                                className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80')}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

// Indian rupees, with Indian digit grouping: ₹1,00,000.
export function formatINR(value) {
    const n = Number(value)
    if (Number.isNaN(n)) return `₹${value}`
    // Whole rupees as ₹682; paise always with two digits, ₹682.50 (never ₹682.5).
    const paise = Math.round(n * 100) % 100 !== 0
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: paise ? 2 : 0, maximumFractionDigits: 2 })}`
}

export function finalPrice(product) {
    return product.is_offer
        ? product.price - (product.price * product.offer_percentage) / 100
        : product.price
}

// A small status label with a coloured dot, e.g. "In stock", "Low stock", "Out of stock".
const statusTones = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

export function StatusPill({ tone = 'slate', children }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', statusTones[tone])}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {children}
        </span>
    )
}


// ---------------------------------------------------------------- shared states

// A grey placeholder shown while data loads, shaped like what is coming.
export function Skeleton({ className }) {
    return <div className={cn('skeleton rounded-md', className)} aria-hidden="true" />
}

// What a list or panel shows when it has nothing in it yet.
export function EmptyState({ icon: Icon, title, children, action, className, compact }) {
    return (
        <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}>
            {Icon && (
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Icon className="h-5 w-5" />
                </span>
            )}
            {title && <p className="text-sm font-semibold text-slate-900">{title}</p>}
            {children && <div className="mt-1 max-w-sm text-sm text-slate-500">{children}</div>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}

// "Are you sure?" before something that can't be undone.
export function ConfirmDialog({ show, title, children, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger, busy, onConfirm, onClose }) {
    return (
        <Modal show={show} onClose={onClose} title={title} size="sm">
            <div className="text-sm text-slate-600">{children}</div>
            <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" autoFocus onClick={onClose}>{cancelLabel}</Button>
                <Button variant={danger ? 'danger' : 'primary'} disabled={busy} onClick={onConfirm}>{busy ? 'Working…' : confirmLabel}</Button>
            </div>
        </Modal>
    )
}

// ---------------------------------------------------------------- toasts

// Short messages that appear in the corner and fade away, e.g. "Settings saved".
// Call toast.success('…') from anywhere; <Toaster /> shows them.
const toastListeners = new Set()
let toastId = 0
function pushToast(kind, message) {
    const item = { id: ++toastId, kind, message }
    toastListeners.forEach((fn) => fn(item))
}
export const toast = {
    success: (message) => pushToast('success', message),
    error: (message) => pushToast('error', message),
    info: (message) => pushToast('info', message),
}

export function Toaster({ placement = 'bottom-4 right-4' }) {
    const [items, setItems] = useState([])
    useEffect(() => {
        const add = (item) => {
            setItems((list) => [...list.slice(-3), item])
            setTimeout(() => setItems((list) => list.filter((x) => x.id !== item.id)), item.kind === 'error' ? 6000 : 3500)
        }
        toastListeners.add(add)
        return () => toastListeners.delete(add)
    }, [])
    const icons = { success: CheckCircle2, error: AlertCircle, info: Info }
    const tones = { success: 'text-emerald-600', error: 'text-rose-600', info: 'text-sky-600' }
    return (
        <div className={cn('pointer-events-none fixed z-[60] flex w-full max-w-sm flex-col gap-2', placement)} aria-live="polite">
            {items.map((t) => {
                const Icon = icons[t.kind]
                return (
                    <div key={t.id} role="status" className="anim-slide-up pointer-events-auto flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 shadow-lg">
                        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tones[t.kind])} />
                        <p className="flex-1">{t.message}</p>
                        <button type="button" onClick={() => setItems((list) => list.filter((x) => x.id !== t.id))} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
