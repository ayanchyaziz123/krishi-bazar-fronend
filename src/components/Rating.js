import React from 'react'
import { Star, StarHalf } from 'lucide-react'

function Rating({ value, text }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className="relative h-4 w-4">
                        <Star className="absolute inset-0 h-4 w-4 text-slate-200" fill="currentColor" strokeWidth={0} />
                        {value >= n ? (
                            <Star className="absolute inset-0 h-4 w-4 text-amber-400" fill="currentColor" strokeWidth={0} />
                        ) : value >= n - 0.5 ? (
                            <StarHalf className="absolute inset-0 h-4 w-4 text-amber-400" fill="currentColor" strokeWidth={0} />
                        ) : null}
                    </span>
                ))}
            </div>
            {text && <span className="text-xs text-slate-500">{text}</span>}
        </div>
    )
}

export default Rating
