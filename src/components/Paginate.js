import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from './ui'

function Paginate({ pages, page, keyword = '', isAdmin = false }) {
    if (keyword) {
        keyword = keyword.split('?keyword=')[1].split('&')[0]
    }

    return (pages > 1 && (
        <nav className="mt-10 flex flex-wrap justify-center gap-2">
            {[...Array(pages).keys()].map((x) => (
                <Link
                    key={x + 1}
                    to={!isAdmin ?
                        `/?keyword=${keyword}&page=${x + 1}`
                        : `/admin/productlist/?keyword=${keyword}&page=${x + 1}`
                    }
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
    )
}

export default Paginate
