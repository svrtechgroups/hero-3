'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { gsap } from '@/lib/gsap';
import { journey } from '@/lib/journey';
import { budgets, projectTypes, site } from '@/lib/content';
import { CubeAnchor } from '@/components/ui/CubeAnchor';
import { DepthLayers } from '@/components/ui/DepthLayers';
import { CheckIcon } from '@/components/ui/Icons';

type Fields = { name: string; email: string; phone: string; company: string; projectType: string; budget: string; message: string; website: string };
type Errors = Partial<Record<keyof Fields, string>>;

const empty: Fields = { name: '', email: '', phone: '', company: '', projectType: '', budget: '', message: '', website: '' };

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Enter an email address like name@company.com.';
  if (f.phone.trim() && !/^\+?[\d\s()-]{7,18}$/.test(f.phone.trim())) e.phone = 'Use digits, spaces or + only, e.g. +91 98765 43210.';
  if (!f.projectType) e.projectType = 'Choose a project type.';
  if (f.message.trim().length < 20) e.message = 'Tell us a little more: at least 20 characters.';
  return e;
}

/** Animates the 3D cube's "assembled" state and wakes on-demand canvases. */
function setAssembled(v: number) {
  gsap.to(journey, {
    assembled: v,
    duration: journey.reduced ? 0 : 1.8,
    ease: 'power3.inOut',
    onUpdate: () => journey.invalidators.forEach((fn) => fn()),
  });
}

