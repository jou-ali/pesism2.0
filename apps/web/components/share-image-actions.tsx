'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type NavigatorWithShare = Navigator & {
  share?: (data: { files?: File[]; text?: string; title?: string }) => Promise<void>;
  canShare?: (data: { files?: File[] }) => boolean;
};

async function fetchAsFile(imageUrl: string, filename: string): Promise<File> {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: 'image/png' });
}

function downloadBlob(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function ShareImageActions({
  imageUrl,
  caption,
  filename,
  size = 'sm',
}: {
  imageUrl: string;
  caption: string;
  filename: string;
  size?: 'sm' | 'default';
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onShare() {
    setBusy('share');
    setNotice(null);
    try {
      const file = await fetchAsFile(imageUrl, filename);
      const nav = navigator as NavigatorWithShare;
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text: caption });
        return;
      }
      // Desktop fallback: download the image, then open a wa.me link with the caption so the
      // admin can attach the file they just downloaded.
      downloadBlob(file);
      window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, '_blank', 'noopener,noreferrer');
      setNotice('Downloaded — attach it in the WhatsApp tab that just opened.');
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setNotice('Could not share. Try Download instead.');
    } finally {
      setBusy(null);
    }
  }

  async function onDownload() {
    setBusy('download');
    setNotice(null);
    try {
      const file = await fetchAsFile(imageUrl, filename);
      downloadBlob(file);
    } catch {
      setNotice('Download failed.');
    } finally {
      setBusy(null);
    }
  }

  async function onCopyLink() {
    setBusy('copy');
    setNotice(null);
    try {
      const absolute = new URL(imageUrl, window.location.origin).toString();
      await navigator.clipboard.writeText(absolute);
      setNotice('Link copied.');
    } catch {
      setNotice('Could not copy the link.');
    } finally {
      setBusy(null);
      setTimeout(() => setNotice(null), 2500);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size={size} onClick={onShare} disabled={busy !== null}>
          {busy === 'share' ? 'Sharing…' : 'Share to WhatsApp'}
        </Button>
        <Button type="button" size={size} variant="outline" onClick={onDownload} disabled={busy !== null}>
          {busy === 'download' ? 'Downloading…' : 'Download'}
        </Button>
        <Button type="button" size={size} variant="ghost" onClick={onCopyLink} disabled={busy !== null}>
          {busy === 'copy' ? 'Copying…' : 'Copy link'}
        </Button>
      </div>
      {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}
    </div>
  );
}
