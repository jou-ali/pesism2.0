import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function AdminApiStatus({ error }: { error: string }) {
  const staleApi =
    error.includes('403') || error.includes('404') || error.toLowerCase().includes('match not found');

  return (
    <Card className="border-amber-400/40">
      <CardHeader>
        <CardTitle>{staleApi ? 'API needs a restart' : 'Backend or database not ready'}</CardTitle>
        <CardDescription>
          {staleApi
            ? 'The Spring app is running old code (or rejected this route). Stop bootRun with Ctrl+C, then run gradlew bootRun again from apps/backend.'
            : 'The admin UI needs the Spring API connected to your Supabase Postgres.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-4">
        {!staleApi ? (
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-foreground/80">
            <li>
              In Supabase → <strong>Project Settings → Database</strong>, copy your <strong>database password</strong>{' '}
              (not the <code>sb_secret_</code> API key).
            </li>
            <li>
              Set <code>SUPABASE_DB_PASSWORD</code> in <code>apps/backend/.env</code>, then run{' '}
              <code>gradlew bootRun</code> (Flyway applies migrations, including match results). After pulling code
              changes, <strong>stop and restart</strong> <code>bootRun</code> — Gradle does not hot-reload Java.
            </li>
            <li>
              Keep <code>TOURNAX_API_URL=http://localhost:8080</code> in <code>apps/web/.env.local</code>.
            </li>
          </ol>
        ) : null}
        <p className="font-mono text-xs text-muted-foreground">{error}</p>
        <p>
          <Link href="/" className="text-sm font-semibold text-(--color-accent)! hover:underline">
            ← Back to public site
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
