import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../ui'

// Photos that slide on their own every few seconds and can be swiped on a phone.
// The dots sit under the photos, with the current one drawn as a longer bar.
function SlideShow({ items, render, interval = 4500, className, dotsClassName }) {
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const touch = useRef(null)
    const count = items.length

    const go = useCallback((i) => setIndex((i + count) % count), [count])
    useEffect(() => { if (index >= count) setIndex(0) }, [count, index])
    useEffect(() => {
        if (paused || count < 2) return undefined
        const t = setInterval(() => setIndex((i) => (i + 1) % count), interval)
        return () => clearInterval(t)
    }, [paused, count, interval])

    if (!count) return null

    const onTouchStart = (e) => { touch.current = e.touches[0].clientX; setPaused(true) }
    const onTouchEnd = (e) => {
        if (touch.current !== null) {
            const dx = e.changedTouches[0].clientX - touch.current
            if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
        }
        touch.current = null
        setPaused(false)
    }

    return (
        <div className={className}>
            <div className="relative overflow-hidden rounded-3xl" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
                onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
                    {items.map((item, i) => (
                        <div key={i} className="w-full shrink-0" aria-hidden={i !== index}>{render(item, i)}</div>
                    ))}
                </div>
            </div>
            {count > 1 && (
                <div className={cn('mt-3 flex justify-center gap-1.5', dotsClassName)}>
                    {items.map((_, i) => (
                        <button key={i} type="button" onClick={() => go(i)} aria-label={`Show photo ${i + 1}`} aria-current={i === index}
                            className={cn('h-2 rounded-full transition-all', i === index ? 'w-6 bg-brand-600' : 'w-2 bg-slate-300 hover:bg-slate-400')} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default SlideShow
