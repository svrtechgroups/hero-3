import { NextResponse } from 'next/server';

const TYPES = ['Website', 'Mobile App', 'AI Agent', 'Automation', 'Other'];

/**
 * Contact form endpoint. Validates on the server too, then hands off.
 * TODO: deliver the lead — e.g. Resend / Nodemailer to svrtechgroups@gmail.com,
 * or push to your CRM. Add rate limiting before going live.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const s = (k: string) => (typeof body[k] === 'string' ? (body[k] as string).trim().slice(0, 4000) : '');

  // honeypot filled → pretend success, drop silently
  if (s('website')) return NextResponse.json({ ok: true });

  const lead = {
    name: s('name'), email: s('email'), phone: s('phone'), company: s('company'),
    projectType: s('projectType'), budget: s('budget'), message: s('message'),
  };
  const bad =
    lead.name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email) ||
    !TYPES.includes(lead.projectType) ||
    lead.message.length < 20;
  if (bad) return NextResponse.json({ ok: false, error: 'Validation failed' }, { status: 422 });

  console.log('[contact] new lead', { ...lead, message: `${lead.message.slice(0, 80)}…` });
  return NextResponse.json({ ok: true });
}
