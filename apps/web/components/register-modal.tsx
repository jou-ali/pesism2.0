import { fetchRegistrationWindow, registrationModalHint } from '@/lib/registration-window';
import { Icon, UseIcon } from './icon';
import { RegisterPhotoField } from './register-photo-field';
import { Button } from './ui/button';

export async function RegisterModal() {
  const window = await fetchRegistrationWindow();
  const hint = registrationModalHint(window);
  const open = window?.open ?? false;

  return (
    <div
      className="modal"
      id="register"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      data-registration-open={open ? 'true' : 'false'}
      data-registration-hint={hint}
      data-lenis-prevent
      hidden
    >
      <div className="modal__dialog">
        <button className="modal__close" type="button" aria-label="Close registration">
          <UseIcon id="i-close" />
        </button>

        <div className="modal__view" data-view="form">
          <div className="modal__head">
            <h2 className="modal__title" id="modal-title">Join Season 3.</h2>
            <p>{hint}</p>
          </div>
          <form className="form" noValidate>
            <div className="field">
              <label htmlFor="f-name">Full name</label>
              <input id="f-name" name="name" type="text" autoComplete="name" required placeholder="Arjun Menon" />
              <span className="field__error" aria-live="polite"></span>
            </div>
            <div className="field">
              <label htmlFor="f-gamer">Gaming username</label>
              <input id="f-gamer" name="gamer" type="text" autoComplete="nickname" required placeholder="ArjunFC" />
              <p className="field__hint">No separate tag? Use the same name as your eFootball username below.</p>
              <span className="field__error" aria-live="polite"></span>
            </div>
            <div className="field">
              <label htmlFor="f-email">Email address</label>
              <input id="f-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
              <span className="field__error" aria-live="polite"></span>
            </div>
            <div className="field">
              <label htmlFor="f-phone">WhatsApp number</label>
              <input id="f-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required pattern="[0-9+ ]{10,16}" placeholder="+91 98765 43210" />
              <span className="field__error" aria-live="polite"></span>
            </div>
            <div className="field">
              <label htmlFor="f-city">City</label>
              <input id="f-city" name="city" type="text" autoComplete="address-level2" required placeholder="Kochi" />
              <span className="field__error" aria-live="polite"></span>
            </div>
            <div className="field">
              <label htmlFor="f-efb">eFootball username</label>
              <input id="f-efb" name="efootball" type="text" required placeholder="Your in game name" />
              <span className="field__error" aria-live="polite"></span>
            </div>
            <div className="field">
              <label htmlFor="f-team">Team name</label>
              <input id="f-team" name="team" type="text" required maxLength={30} placeholder="Kochi Kings" />
              <p className="field__hint">The club you&rsquo;ll play with all season.</p>
              <span className="field__error" aria-live="polite"></span>
            </div>
            <RegisterPhotoField />
            <input
              className="sr-only"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <div className="form__foot field--full">
              <p className="form__fine">One registration per person. Duplicate or bogus entries may be removed.</p>
              <Button className="btn btn--primary" type="submit" disabled={!open}>
                <span className="btn__label">{open ? 'Send verification code' : 'Registration not open yet'}</span>
              </Button>
            </div>
          </form>
        </div>

        <div className="modal__view" data-view="verify" hidden>
          <div className="modal__head">
            <h2 className="modal__title">Verify your email</h2>
            <p className="verify__intro">
              We emailed a 4-digit code to{' '}
              <strong className="verify__email" data-verify-email>
                your address
              </strong>
              . Enter it below to complete registration.
            </p>
          </div>
          <form className="form verify-form" noValidate>
            <div className="field field--full">
              <label htmlFor="f-verify-code">Verification code</label>
              <input
                id="f-verify-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{4}"
                maxLength={4}
                required
                placeholder="1234"
              />
              <span className="field__error" aria-live="polite"></span>
            </div>
            <div className="form__foot field--full">
              <Button className="btn btn--primary verify__submit" type="submit">
                <span className="btn__label">Verify &amp; finish registration</span>
              </Button>
              <button className="btn btn--ghost verify__resend" type="button">
                Resend code
              </button>
            </div>
          </form>
        </div>

        <div className="modal__view success" data-view="success" hidden>
          <span className="success__badge" aria-hidden="true">
            <Icon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" html={'<path d="m5 12.5 4.5 4.5L19 7.5"/>'} />
          </span>
          <h2 tabIndex={-1}>You&rsquo;re on the list!</h2>
          <p>Registration complete. An admin will approve your slot before you appear on the site.</p>
          <Button className="btn btn--primary success__done" type="button">Done</Button>
        </div>
      </div>
    </div>
  );
}
