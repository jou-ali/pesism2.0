import { NextResponse } from 'next/server';
import { completeTeamSetup } from '@/lib/tournax-api';

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let body: { teamName?: string };
  try {
    body = (await request.json()) as { teamName?: string };
  } catch {
    return NextResponse.json({ code: 'bad_request', message: 'Invalid JSON' }, { status: 400 });
  }

  const teamName = body.teamName?.trim();
  if (!teamName) {
    return NextResponse.json({ code: 'bad_request', message: 'Enter a team name.' }, { status: 400 });
  }

  try {
    await completeTeamSetup(token, teamName);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not save your team name.';
    return NextResponse.json({ code: 'team_setup_failed', message }, { status: 400 });
  }
}
