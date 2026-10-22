import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { FileQuestion } from 'lucide-react'
import ReactHtmlParser from 'react-html-parser'
import Loader from '../components/Loader'
import { Button, Container } from '../components/ui'
import { isManagerRole, roleOf } from '../admin_components/roles'

// A page the store wrote in the website editor, e.g. /page/about-us.
function SitePageScreen({ match }) {
    const { slug } = match.params
    const { userInfo } = useSelector((state) => state.userLogin)
    const [page, setPage] = useState(null)
    const [missing, setMissing] = useState(false)

    useEffect(() => {
        setPage(null)
        setMissing(false)
        // Managers may preview a page before it is published.
        const config = isManagerRole(roleOf(userInfo)) ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {}
        axios.get(`/api/site/pages/by-slug/${slug}/`, config)
            .then(({ data }) => { setPage(data); window.scrollTo(0, 0) })
            .catch(() => setMissing(true))
    }, [slug, userInfo])

    if (missing) {
        return (
            <Container className="py-16 text-center">
                <FileQuestion className="mx-auto h-12 w-12 text-slate-300" />
                <h1 className="mt-4 text-xl font-bold text-slate-900">This page isn't available</h1>
                <p className="mt-2 text-slate-500">It may have been moved or isn't published yet.</p>
                <Button to="/" className="mt-6">Back to the shop</Button>
            </Container>
        )
    }
    if (!page) return <Loader />
    return (
        <Container>
            <article className="mx-auto max-w-3xl">
                {!page.published && (
                    <p className="mb-6 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">Draft: only managers can see this page until it is published.</p>
                )}
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{page.title}</h1>
                <div className="prose-content mt-8 text-slate-700">{ReactHtmlParser(page.body)}</div>
            </article>
        </Container>
    )
}

export default SitePageScreen
