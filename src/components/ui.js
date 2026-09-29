import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

// Small Tailwind UI kit that replaces the React-Bootstrap components.

export function cn(...classes) {
    return classes.filter(Boolean).join(' ')
}

export function Container({ className, children }) {
    return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
}

const buttonVariants = {
    primary: 'bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700',
    dark: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-900',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    'danger-soft': 'bg-rose-50 text-rose-600 hover:bg-rose-100',
    accent: 'bg-amber-400 text-slate-900 hover:bg-amber-300',
}

const buttonSizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2',
    icon: 'h-9 w-9',
}

export function Button({ variant = 'primary', size = 'md', block, to, className, children, ...props }) {
    const classes = cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
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
        <div className={cn('rounded-2xl border border-slate-200/80 bg-white shadow-sm', className)} {...props}>
            {children}
        </div>
    )
}

export function CardHeader({ title, subtitle, action, className }) {
    return (
        <div className={cn('flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4', className)}>
            <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
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
    'block w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-slate-50'

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlBase, 'h-11', className)} {...props} />
})

export function Select({ className, children, ...props }) {
    return (
        <select className={cn(controlBase, 'h-11 pr-8', className)} {...props}>
            {children}
        </select>
    )
}

export function Textarea({ className, ...props }) {
    return <textarea className={cn(controlBase, 'py-3', className)} {...props} />
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
        <div className={cn('flex items-start gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset', cls, className)}>
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
        <div className={cn('overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>
            <table className="min-w-full divide-y divide-slate-100 text-sm">{children}</table>
        </div>
    )
}

export function Th({ children, className }) {
    return (
        <th className={cn('whitespace-nowrap bg-slate-50/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500', className)}>
            {children}
        </th>
    )
}

export function Td({ children, className, ...props }) {
    return <td className={cn('whitespace-nowrap px-4 py-3 text-slate-700', className)} {...props}>{children}</td>
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
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className={cn('relative w-full rounded-2xl bg-white shadow-2xl', size === 'sm' ? 'max-w-sm' : 'max-w-lg')}>
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h3 className="pr-6 font-semibold text-slate-900">{title}</h3>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
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

export function formatTk(value) {
    const n = Number(value)
    if (Number.isNaN(n)) return `৳${value}`
    return `৳${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

export function finalPrice(product) {
    return product.is_offer
        ? product.price - (product.price * product.offer_percentage) / 100
        : product.price
}
