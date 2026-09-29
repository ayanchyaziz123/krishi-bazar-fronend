import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { Search } from 'lucide-react'
import { cn } from './ui'

function SearchBox({ className }) {
    const [keyword, setKeyword] = useState('')

    let history = useHistory()

    const submitHandler = (e) => {
        e.preventDefault()
        if (keyword) {
            history.push(`/?keyword=${keyword}&page=1`)
        } else {
            history.push(history.location.pathname)
        }
    }
    return (
        <form onSubmit={submitHandler} className={cn('relative w-full', className)}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
                type='text'
                name='q'
                onChange={(e) => setKeyword(e.target.value)}
                className='h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-24 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10'
                placeholder="Search rice, spices, pickles and more"
            />
            <button
                type='submit'
                className='absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800'
            >
                Search
            </button>
        </form>
    )
}

export default SearchBox
