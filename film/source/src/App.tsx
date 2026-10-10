/**
 * FTIR Short Film Theater & Remotion Player Deck
 * Host environment for the master Remotion composition.
 * Preserves strict cinematic purity inside the 16:9 film frame while providing
 * high-precision frame scrubbing, act chapter jumping, and audio synthesis controls outside.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { FTIRFilm } from './remotion/FTIRFilm';
import { FILM_CONFIG, ACTS, ActDefinition } from './timeline/filmTimeline';
import { filmAudio } from './audio/soundEngine';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  BookOpen,
  Info,
  Terminal,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PALETTE, TYPOGRAPHY } from './styles/visualSystem';

export default function App() {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showScientificNotes, setShowScientificNotes] = useState<boolean>(false);
  const [showRenderCommand, setShowRenderCommand] = useState<boolean>(false);
  const theaterContainerRef = useRef<HTMLDivElement>(null);

  // Sync frame updates from Remotion player
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrameUpdate = () => {
      const frame = player.getCurrentFrame();
      setCurrentFrame(frame);
      const playing = player.isPlaying();
      setIsPlaying(playing);
      filmAudio.updateFrame(frame, playing);
    };

    const onPlay = () => {
      setIsPlaying(true);
      filmAudio.updateFrame(player.getCurrentFrame(), true);
    };

    const onPause = () => {
      setIsPlaying(false);
      filmAudio.silenceAll();
    };

    player.addEventListener('frameupdate', onFrameUpdate);
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);

    return () => {
      player.removeEventListener('frameupdate', onFrameUpdate);
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      filmAudio.silenceAll();
    };
  }, []);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (playerRef.current.isPlaying()) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  }, []);

  const seekToFrame = useCallback((frame: number) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(frame);
    setCurrentFrame(frame);
    filmAudio.updateFrame(frame, playerRef.current.isPlaying());
  }, []);

  const toggleAudio = useCallback(() => {
    const newMuted = !isAudioMuted;
    setIsAudioMuted(newMuted);
    filmAudio.setMuted(newMuted);
    if (!newMuted && playerRef.current) {
      filmAudio.updateFrame(playerRef.current.getCurrentFrame(), playerRef.current.isPlaying());
    }
  }, [isAudioMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!theaterContainerRef.current) return;
    if (!document.fullscreenElement) {
      theaterContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Format frame to SMPTE timecode (HH:MM:SS:FF)
  const formatTimecode = (frame: number) => {
    const fps = FILM_CONFIG.fps;
    const totalSeconds = Math.floor(frame / fps);
    const ff = frame % fps;
    const ss = totalSeconds % 60;
    const mm = Math.floor(totalSeconds / 60) % 60;
    const hh = Math.floor(totalSeconds / 3600);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
  };

  // Find current Act
  const currentAct = ACTS.find((a) => currentFrame >= a.startFrame && currentFrame < a.endFrame) || ACTS[0];

  return (
    <div className="min-h-screen bg-[#030508] text-neutral-200 flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-neutral-800/80 bg-black/60 px-6 flex items-center justify-between z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00F5FF]" />
          <h1 className="font-serif tracking-widest text-neutral-100 text-sm font-semibold uppercase">
            FTIR <span className="text-neutral-500 font-normal">| Listening to the Vibrations of Matter</span>
          </h1>
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-mono">
            Remotion 30 FPS · 1080p
          </span>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowScientificNotes(!showScientificNotes)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all border ${
              showScientificNotes
                ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                : 'bg-neutral-900 border-neutral-700/60 hover:border-neutral-500 text-neutral-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Scientific Principles</span>
          </button>

          <button
            onClick={() => setShowRenderCommand(!showRenderCommand)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all border ${
              showRenderCommand
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                : 'bg-neutral-900 border-neutral-700/60 hover:border-neutral-500 text-neutral-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Remotion Export</span>
          </button>
        </div>
      </header>

      {/* Main Cinema Theater Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 overflow-hidden relative">
        {/* TEMPORARY DEVELOPER DIAGNOSTIC BAR */}
        <div className="w-full max-w-[1360px] mb-3 bg-neutral-900/95 border border-cyan-500/50 rounded-lg p-3 font-mono text-xs flex flex-wrap items-center justify-between gap-3 shadow-lg z-20">
          {/* Diagnostic stats */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F5FF]" />
              <span className="text-neutral-400">FRAME:</span>
              <span className="text-cyan-300 font-bold text-sm">{currentFrame}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400">TIME:</span>
              <span className="text-white font-bold">{(currentFrame / FILM_CONFIG.fps).toFixed(2)}s</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400">ACTIVE SCENE:</span>
              <span className="text-amber-300 font-semibold">{currentAct.titleEn} (Act {currentAct.actNumber})</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400">STATUS:</span>
              <span className={`px-2 py-0.5 rounded font-bold ${isPlaying ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-neutral-800 text-neutral-300 border border-neutral-700'}`}>
                {isPlaying ? 'PLAYING' : 'PAUSED'}
              </span>
            </div>
          </div>

          {/* Dynamic 10-Act Seek Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={togglePlay}
              className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5 transition-all text-xs"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            {ACTS.map((act) => (
              <button
                key={act.id}
                onClick={() => seekToFrame(act.startFrame)}
                className={`px-2 py-1 rounded text-xs transition-all border ${
                  currentAct.id === act.id
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-bold'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                }`}
                title={act.titleZh}
              >
                Act {act.actNumber} ({(act.startFrame / FILM_CONFIG.fps).toFixed(0)}s)
              </button>
            ))}
          </div>
        </div>

        <div
          ref={theaterContainerRef}
          className="relative w-full max-w-[1360px] aspect-video bg-black rounded-lg overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.95)] border border-neutral-800/80 flex items-center justify-center group"
        >
          {/* Master Remotion Player */}
          <Player
            ref={playerRef}
            component={FTIRFilm}
            durationInFrames={FILM_CONFIG.totalFrames}
            compositionWidth={FILM_CONFIG.width}
            compositionHeight={FILM_CONFIG.height}
            fps={FILM_CONFIG.fps}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
            controls={false}
            loop
            autoPlay={false}
            acknowledgeRemotionLicense
          />
        </div>

        {/* Cinematic Film Timeline & Control Deck (Outside the Film Frame) */}
        <div className="w-full max-w-[1360px] mt-4 flex flex-col gap-3 bg-[#080C14]/90 border border-neutral-800/90 rounded-lg p-4 backdrop-blur-md">
          {/* Act Jump Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ACTS.map((act) => {
              const isActive = currentFrame >= act.startFrame && currentFrame < act.endFrame;
              return (
                <button
                  key={act.id}
                  onClick={() => seekToFrame(act.startFrame)}
                  className={`flex-1 min-w-[140px] px-3 py-2 rounded text-left transition-all border ${
                    isActive
                      ? 'bg-cyan-950/40 border-cyan-500/70 text-cyan-200 shadow-[0_0_15px_rgba(0,245,255,0.15)]'
                      : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-600 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1">
                    <span className="font-semibold text-neutral-300">ACT {act.actNumber}</span>
                    <span>{Math.floor(act.startFrame / FILM_CONFIG.fps)}s</span>
                  </div>
                  <div className="text-sm font-sans truncate font-medium text-neutral-100">
                    {act.titleZh}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Timeline Scrubber */}
          <div className="relative flex items-center group/scrub">
            <input
              type="range"
              min={0}
              max={FILM_CONFIG.totalFrames - 1}
              value={currentFrame}
              onChange={(e) => seekToFrame(Number(e.target.value))}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all focus:outline-none"
            />
          </div>

          {/* Transport Controls Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center font-bold shadow-[0_0_20px_rgba(0,245,255,0.35)] transition-all"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => seekToFrame(0)}
                className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-neutral-300 flex items-center justify-center transition-all"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Timecode & Frame Counter */}
              <div className="flex items-center gap-3 ml-2 font-mono text-xs">
                <span className="text-cyan-400 font-semibold">{formatTimecode(currentFrame)}</span>
                <span className="text-neutral-600">/</span>
                <span className="text-neutral-400">{formatTimecode(FILM_CONFIG.totalFrames)}</span>
                <span className="text-neutral-600">|</span>
                <span className="text-neutral-400">FRAME {currentFrame}</span>
              </div>
            </div>

            {/* Current Act Description */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-neutral-300 font-semibold">{currentAct.titleEn}:</span>
              <span className="text-neutral-400 truncate max-w-[340px]">{currentAct.descriptionEn}</span>
            </div>

            {/* Audio & Fullscreen Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAudio}
                disabled
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all border ${
                  !isAudioMuted
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                    : 'bg-neutral-900 border-neutral-700/60 hover:border-neutral-500 text-neutral-400'
                }`}
                title={isAudioMuted ? 'Unmute Procedural Audio' : 'Mute Audio'}
              >
                {!isAudioMuted ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
                <span>无音乐 · Narrative review</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-neutral-300 flex items-center justify-center transition-all"
                title="Fullscreen Theater"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Slide-out Drawer: Scientific Principles */}
      {showScientificNotes && (
        <aside className="fixed inset-y-0 right-0 w-full sm:w-[520px] bg-[#070A10]/95 border-l border-neutral-800 p-6 z-50 overflow-y-auto backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h2 className="font-serif text-lg text-neutral-100 font-semibold">FTIR Scientific Model</h2>
            </div>
            <button
              onClick={() => setShowScientificNotes(false)}
              className="text-neutral-400 hover:text-white text-xs font-mono px-2 py-1 bg-neutral-900 rounded"
            >
              ✕ CLOSE
            </button>
          </div>

          <div className="space-y-6 text-sm text-neutral-300 leading-relaxed font-sans">
            <div>
              <h3 className="text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1.5">
                1. Dipole Selection Rule (偶极矩跃迁定则)
              </h3>
              <p className="text-xs text-neutral-400">
                A molecular vibration is IR-active if and only if the electric dipole moment varies with the normal coordinate:
              </p>
              <div className="my-2 p-2.5 rounded bg-black/60 border border-neutral-800 font-mono text-xs text-cyan-300">
                (∂μ / ∂Q)_(Q=0) ≠ 0
              </div>
              <p className="text-xs text-neutral-400">
                In CO₂, the symmetric stretch (ν₁ = 1388 cm⁻¹) preserves inversion symmetry and has no dynamic dipole (IR inactive). The asymmetric stretch (ν₃ = 2349 cm⁻¹) and bending (ν₂ = 667 cm⁻¹) break symmetry and produce powerful IR absorption.
              </p>
            </div>

            <div>
              <h3 className="text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1.5">
                2. Michelson Interferometer & Path Difference (迈克尔逊干涉)
              </h3>
              <p className="text-xs text-neutral-400">
                The optical path difference (OPD) is twice the mirror displacement:
              </p>
              <div className="my-2 p-2.5 rounded bg-black/60 border border-neutral-800 font-mono text-xs text-cyan-300">
                δ = 2(d₂ - d₁)
              </div>
              <p className="text-xs text-neutral-400">
                At δ = 0 (Zero Path Difference, ZPD), all monochromatic cosine components are simultaneously in-phase, generating the characteristic central burst.
              </p>
            </div>

            <div>
              <h3 className="text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1.5">
                3. Continuous Fourier Transformation (傅里叶变换反演)
              </h3>
              <p className="text-xs text-neutral-400">
                The detected intensity I(δ) is the cosine transform of the source spectrum modified by sample transmittance:
              </p>
              <div className="my-2 p-2.5 rounded bg-black/60 border border-neutral-800 font-mono text-xs text-cyan-300">
                B(ν) = ∫_-∞^+∞ [I(δ) - 0.5 I(0)] · cos(2π ν δ) · dδ
              </div>
              <p className="text-xs text-neutral-400">
                Inversion transforms distance space (OPD in cm) into spatial frequency space (wavenumber ν in cm⁻¹).
              </p>
            </div>

            <div>
              <h3 className="text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1.5">
                4. Spectroscopic Advantages (FTIR三大优势)
              </h3>
              <ul className="text-xs space-y-2 text-neutral-400 list-disc list-inside">
                <li>
                  <strong className="text-neutral-200">Fellgett (Multiplex) Advantage:</strong> All spectral elements are detected simultaneously across the entire scan, yielding high signal-to-noise ratio.
                </li>
                <li>
                  <strong className="text-neutral-200">Jacquinot (Throughput) Advantage:</strong> No narrow slits required; circular apertures provide higher optical throughput.
                </li>
                <li>
                  <strong className="text-neutral-200">Connes Advantage:</strong> Co-axial He-Ne reference laser provides internal wavenumber calibration with extreme precision.
                </li>
              </ul>
            </div>
          </div>
        </aside>
      )}

      {/* Slide-out Drawer: Remotion Render Command */}
      {showRenderCommand && (
        <aside className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-[#070A10]/95 border-l border-neutral-800 p-6 z-50 overflow-y-auto backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h2 className="font-serif text-lg text-neutral-100 font-semibold">Remotion Rendering Guide</h2>
            </div>
            <button
              onClick={() => setShowRenderCommand(false)}
              className="text-neutral-400 hover:text-white text-xs font-mono px-2 py-1 bg-neutral-900 rounded"
            >
              ✕ CLOSE
            </button>
          </div>

          <div className="space-y-4 text-xs text-neutral-300 font-mono leading-relaxed">
            <p className="text-neutral-400 font-sans">
              This film is completely code-driven through Remotion. You can scrub every frame in the player or export a broadcast-grade 1080p MP4 locally using Remotion CLI.
            </p>

            <div className="bg-black/80 border border-neutral-800 p-3 rounded">
              <div className="text-neutral-500 mb-1"># Render full 1080p 30fps MP4:</div>
              <div className="text-amber-300 select-all">npx remotion render src/remotion/index.ts FTIRFilm out/FTIR_Film.mp4</div>
            </div>

            <div className="bg-black/80 border border-neutral-800 p-3 rounded">
              <div className="text-neutral-500 mb-1"># Open interactive Remotion Studio:</div>
              <div className="text-amber-300 select-all">npx remotion studio src/remotion/index.ts</div>
            </div>

            <div className="bg-black/80 border border-neutral-800 p-3 rounded">
              <div className="text-neutral-500 mb-1"># Render a single still frame (e.g. Fourier climax at frame 4800):</div>
              <div className="text-amber-300 select-all">npx remotion still src/remotion/index.ts FTIRFilm --frame=4800 out/fourier_moment.png</div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
