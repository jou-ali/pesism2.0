import type { Metadata } from 'next';
import { loginAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import '../admin.css';

export const metadata: Metadata = {
  title: 'Admin login · TOURNAX',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? '/admin';
  const showError = params.error === '1';

  return (
    <div className="admin-shell admin-shell--center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>TOURNAX admin</CardTitle>
          <CardDescription>Staff only · not linked from the public site.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="flex flex-col gap-4">
            {showError ? <p className="admin-login-error">Wrong password.</p> : null}
            <input type="hidden" name="next" value={next} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input id="admin-password" type="password" name="password" required autoComplete="current-password" />
            </div>
            <Button type="submit">Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
