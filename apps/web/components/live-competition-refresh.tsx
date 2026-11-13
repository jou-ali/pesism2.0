'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const INTERVAL_MS = 10_000;

function shouldPauseRefresh() {
  if (typeof document === 'undefined') return true;
  if (document.visibilityState !== 'visible') return true;
  if (document.querySelector('.modal.is-open')) return true;
  const el = document.activeElement;
  if (
    el &&
    (el.tagName === 'INPUT' ||
      el.tagName === 'TEXTAREA' ||
      el.tagName === 'SELECT' ||
      el.tagName === 'BUTTON')
  ) {
    const inAdminForm = el.closest('form');
    if (inAdminForm) return true;
  }
  return false;
}

/** Soft refresh of server-rendered competition data (no full page reload). */
export function LiveCompetitionRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      if (shouldPauseRefresh()) return;
      router.refresh();
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [router]);

  return null;
}