export function Contact() {
  const [f, setF] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const successRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...f, [e.target.name]: e.target.value };
    setF(next);
    if (touched[e.target.name as keyof Fields]) setErrors(validate(next));
  };
  const onBlur = (e: { target: { name: string } }) => {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
    setErrors(validate(f));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    setTouched({ name: true, email: true, phone: true, projectType: true, message: true });
    const firstBad = Object.keys(errs)[0];
    if (firstBad) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstBad}"]`)?.focus();
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('sent');
      setAssembled(1);
      requestAnimationFrame(() => {
        successRef.current?.focus();
        if (!journey.reduced && successRef.current) {
          gsap.fromTo(successRef.current, { rotateY: -70, z: -300, autoAlpha: 0, transformPerspective: 1200 }, { rotateY: 0, z: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out' });
          gsap.fromTo(successRef.current.querySelector('[data-check] path'), { strokeDasharray: 30, strokeDashoffset: 30 }, { strokeDashoffset: 0, duration: 0.8, delay: 0.4, ease: 'power2.out' });
        }
      });
    } catch {
      setStatus('error');
    }
  };

  const reset = () => {
    setF(empty);
    setErrors({});
    setTouched({});
    setStatus('idle');
    setAssembled(0);
  };

  const err = (k: keyof Fields) => (touched[k] ? errors[k] : undefined);
  const fieldProps = (k: keyof Fields) => ({
    id: `f-${k}`,
    name: k,
    value: f[k],
    onChange,
    onBlur,
    'aria-invalid': err(k) ? true : undefined,
    'aria-describedby': err(k) ? `e-${k}` : undefined,
  });
  const Label = ({ k, children, optional }: { k: keyof Fields; children: string; optional?: boolean }) => (
    <label htmlFor={`f-${k}`} className="mb-1.5 block text-sm font-semibold text-navy">
      {children}
      {optional && <span className="font-normal text-muted"> (optional)</span>}
    </label>
  );
  const Err = ({ k }: { k: keyof Fields }) =>
    err(k) ? (
      <p id={`e-${k}`} className="mt-1.5 text-sm text-red-600">
        {err(k)}
      </p>
    ) : null;

  return (
    <section id="contact" className="relative overflow-hidden py-28 md:py-36" aria-labelledby="contact-title">
      <DepthLayers variant="blueprint" />
      <div data-depth-section="enter" className="container relative z-10 grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <h2 id="contact-title" data-reveal className="text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.05]">
            Your idea is next.
          </h2>
          <p data-reveal className="mt-5 max-w-[46ch] text-lg text-muted">
            Tell us what you want to build. We reply within one business day with questions, a rough timeline, and next steps.
          </p>

          <div className="my-12 flex justify-center lg:justify-start">
            <CubeAnchor stage={9} className="w-36 md:w-44" label={status === 'sent' ? 'Assembled. Talk soon.' : 'Waiting for your brief'} />
          </div>

          <ul className="space-y-3" data-reveal>
            <li>
              <a href={`mailto:${site.email}`} className="group flex items-center gap-4 rounded-2xl border border-line bg-white/80 p-4 shadow-depth backdrop-blur transition hover:border-accent">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-tint text-primary" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M4 7l8 6 8-6" /></svg>
                </span>
                <span><span className="block text-sm text-muted">Email</span><span className="font-semibold text-navy group-hover:text-primary">{site.email}</span></span>
              </a>
            </li>
            <li>
              <a href={site.phoneHref} className="group flex items-center gap-4 rounded-2xl border border-line bg-white/80 p-4 shadow-depth backdrop-blur transition hover:border-accent">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-tint text-primary" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>
                </span>
                <span><span className="block text-sm text-muted">Phone</span><span className="font-semibold text-navy group-hover:text-primary">{site.phone}</span></span>
              </a>
            </li>
            <li className="flex items-center gap-4 rounded-2xl border border-line bg-white/80 p-4 shadow-depth backdrop-blur">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-tint text-primary" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
              </span>
              <span><span className="block text-sm text-muted">Location</span><span className="font-semibold text-navy">{site.location}</span></span>
            </li>
          </ul>
        </div>

        <div data-reveal className="relative [perspective:1400px]">
          {status !== 'sent' ? (
            <form ref={formRef} onSubmit={onSubmit} noValidate className="rounded-[32px] border border-white bg-white/85 p-6 shadow-depth-lg backdrop-blur-md sm:p-9">
              <h3 className="text-2xl font-bold">Start a project</h3>
              <p className="mt-1 text-sm text-muted">Fields marked optional can be left blank.</p>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div>
                  <Label k="name">Name</Label>
                  <input {...fieldProps('name')} className="field" autoComplete="name" required />
                  <Err k="name" />
                </div>
                <div>
                  <Label k="email">Email</Label>
                  <input {...fieldProps('email')} type="email" className="field" autoComplete="email" inputMode="email" required />
                  <Err k="email" />
                </div>
                <div>
                  <Label k="phone" optional>Phone</Label>
                  <input {...fieldProps('phone')} type="tel" className="field" autoComplete="tel" inputMode="tel" />
                  <Err k="phone" />
                </div>
                <div>
                  <Label k="company" optional>Company</Label>
                  <input {...fieldProps('company')} className="field" autoComplete="organization" />
                </div>
                <div>
                  <Label k="projectType">Project type</Label>
                  <select {...fieldProps('projectType')} className="field appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%231D4ED8%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_14px_center] bg-no-repeat pr-10" required>
                    <option value="">Choose one</option>
                    {projectTypes.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  <Err k="projectType" />
                </div>
                <div>
                  <Label k="budget" optional>Budget range</Label>
                  <select {...fieldProps('budget')} className="field appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%231D4ED8%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_14px_center] bg-no-repeat pr-10">
                    <option value="">Choose a range</option>
                    {budgets.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label k="message">What do you want to build?</Label>
                  <textarea {...fieldProps('message')} rows={5} className="field resize-y" placeholder="The problem, who it's for, and any deadline." required />
                  <Err k="message" />
                </div>
                {/* spam trap: hidden from people, filled by bots */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="f-website">Website</label>
                  <input {...fieldProps('website')} tabIndex={-1} autoComplete="off" />
                </div>
              </div>

              {status === 'error' && (
                <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  Your message didn&apos;t send. Check your connection and try again, or email {site.email}.
                </p>
              )}

              <button type="submit" className="btn btn-primary mt-7 w-full sm:w-auto" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send project brief'}
              </button>
            </form>
          ) : (
            <div
              ref={successRef}
              tabIndex={-1}
              role="status"
              className="flex min-h-[520px] flex-col items-center justify-center rounded-[32px] border border-white bg-white/90 p-10 text-center shadow-depth-lg backdrop-blur-md"
            >
              <span data-check className="grid h-20 w-20 place-items-center rounded-3xl bg-brand-gradient text-white shadow-depth-lg">
                <CheckIcon className="h-10 w-10" />
              </span>
              <h3 className="mt-7 text-3xl font-bold">Project brief sent</h3>
              <p className="mt-3 max-w-[40ch] text-muted">
                Thanks, {f.name.split(' ')[0]}. We&apos;ll reply to {f.email} within one business day.
              </p>
              <button type="button" onClick={reset} className="btn btn-ghost mt-8">
                Send another brief
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
