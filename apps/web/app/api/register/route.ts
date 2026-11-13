import { NextResponse } from 'next/server';
import { registrationClientHeaders } from '@/lib/registration-client-headers';
import { uploadPlayerAvatar } from '@/lib/supabase-server';

const API_BASE = process.env.TOURNAX_API_URL ?? 'http://localhost:8080';
const SEASON = 3;

function readFields(form: FormData) {
  return {
    name: String(form.get('name') ?? '').trim(),
    gamingUsername: String(form.get('gamer') ?? '').trim(),
    email: String(form.get('email') ?? '').trim(),
    phone: String(form.get('phone') ?? '').trim(),
    city: String(form.get('city') ?? '').trim(),
    efootballUsername: String(form.get('efootball') ?? '').trim(),
    teamName: String(form.get('team') ?? '').trim(),
    website: String(form.get('website') ?? ''),
  };
}

async function forwardRegistration(payload: Record<string, string>, clientHeaders: Record<string, string>) {
  const res = await fetch(`${API_BASE}/api/v1/seasons/${SEASON}/registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...clientHeaders },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  const clientHeaders = registrationClientHeaders(request);

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const fields = readFields(form);
      const photo = form.get('photo');
      let avatarUrl: string | undefined;
      if (photo instanceof File && photo.size > 0) {
        avatarUrl = await uploadPlayerAvatar(photo);
      }
      const payload: Record<string, string> = {
        ...fields,
        ...(avatarUrl ? { avatarUrl } : {}),
      };
      const { res, data } = await forwardRegistration(payload, clientHeaders);
      if (!res.ok) {
        return NextResponse.json(data, { status: res.status });
      }
      return NextResponse.json(data, { status: 201 });
    }

    let body: Record<string, string>;
    try {
      body = (await request.json()) as Record<string, string>;
    } catch {
      return NextResponse.json({ code: 'bad_request', message: 'Invalid JSON' }, { status: 400 });
    }

    const payload = {
      name: body.name?.trim(),
      gamingUsername: body.gamer?.trim(),
      email: body.email?.trim(),
      phone: body.phone?.trim(),
      city: body.city?.trim(),
      efootballUsername: body.efootball?.trim(),
      teamName: body.team?.trim(),
      avatarUrl: body.avatarUrl?.trim(),
      website: body.website ?? '',
    };

    const { res, data } = await forwardRegistration(payload, clientHeaders);
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Registration failed.';
    return NextResponse.json({ code: 'upload_error', message }, { status: 400 });
  }
}
