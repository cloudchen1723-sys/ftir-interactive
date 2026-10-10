export const MICHELSON_LOW_WAVENUMBER = 1000;
export const MICHELSON_HIGH_WAVENUMBER = 3000;
export const MICHELSON_SCENE_DURATION = 2880;

export interface MichelsonTeachingEvaluation {
  readonly mirrorDisplacementUm: number;
  readonly opdUm: number;
  readonly opdCm: number;
  readonly wavenumber: number;
  readonly phaseRad: number;
  readonly movingField: Readonly<{ x: number; y: number }>;
  readonly totalField: Readonly<{ x: number; y: number }>;
  readonly normalizedPower: number;
}

export interface MichelsonTeachingState {
  readonly frame: number;
  readonly mirrorDisplacementUm: number;
  readonly low: MichelsonTeachingEvaluation;
  readonly high: MichelsonTeachingEvaluation;
}

const MIRROR_KNOTS: readonly (readonly [number, number])[] = [
  [0, 0], [480, 0], [620, 5], [900, 5], [980, 0], [1480, 5],
  [1720, 5], [1940, 7.5], [2020, 7.5], [2240, 10], [2400, 10],
  [2850, 30], [2880, 30],
];

export function evaluateMichelsonTeaching(
  mirrorDisplacementUm: number,
  wavenumber: number,
): MichelsonTeachingEvaluation {
  if (!Number.isFinite(mirrorDisplacementUm)) {
    throw new TypeError('mirrorDisplacementUm must be finite');
  }
  if (!Number.isFinite(wavenumber) || wavenumber < 0) {
    throw new TypeError('wavenumber must be finite and nonnegative');
  }
  const opdUm = 2 * mirrorDisplacementUm;
  const opdCm = opdUm * 1e-4;
  const phaseRad = 2 * Math.PI * wavenumber * opdCm;
  const movingField = Object.freeze({ x: Math.cos(phaseRad), y: Math.sin(phaseRad) });
  const totalField = Object.freeze({ x: 1 + movingField.x, y: movingField.y });
  const normSquared = totalField.x ** 2 + totalField.y ** 2;
  const normalizedPower = Math.max(0, Math.min(1, normSquared / 4));
  return Object.freeze({
    mirrorDisplacementUm,
    opdUm,
    opdCm,
    wavenumber,
    phaseRad,
    movingField,
    totalField,
    normalizedPower,
  });
}

export function getMichelsonTeachingState(localFrame: number): MichelsonTeachingState {
  if (!Number.isFinite(localFrame)) throw new TypeError('localFrame must be finite');
  const frame = Math.max(0, Math.min(MICHELSON_SCENE_DURATION, localFrame));
  let mirrorDisplacementUm = MIRROR_KNOTS[MIRROR_KNOTS.length - 1][1];
  for (let i = 0; i < MIRROR_KNOTS.length - 1; i += 1) {
    const [frame0, x0] = MIRROR_KNOTS[i];
    const [frame1, x1] = MIRROR_KNOTS[i + 1];
    if (frame <= frame1) {
      const progress = (frame - frame0) / (frame1 - frame0);
      mirrorDisplacementUm = x0 + (x1 - x0) * progress;
      break;
    }
  }
  return Object.freeze({
    frame,
    mirrorDisplacementUm,
    low: evaluateMichelsonTeaching(mirrorDisplacementUm, MICHELSON_LOW_WAVENUMBER),
    high: evaluateMichelsonTeaching(mirrorDisplacementUm, MICHELSON_HIGH_WAVENUMBER),
  });
}
