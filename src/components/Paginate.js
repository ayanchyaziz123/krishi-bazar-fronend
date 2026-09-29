import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from './ui'

// Page links keep every other query setting (search, sort, price, stock).
function Paginate({ pages, page, keyword = '', isAdmin = false }) {
    if (!(pages > 1)) return null
    const base = isAdmin ? '/admin/productlist/' : '/'

    const linkFor = (n) => {
        const params = new URLSearchParams(keyword.startsWith('?') ? keyword.slice(1) : keyword)
        params.set('page', n)
        return `${base}?${params.toString()}`
    }

    return (
        <nav className="mt-10 flex flex-wrap justify-center gap-2">
            {[...Array(pages).keys()].map((x) => (
                <Link
                    key={x + 1}
                    to={linkFor(x + 1)}
                    className={cn(
                        'flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition',
                        x + 1 === page
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
                    )}
                >
                    {x + 1}
                </Link>
            ))}
        </nav>
    )
}

export default Paginate
