import { norm180, norm360 } from '@compass/core';

/**
 * A magnified slice of the compass card, centred between the true bearing and the bearing
 * read off the gyro repeater — the view an officer gets through a bearing repeater's window.
 *
 * The window zooms to the size of the error, so a fifth of a degree is still a visible gap.
 * The shaded band between the two index marks is the gyro error, and the side the gyro mark
 * falls on is its name: gyro west of true reads East, gyro east of true reads West.
 */

// The viewBox is sized close to the column the scale is drawn in, so that scaling to fit
// leaves the engraved figures at roughly the size they are authored at rather than shrinking
// them to nothing.
const W = 340;
const H = 74;
const BASELINE = 40;

interface Props {
  trueBearing: number;
  gyroBearing: number;
}

/** Tick spacing that keeps the scale readable at any magnification. */
function graduation(span: number): { minor: number; major: number; decimals: number } {
  if (span <= 6) return { minor: 0.25, major: 1, decimals: 0 };
  if (span <= 16) return { minor: 1, major: 5, decimals: 0 };
  if (span <= 48) return { minor: 1, major: 10, decimals: 0 };
  return { minor: 5, major: 30, decimals: 0 };
}

const CARDINALS: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };

export function BearingScale({ trueBearing, gyroBearing }: Props) {
  const separation = Math.abs(norm180(trueBearing - gyroBearing));

  // Wide enough that the two marks sit clear of the edges, never narrower than 4°. The
  // upper bound is the whole card: a half-typed bearing can be a long way from the truth,
  // and the marks still have to land on the scale.
  const span = Math.min(360, Math.max(4, separation * 3.2));
  const centre = norm360(trueBearing - norm180(trueBearing - gyroBearing) / 2);

  const x = (bearing: number) => (norm180(bearing - centre) / span + 0.5) * W;
  const xTrue = x(trueBearing);
  const xGyro = x(gyroBearing);

  const { minor, major, decimals } = graduation(span);
  const first = Math.ceil((centre - span / 2) / minor) * minor;
  const ticks: Array<{ at: number; isMajor: boolean }> = [];
  for (let at = first; at <= centre + span / 2 + 1e-9; at += minor) {
    // Floating-point accumulation would drift the major test; round to the tick grid first.
    const value = Math.round(at / minor) * minor;
    ticks.push({ at: value, isMajor: Math.abs(value % major) < 1e-6 });
  }

  const label = (bearing: number) => {
    const shown = norm360(bearing);
    const rounded = Math.round(shown * 10) / 10;
    return CARDINALS[rounded] ?? rounded.toFixed(decimals);
  };

  return (
    <svg
      className="scale"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Compass card from ${norm360(centre - span / 2).toFixed(1)} to ${norm360(
        centre + span / 2,
      ).toFixed(1)} degrees, true bearing ${trueBearing.toFixed(1)}, gyro bearing ${gyroBearing.toFixed(1)}`}
    >
      <rect
        className="scale-band"
        x={Math.min(xTrue, xGyro)}
        y={20}
        width={Math.max(Math.abs(xTrue - xGyro), 1.5)}
        height={BASELINE - 20}
      />

      {ticks.map(({ at, isMajor }) => (
        <line
          key={at}
          className={isMajor ? 'scale-tick scale-tick--major' : 'scale-tick'}
          x1={x(at)}
          x2={x(at)}
          y1={BASELINE}
          y2={BASELINE + (isMajor ? 11 : 5)}
        />
      ))}

      <line className="scale-baseline" x1={0} x2={W} y1={BASELINE} y2={BASELINE} />

      {ticks
        .filter((tick) => tick.isMajor)
        .map(({ at }) => (
          <text key={at} className="scale-figure" x={x(at)} y={H - 3} textAnchor="middle">
            {label(at)}
          </text>
        ))}

      <g className="scale-index scale-index--gyro">
        <path d={`M${xGyro - 5} 6 L${xGyro + 5} 6 L${xGyro} 15 Z`} />
        <line x1={xGyro} x2={xGyro} y1={15} y2={BASELINE} />
      </g>

      <g className="scale-index scale-index--true">
        <path d={`M${xTrue - 5} 6 L${xTrue + 5} 6 L${xTrue} 15 Z`} />
        <line x1={xTrue} x2={xTrue} y1={15} y2={BASELINE} />
      </g>
    </svg>
  );
}
