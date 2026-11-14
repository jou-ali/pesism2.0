import { AdminPageHead } from '@/components/admin-page-head';
import { ShareImageActions } from '@/components/share-image-actions';
import { listPosters } from '@/lib/share/registry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminSharePage() {
  const posters = await listPosters();

  return (
    <>
      <AdminPageHead eyebrow="WhatsApp posters" title="Share images" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posters.map((poster) => (
          <Card key={poster.id} className="overflow-hidden">
            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-(--color-paper-3)">
              {poster.available ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poster.path} alt="" className="h-full w-full object-cover" style={{ transform: 'scale(0.98)' }} />
              ) : (
                <span className="px-6 text-center text-sm text-muted-foreground">Not available yet</span>
              )}
            </div>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">{poster.title}</CardTitle>
              <Badge variant={poster.available ? 'default' : 'secondary'}>{poster.available ? 'Ready' : 'Not yet'}</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              {poster.available ? (
                <ShareImageActions imageUrl={poster.path} caption={poster.caption} filename={`${poster.id}.png`} />
              ) : (
                <p className="text-sm text-muted-foreground">Comes available once the data behind it is ready.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
