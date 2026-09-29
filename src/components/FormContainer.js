import React from 'react'
import { cn } from './ui'

function FormContainer({ children, wide }) {
    return (
        <div className={cn('mx-auto w-full px-4', wide ? 'max-w-3xl' : 'max-w-lg')}>
            {children}
        </div>
    )
}

export default FormContainer
