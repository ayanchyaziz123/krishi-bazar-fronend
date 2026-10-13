import React from 'react'
import { AlertTriangle, RotateCcw, ArrowLeft, RefreshCw } from 'lucide-react'

// After a new version is deployed, a browser holding the old page can fail to load
// a page's code. Reloading fixes it, so that case gets its own message.
const isStaleCode = (error) => /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|error loading dynamically imported module/i
    .test(`${error && error.name} ${error && error.message}`)

// Catches a crash in the page below it and shows a way out instead of a blank screen.
// `resetKey` (the page address) clears the error when the user moves to another page.
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { error: null }
    }

    static getDerivedStateFromError(error) {
        return { error }
    }

    componentDidCatch(error, info) {
        // Kept in the console so a developer can see what went wrong.
        console.error('Page crashed:', error, info && info.componentStack)
    }

    componentDidUpdate(prev) {
        if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
    }

    render() {
        const { error } = this.state
        if (!error) return this.props.children
        const stale = isStaleCode(error)
        const button = 'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition'
        return (
            <div role="alert" className={`flex items-center justify-center px-4 ${this.props.fullPage ? 'min-h-screen bg-slate-50' : 'py-16'}`}>
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <AlertTriangle className="h-6 w-6" />
                    </span>
                    <h1 className="mt-4 text-lg font-bold text-slate-900">
                        {stale ? 'A newer version is available' : 'Something went wrong on this page'}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        {stale
                            ? 'Krishi Bazar was updated while this page was open. Reload to get the latest version.'
                            : 'Nothing you saved has been lost. Try again, or go back to the previous page.'}
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {!stale && (
                            <button type="button" onClick={() => this.setState({ error: null })} className={`${button} bg-brand-600 text-white hover:bg-brand-700`}>
                                <RotateCcw className="h-4 w-4" /> Try again
                            </button>
                        )}
                        <button type="button" onClick={() => window.location.reload()} className={`${button} ${stale ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'}`}>
                            <RefreshCw className="h-4 w-4" /> Reload
                        </button>
                        {!stale && (
                            <button type="button" onClick={() => window.history.back()} className={`${button} bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50`}>
                                <ArrowLeft className="h-4 w-4" /> Go back
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }
}

export default ErrorBoundary
