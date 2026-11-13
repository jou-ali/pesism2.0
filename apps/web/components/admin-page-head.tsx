export function AdminPageHead({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold tracking-[0.12em] text-(--color-accent-2) uppercase">{eyebrow}</p>
        <h2 className="mt-1 font-heading! text-3xl uppercase tracking-(--tracking-headline) sm:text-4xl">{title}</h2>
      </div>
      {action}
    </header>
  );
}
