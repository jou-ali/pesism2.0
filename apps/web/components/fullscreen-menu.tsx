import type { CSSProperties } from 'react';
import { UseIcon } from './icon';
import { Button } from './ui/button';

const LINKS = [
  { href: '/#top', label: 'Home' },
  { href: '/#matchday', label: 'Matchday' },
  { href: '/#format', label: 'Format' },
  { href: '/#standings', label: 'Table' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/rules', label: 'Rules' },
  { href: '/#players', label: 'Players' },
  { href: '/#contact', label: 'Contact' },
];

export function FullscreenMenu() {
  return (
    <div className="menu" id="menu" role="dialog" aria-modal="true" aria-label="Site menu" hidden>
      <div className="menu__panel">
        <div className="menu__top">
          <a className="brand" href="/" data-menu-link>
            <UseIcon id="emblem" />
            <span className="brand__word">
              TOURNAX
              <small>PESISM 2.0</small>
            </span>
          </a>
          <button className="menu__close" type="button" aria-label="Close menu">
            <UseIcon id="i-close" />
          </button>
        </div>
        <div className="menu__body">
          <nav aria-label="Menu">
            <ul className="menu__links">
              {LINKS.map((link, i) => (
                <li key={link.href}>
                  <a href={link.href} data-menu-link style={{ '--i': i } as CSSProperties}>
                    <small>{String(i + 1).padStart(2, '0')}</small>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="menu__aside">
            <p>Talk is cheap. Goals aren&rsquo;t. Every win counts, every goal matters.</p>
            <Button className="btn btn--primary" type="button" data-open-register style={{ alignSelf: 'flex-start' }}>
              Register now
            </Button>
            <div className="socials">
              <a className="social" href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Instagram">
                <UseIcon id="i-insta" />
              </a>
              <a className="social" href="https://www.youtube.com/" target="_blank" rel="noopener" aria-label="YouTube">
                <UseIcon id="i-yt" />
              </a>
              <a className="social" href="https://discord.com/" target="_blank" rel="noopener" aria-label="Discord">
                <UseIcon id="i-discord" />
              </a>
              <a className="social" href="https://x.com/" target="_blank" rel="noopener" aria-label="X">
                <UseIcon id="i-x" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
