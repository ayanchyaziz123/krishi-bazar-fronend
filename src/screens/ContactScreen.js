import React from 'react';
import { MapPin, Phone, Printer, Mail, Video } from 'lucide-react';
import { Container, PageHeader, Card, Field, Input, Select, Textarea, Checkbox, Button } from '../components/ui';

function Contact() {
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
                    <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="First name" id="f_name"><Input id="f_name" name="f_name" placeholder="First name" /></Field>
                            <Field label="Last name" id="l_name"><Input id="l_name" name="l_name" placeholder="Last name" /></Field>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                            <Field label="Area code" id="a_code"><Input id="a_code" name="a_code" placeholder="+880" /></Field>
                            <Field label="Telephone" id="tel_p"><Input id="tel_p" name="tel_p" placeholder="Phone number" /></Field>
                        </div>
                        <Field label="Email" id="c_email" hint="We'll never share your email with anyone else.">
                            <Input id="c_email" type="email" name="email" placeholder="you@example.com" />
                        </Field>
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                            <Checkbox id="approve" name="need_contact" label={<strong className="font-medium">May we contact you?</strong>} />
                            <Select className="h-9 w-32" aria-label="Contact method">
                                <option value="tel">By phone</option>
                                <option value="email">By email</option>
                            </Select>
                        </div>
                        <Field label="Message" id="c_message">
                            <Textarea id="c_message" rows={5} placeholder="How can we help?" />
                        </Field>
                        <Button type="submit" size="lg">Send message</Button>
                    </form>
                </Card>
            </div>
        </Container>
    )
}

export default Contact;
