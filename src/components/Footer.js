import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Globe, Users, Camera, Play } from 'lucide-react'
import { Container } from './ui'
import { Logo } from './Header'
import { useStoreBrand } from './storeBrand'
import { isExternal, useSiteContent } from './siteContent'

// Social pages set in the website editor. Only the ones filled in are shown.
const SOCIAL = [
    { key: 'website', label: 'Website', icon: Globe },
    { key: 'facebook', label: 'Facebook', icon: Users },
    { key: 'instagram', label: 'Instagram', icon: Camera },
    { key: 'youtube', label: 'YouTube', icon: Play },
]

function Footer() {
    const store = useStoreBrand()
    const site = useSiteContent()
    return (
        <footer className="mt-24 bg-slate-950 text-slate-400">
            <Container className="py-14">
                <div className="grid gap-10 md:grid-cols-12">
                    <div className="md:col-span-4">
                        <Logo light />
                        <p className="mt-4 max-w-xs text-sm leading-relaxed">
                            {store.tagline}
                        </p>
                        {SOCIAL.some(({ key }) => site.social && site.social[key]) && (
                            <div className="mt-6 flex gap-2">
                                {SOCIAL.filter(({ key }) => site.social[key]).map(({ key, label, icon: Icon }) => (
                                    <a key={key} href={site.social[key]} target="_blank" rel="noreferrer" aria-label={label} title={label}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                                        <Icon className="h-4 w-4" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-3 md:col-start-6">
                        <h4 className="mb-4 text-sm font-semibold text-white">Explore</h4>
                        <ul className="space-y-2.5 text-sm">
                            {(site.footer_links || []).map((l, i) => (
                                <li key={`${l.link}-${i}`}>
                                    {isExternal(l.link)
                                        ? <a href={l.link} target="_blank" rel="noreferrer" className="hover:text-white">{l.label}</a>
                                        : <Link to={l.link} className="hover:text-white">{l.label}</Link>}
                                </li>
                            ))}
                            <li><Link to="/staff" className="hover:text-white">Staff sign-in</Link></li>
                        </ul>
                    </div>

                    <div className="md:col-span-4">
                        <h4 className="mb-4 text-sm font-semibold text-white">Our address</h4>
                        <ul className="space-y-3 text-sm">
                            {store.address && <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />{store.address}</li>}
                            {store.phone && <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><a href={`tel:${store.phone.replace(/\s+/g, '')}`} className="hover:text-white">{store.phone}</a></li>}
                            {store.email && (
                                <li className="flex gap-3">
                                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                                    <a href={`mailto:${store.email}`} className="hover:text-white">{store.email}</a>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-white/10 pt-6 text-sm text-slate-500">
                    Copyright &copy; {new Date().getFullYear()} {store.name}. All rights reserved.
                </div>
            </Container>
        </footer>
    )
}

export default Footer
