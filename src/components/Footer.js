import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Printer, Mail, Globe, AtSign, Camera, Play, Rss } from 'lucide-react'
import { Container } from './ui'
import { Logo } from './Header'

function Footer() {
    return (
        <footer className="mt-24 bg-slate-950 text-slate-400">
            <Container className="py-14">
                <div className="grid gap-10 md:grid-cols-12">
                    <div className="md:col-span-4">
                        <Logo light />
                        <p className="mt-4 max-w-xs text-sm leading-relaxed">
                            Rice, spices, pickles, tea and handcrafted goods, sourced directly from local farmers and artisans.
                        </p>
                        <div className="mt-6 flex gap-2">
                            {[Globe, AtSign, Camera, Play, Rss].map((Icon, i) => (
                                <a key={i} href="#/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-3 md:col-start-6">
                        <h4 className="mb-4 text-sm font-semibold text-white">Explore</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link to="/" className="hover:text-white">Shop all products</Link></li>
                            <li><Link to="/topReviewProductScreen" className="hover:text-white">Top reviewed</Link></li>
                            <li><Link to="/priceRange" className="hover:text-white">Shop by budget</Link></li>
                            <li><Link to="/contact" className="hover:text-white">Contact us</Link></li>
                        </ul>
                    </div>

                    <div className="md:col-span-4">
                        <h4 className="mb-4 text-sm font-semibold text-white">Our address</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />121, Zindabazar Road, Sylhet, Bangladesh</li>
                            <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />+852 1234 5678</li>
                            <li className="flex gap-3"><Printer className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />+852 8765 4321</li>
                            <li className="flex gap-3">
                                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                                <a href="mailto:aaziz9642@gmail.com" className="hover:text-white">aaziz9642@gmail.com</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-white/10 pt-6 text-sm text-slate-500">
                    Copyright &copy; {new Date().getFullYear()} Krishi Bazar. All rights reserved.
                </div>
            </Container>
        </footer>
    )
}

export default Footer
