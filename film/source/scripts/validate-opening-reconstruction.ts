import assert from 'node:assert/strict';
import {AMBIGUITY_A,AMBIGUITY_B,openingMeasurementState} from '../src/scenes/CinematicOpeningReconstruction';
import {evaluateNarrativeMeasurement} from '../src/math/narrativeTeaching';
import {ACTS,SUBTITLE_CUES,FILM_CONFIG} from '../src/timeline/filmTimeline';
import {AMBIGUITY_SOURCE} from '../src/math/measurementAmbiguity';
// New causal contract: two valid attenuating samples, under exactly the same incident light.
for(const sample of [AMBIGUITY_A,AMBIGUITY_B]){
 for(let i=0;i<sample.length;i++){
  assert.equal(sample[i].wavenumber,AMBIGUITY_SOURCE[i].wavenumber);
  assert.ok(sample[i].amplitude>=0&&sample[i].amplitude<=AMBIGUITY_SOURCE[i].amplitude);
 }
 const removed=AMBIGUITY_SOURCE.reduce((sum,c,i)=>sum+c.amplitude-sample[i].amplitude,0);
 assert.ok(Math.abs(removed-.45)<1e-12);
}
const a=evaluateNarrativeMeasurement(0,AMBIGUITY_A),b=evaluateNarrativeMeasurement(0,AMBIGUITY_B);
assert.ok(Math.abs(a.totalRaw-b.totalRaw)<1e-12);
assert.ok(Math.abs(a.totalRaw-2.9)<1e-12);
assert.ok(Math.abs(evaluateNarrativeMeasurement(.0002,AMBIGUITY_A).totalRaw-evaluateNarrativeMeasurement(.0002,AMBIGUITY_B).totalRaw)>.1);
for(let f=0;f<FILM_CONFIG.totalFrames;f++){
 const s=openingMeasurementState(f/30);
 assert.ok(Math.abs(s.opdUm-2*s.x)<1e-12);
 assert.ok(s.measurement.totalRaw>=-1e-12);
 assert.ok(Math.abs(s.field.phaseRad-2*Math.PI*1000*s.opdUm*1e-4)<1e-12);
}
for(let i=0;i<ACTS.length;i++)assert.equal(ACTS[i].startFrame,i?ACTS[i-1].endFrame:0);
assert.equal(ACTS.at(-1)!.endFrame,FILM_CONFIG.totalFrames);
for(let i=0;i<SUBTITLE_CUES.length;i++)assert.ok(SUBTITLE_CUES[i].startFrame>= (i?SUBTITLE_CUES[i-1].endFrame:0));
// Recorded A/B prefixes use the exact same 0..10 μm OPD interval and a single sequential detector.
for(let i=0;i<=90;i++){
 const p=i/90;
 const sa=openingMeasurementState(153+4*p),sb=openingMeasurementState(162+4*p);
 if(i<90){assert.ok(Math.abs(sa.measurement.totalRaw-evaluateNarrativeMeasurement(p*.001,AMBIGUITY_A).totalRaw)<1e-10);assert.ok(Math.abs(sb.measurement.totalRaw-evaluateNarrativeMeasurement(p*.001,AMBIGUITY_B).totalRaw)<1e-10);}
}
console.log('Opening reconstruction: equal fixed readings, divergent scans, shared mirror/phase, nonnegative power, sequential A/B and timeline checks passed.');
