import { useState } from 'react';
import { Mail, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { api } from '@/services/api';

export function ContactPage() {
  const [submitted,setSubmitted]=useState(false); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
  const [form,setForm]=useState({name:'',email:'',phone:'',subject:'',message:''});
  const update=(key:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>setForm(v=>({...v,[key]:e.target.value}));
  async function submit(e:React.FormEvent){ e.preventDefault(); setError(''); setLoading(true); try { await api.post('/contact',form); setSubmitted(true); setForm({name:'',email:'',phone:'',subject:'',message:''}); } catch(err:any){ setError(err?.response?.data?.message||'We could not deliver your message. Please try again.'); } finally { setLoading(false); } }
  return <div className="mx-auto max-w-6xl px-6 py-16">
    <div className="max-w-2xl"><h1 className="text-3xl font-semibold text-primary-900">Contact Us</h1><p className="mt-2 text-slate-600">Have a question, prayer request, or want to get involved? Reach out — we'd love to hear from you.</p></div>
    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2"><Card variant="clay" className="flex flex-col gap-5">
        <div className="flex items-start gap-3"><Mail size={18} className="mt-0.5 shrink-0 text-primary-700"/><div><div className="text-sm font-medium text-primary-900">Official Union Email</div><a href="mailto:tumchristianunion@gmail.com" className="text-sm font-bold text-primary-700 hover:underline">tumchristianunion@gmail.com</a><div className="text-[11px] text-slate-500 mt-0.5">Official TUMCU correspondence</div></div></div>
        <div className="flex items-start gap-3"><Phone size={18} className="mt-0.5 shrink-0 text-primary-700"/><div><div className="text-sm font-medium text-primary-900">Secretary — Phone / WhatsApp</div><a href="tel:+254799762001" className="text-sm font-bold text-primary-700">0799762001</a></div></div>
        <div className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-primary-700"/><div><div className="text-sm font-medium text-primary-900">Location</div><div className="text-sm text-slate-600">Technical University of Mombasa, Tom Mboya Street, Mombasa, Kenya</div></div></div>
      </Card></div>
      <div className="lg:col-span-3"><Card variant="flat">{submitted ? <div className="py-10 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={40}/><p className="mt-3 text-lg font-medium text-primary-900">Message received</p><p className="mt-2 text-sm text-slate-600">Your message has been delivered to the TUMCU leadership correspondence system. The Secretary, Chairperson and Super Administrator have been notified.</p></div> : <form className="flex flex-col gap-4" onSubmit={submit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input label="Your name" value={form.name} onChange={update('name')} required/><Input label="Email" type="email" value={form.email} onChange={update('email')} required/></div>
        <Input label="Phone / WhatsApp (optional)" value={form.phone} onChange={update('phone')}/><Input label="Subject" value={form.subject} onChange={update('subject')} required/>
        <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700">Message</label><textarea required rows={6} value={form.message} onChange={update('message')} className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-300"/></div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}<Button type="submit" loading={loading} className="mt-2 self-start px-6">Send Message</Button>
      </form>}</Card></div>
    </div>
  </div>;
}
