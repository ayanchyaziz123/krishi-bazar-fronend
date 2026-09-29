import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { cn } from './ui'

// A list of filter options. Picking one searches with its keyword.
function FilterGroup({ title, options }) {
    const history = useHistory()
    const location = useLocation()
    const params = new URLSearchParams(location.search)
    const active = params.get('keyword') || ''

    const pick = (keyword) => {
        history.push(keyword === active ? '/' : `/?keyword=${keyword}&page=1`)
    }

    return (
        <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h4>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                {options.map((o) => {
                    const isActive = o.keyword === active
                    return (
                        <button
                            key={o.keyword}
                            type="button"
                            onClick={() => pick(o.keyword)}
                            className={cn(
                                'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm transition lg:px-2',
                                isActive ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            )}
                        >
                            <span className={cn(
                                'hidden h-4 w-4 items-center justify-center rounded border lg:flex',
                                isActive ? 'border-brand-600 bg-brand-600' : 'border-slate-300 bg-white'
                            )}>
                                {isActive && <span className="h-1.5 w-1.5 rounded-sm bg-white" />}
                            </span>
                            {o.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default FilterGroup
