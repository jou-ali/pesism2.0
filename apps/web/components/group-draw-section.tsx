import { SplitHeading } from './split-heading';

const GROUP_DRAW_SRC = '/media/group-draw.mp4';

/** Group draw — one centered panel: headline + large looping clip. */
export function GroupDrawSection() {
  return (
    <section className="section group-draw" id="group-draw" aria-labelledby="group-draw-title">
      <div className="container group-draw__shell">
        <figure className="group-draw__view panel" data-reveal>
          <div className="group-draw__head">
            <p className="matchday__eyebrow">Season 3 · The draw</p>
            <SplitHeading id="group-draw-title" lines={['Two groups.', 'No hiding.']} />
            <p className="lead group-draw__lead">
              The squad was drawn into two groups — same league table, same beef, different fixtures on the other side.
            </p>
          </div>

          <div className="group-draw__stage">
            <video
              className="group-draw__video"
              src={GROUP_DRAW_SRC}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            />
          </div>
        </figure>
      </div>
    </section>
  );
}