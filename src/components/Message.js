import React from 'react'
import { Alert } from './ui'

function Message({ variant, children, className }) {
    return (
        <Alert variant={variant} className={className}>
            {children}
        </Alert>
    )
}

export default Message
