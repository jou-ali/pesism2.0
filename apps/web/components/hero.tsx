import type { CSSProperties } from 'react';
import Image from 'next/image';
import {
  fetchRegistrationWindow,
  registrationWindowSummary,
  spotsLabel as registrationSpotsLabel,
} from '@/lib/registration-window';
import { Button } from './ui/button';

function d(ms: number): CSSProperties {
  return { '--d': `${ms}ms` } as CSSProperties;
}

export async function Hero({ registrationOpen }: { registrationOpen: boolean }) {
  const window = registrationOpen ? await fetchRegistrationWindow() : null;
  const spotsLabel = registrationSpotsLabel(window);
  const windowLine = registrationWindowSummary(window);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__grid" aria-hidden="true"></div>
      <svg className="hero__swoosh" aria-hidden="true" viewBox="0 0 900 700" fill="none">
        <path d="M-40 640C140 600 260 520 320 400C380 280 340 180 420 100" stroke="var(--color-tag)" strokeWidth="2" />
        <path d="M-80 690C140 660 300 580 380 440C460 300 420 190 520 90" stroke="var(--color-tag)" strokeWidth="2" opacity=".6" />
        <path d="M-10 580C180 540 280 460 340 350C400 240 380 160 460 70" stroke="var(--color-tag)" strokeWidth="2" opacity=".35" />
      </svg>

      <div className="hero__layout">
        <div className="hero__content">
          <h1 className="hero__title" id="hero-title">
            <span className="row">
              <span className="word"><span style={d(250)}>Welcome to</span></span>
            </span>
            <span className="row">
              <span className="word"><span className="accent" style={d(550)}>TOURNAX</span></span>
            </span>
            <span className="row">
              <span className="word"><span style={d(700)}>PESISM</span></span> <span className="word"><span style={d(850)}>2.0</span></span>
            </span>
          </h1>

          <div className="hero__sub">
            <p className="hero__tagline" data-hero style={d(1000)}>The group chat ends here. The pitch decides.</p>
            <p className="hero__desc" data-hero style={d(1100)}>
              The banter&rsquo;s been loud all year. Now it gets settled. One league, one champion, and a group chat that never forgets.
            </p>
            <div className="hero__ctas" data-hero style={d(1200)}>
              {registrationOpen ? (
                <Button className="btn btn--primary" type="button" data-open-register>
                  Claim your spot
                </Button>
              ) : null}
              <a className="btn--text" href="#standings">
                See the table
              </a>
              <a className="btn--text" href="/rules">
                Rules &amp; regulations
              </a>
            </div>
          </div>

          <ul className="hero__facts" data-hero style={d(1300)}>
            {registrationOpen && spotsLabel ? <li>{spotsLabel}</li> : null}
            <li>Free entry</li>
            {registrationOpen && windowLine ? <li>{windowLine}</li> : null}
            <li>1 crown</li>
          </ul>
        </div>

        <div className="hero__visual" data-hero style={d(750)}>
          <div className="trophy-stage">
            <Image
              src="/hero/trophy.png"
              alt=""
              width={993}
              height={1583}
              priority
              className="hero__trophy-img"
              sizes="(min-width: 1020px) 320px, 70vw"
            />
            <div className="trophy-stage__ground" aria-hidden="true"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
