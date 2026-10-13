import React, { useState } from 'react';
import axios from 'axios';
import { MapPin, Phone, Printer, Mail, Video, CheckCircle2 } from 'lucide-react';
import { Alert, Container, PageHeader, Card, Field, Input, Select, Textarea, Checkbox, Button } from '../components/ui';

const EMPTY = { first_name: '', last_name: '', area_code: '+880', phone: '', email: '', need_contact: true, contact_media: 'email', message: '', website: '' };

function Contact() {
    const [form, setForm] = useState(EMPTY);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const submit = (e) => {
        e.preventDefault();
        setError('');
        if (!form.email.trim() && !form.phone.trim()) {
            setError('Please give an email address or a phone number so we can reply.');
            return;
        }
        setSending(true);
        axios.post('/api/contact/create/', form)
            .then(() => setSent(true))
            .catch((err) => setError((err.response && err.response.data && err.response.data.detail) || 'The message could not be sent. Please try again.'))
            .finally(() => setSending(false));
    };

    return (
        <Container>
            <PageHeader eyebrow="Contact" title="Get in touch" subtitle="Questions about a product, a bulk order or delivery? We're happy to help." />
            <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
                <div className="space-y-6">
                    <div className="rounded-3xl bg-slate-900 p-7 text-slate-300">
                        <h2 className="font-semibold text-white">Our address</h2>
                        <ul className="mt-5 space-y-4 text-sm">
                            <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />121, Zindabazar, Sylhet, Bangladesh</li>
                            <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />+852 1234 5678</li>
                            <li className="flex gap-3"><Printer className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />+852 8765 4321</li>
                            <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" /><a href="mailto:aaziz9642@gmail.com" className="hover:text-white">aaziz9642@gmail.com</a></li>
                        </ul>
                        <div className="mt-7 grid grid-cols-3 gap-2">
                            <a href="tel:+85212345678" className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 py-3 text-xs font-semibold text-white transition hover:bg-white/10"><Phone className="h-4 w-4" /> Call</a>
                            <a href="#/contact" className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 py-3 text-xs font-semibold text-white transition hover:bg-white/10"><Video className="h-4 w-4" /> Skype</a>
                            <a href="mailto:aaziz9642@gmail.com" className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 py-3 text-xs font-semibold text-white transition hover:bg-white/10"><Mail className="h-4 w-4" /> Email</a>
                        </div>
                    </div>
                </div>

                <Card className="p-6 sm:p-8">
                    <h2 className="font-semibold text-slate-900">Send us a message</h2>
                    {sent ? (
                        <div className="mt-6 rounded-2xl bg-emerald-50 p-6 text-center">
                            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                            <p className="mt-3 font-semibold text-emerald-900">Thank you, {form.first_name}. Your message was sent.</p>
                            <p className="mt-1 text-sm text-emerald-800">We usually reply within a day{form.need_contact ? ` by ${form.contact_media === 'tel' ? 'phone' : 'email'}` : ''}.</p>
                            <Button variant="secondary" className="mt-5" onClick={() => { setSent(false); setForm(EMPTY) }}>Send another message</Button>
                        </div>
                    ) : (
                    <form className="mt-6 space-y-4" onSubmit={submit}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="First name" id="f_name"><Input id="f_name" required value={form.first_name} onChange={set('first_name')} placeholder="First name" /></Field>
                            <Field label="Last name" id="l_name"><Input id="l_name" value={form.last_name} onChange={set('last_name')} placeholder="Last name" /></Field>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                            <Field label="Area code" id="a_code"><Input id="a_code" value={form.area_code} onChange={set('area_code')} placeholder="+880" /></Field>
                            <Field label="Telephone" id="tel_p"><Input id="tel_p" type="tel" value={form.phone} onChange={set('phone')} placeholder="Phone number" /></Field>
                        </div>
                        <Field label="Email" id="c_email" hint="We'll never share your email with anyone else. Give an email or a phone number so we can reply.">
                            <Input id="c_email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                        </Field>
                        {/* Hidden from people; simple spam bots fill it in and are ignored. */}
                        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')}
                            className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden="true" />
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                            <Checkbox id="approve" checked={form.need_contact} onChange={set('need_contact')} label={<strong className="font-medium">May we contact you?</strong>} />
                            <Select className="h-9 w-32" aria-label="Contact method" value={form.contact_media} onChange={set('contact_media')}>
                                <option value="email">By email</option>
                                <option value="tel">By phone</option>
                            </Select>
                        </div>
                        <Field label="Message" id="c_message" hint={`${form.message.length}/800`}>
                            <Textarea id="c_message" rows={5} required maxLength={800} value={form.message} onChange={set('message')} placeholder="How can we help?" />
                        </Field>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Button type="submit" size="lg" disabled={sending}>{sending ? 'Sending…' : 'Send message'}</Button>
                    </form>
                    )}
                </Card>
            </div>
        </Container>
    )
}

export default Contact;
