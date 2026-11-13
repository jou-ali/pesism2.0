import Image from 'next/image';
import { crestSvg } from '@/lib/crest';

export function TeamCrest({
  teamName,
  crestUrl,
  primaryColor,
  secondaryColor,
  size = 40,
  className,
}: {
  teamName: string | null;
  crestUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  size?: number;
  className?: string;
}) {
  const label = teamName ?? 'Team pending';

  if (crestUrl) {
    return (
      <Image
        src={crestUrl}
        alt={`${label} crest`}
        width={size}
        height={size}
        className={className}
        unoptimized
      />
    );
  }

  return (
    <span
      className={className}
      style={{ width: size, height: size, display: 'inline-block' }}
      aria-hidden={teamName ? undefined : true}
      dangerouslySetInnerHTML={{ __html: crestSvg(label, primaryColor ?? null, secondaryColor ?? null) }}
    />
  );
}
