import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { MessageCircle, X, Send, Sprout, RotateCcw } from 'lucide-react'
import { cn, formatTk } from './ui'

const STORAGE_KEY = 'krishi-chat'
const WELCOME = {
    role: 'assistant',
    content: "Hi! I'm the Krishi Bazar assistant. Ask me what to cook, what to gift, or what fits your budget, and I'll suggest products from the shop.",
    welcome: true,
}
const SUGGESTIONS = [
    'What goes well with rice for a family dinner?',
    'Gift ideas under ৳1,500',
    'How do I use hathkora?',
]

function loadHistory() {
    try {
        const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
        if (Array.isArray(saved) && saved.length) return saved
    } catch (e) { /* storage unavailable */ }
    return [WELCOME]
}

function ProductChip({ product }) {
    return (
        <Link
            to={`/product/${product._id}`}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 pr-3 transition hover:border-brand-300 hover:shadow-sm"
        >
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {product.image && <img src={product.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-slate-900">{product.name}</span>
                <span className="block text-xs text-slate-500">
                    {formatTk(product.price)}{product.weight ? ` · ${product.weight}` : ''}
                    {!product.inStock && <span className="text-rose-600"> · out of stock</span>}
                </span>
            </span>
        </Link>
    )
}

function ChatAssistant() {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState(loadHistory)
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)
    const listRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages)) } catch (e) { /* ignore */ }
    }, [messages])

    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    }, [messages, sending, open, error])

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus()
    }, [open])

    const send = async (text) => {
        const content = (text || '').trim()
        if (!content || sending) return
        const next = [...messages, { role: 'user', content }]
        setMessages(next)
        setInput('')
        setError(null)
        setSending(true)
        try {
            const payload = next
                .filter((m) => !m.welcome && !m.error)
                .map(({ role, content: c }) => ({ role, content: c }))
            const { data } = await axios.post('/api/chat/', { messages: payload })
            setMessages([...next, { role: 'assistant', content: data.reply, products: data.products || [] }])
        } catch (err) {
            const detail = err.response && err.response.data && err.response.data.detail
            setError(detail || 'Something went wrong. Please try again.')
        } finally {
            setSending(false)
        }
    }

    const reset = () => {
        setMessages([WELCOME])
        setError(null)
    }

    const onlyWelcome = messages.length === 1

    return (
        <>
            {open && (
                <div className="fixed inset-x-3 bottom-24 z-50 flex max-h-[min(38rem,calc(100vh-8rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 sm:inset-x-auto sm:right-6 sm:w-[24rem]">
                    <div className="flex items-center gap-3 bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-4 text-white">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                            <Sprout className="h-5 w-5" />
                        </span>
                        <div className="flex-1">
                            <p className="text-sm font-semibold">Shopping assistant</p>
                            <p className="text-xs text-brand-100">Ask about products, recipes and gifts</p>
                        </div>
                        {!onlyWelcome && (
                            <button type="button" onClick={reset} className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Start a new chat" title="Start a new chat">
                                <RotateCcw className="h-4 w-4" />
                            </button>
                        )}
                        <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close chat">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-5">
                        {messages.map((m, i) => (
                            <div key={i} className={cn('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}>
                                <div className={cn(
                                    'max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                                    m.role === 'user'
                                        ? 'rounded-br-md bg-brand-600 text-white'
                                        : 'rounded-bl-md bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/70'
                                )}>
                                    {m.content}
                                </div>
                                {m.products && m.products.length > 0 && (
                                    <div className="grid w-[85%] gap-2">
                                        {m.products.map((p) => <ProductChip key={p._id} product={p} />)}
                                    </div>
                                )}
                            </div>
                        ))}

                        {onlyWelcome && (
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => send(s)}
                                        className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {sending && (
                            <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/70" aria-label="Assistant is typing">
                                {[0, 150, 300].map((d) => (
                                    <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
                                ))}
                            </div>
                        )}

                        {error && (
                            <div className="rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700 ring-1 ring-rose-200">{error}</div>
                        )}
                    </div>

                    <form
                        onSubmit={(e) => { e.preventDefault(); send(input) }}
                        className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
                    >
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            maxLength={1000}
                            placeholder="Ask about products, recipes, gifts…"
                            className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || sending}
                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
                            aria-label="Send"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            )}

            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="fixed bottom-6 right-6 z-50 flex h-14 items-center gap-2 rounded-full bg-brand-600 pl-4 pr-5 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 transition hover:-translate-y-0.5 hover:bg-brand-700"
                aria-label={open ? 'Close shopping assistant' : 'Open shopping assistant'}
            >
                {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                <span className="hidden sm:inline">{open ? 'Close' : 'Ask our assistant'}</span>
            </button>
        </>
    )
}

export default ChatAssistant
