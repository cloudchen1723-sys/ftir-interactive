/**
 * Procedural Audio Synthesizer for FTIR Short Film
 * Directorial Rebuild matching the 10-Act 9750-frame master timeline.
 * Character: Minimal, warm, intellectual, spacious, quietly cinematic.
 * Soft felt piano, subtle warm pad, rare pure tones, restrained low ambience.
 */

class FilmAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;

  // Sound generators
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

  private toneA: OscillatorNode | null = null;
  private toneAGain: GainNode | null = null;

  private toneB: OscillatorNode | null = null;
  private toneBGain: GainNode | null = null;

  private harmonicOscs: OscillatorNode[] = [];
  private harmonicGains: GainNode[] = [];

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // Audio context not available or blocked
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      if (this.ctx.state === 'suspended' && !muted) {
        this.ctx.resume();
      }
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Syncs audio state to the Remotion player current frame across the 10 Acts (0 - 9750)
   */
  public updateFrame(frame: number, isPlaying: boolean) {
    if (!isPlaying || this.isMuted) {
      this.silenceAll();
      return;
    }

    if (!this.ctx) {
      this.init();
      if (!this.ctx) return;
    }

    if (this.ctx.state === 'suspended') {
      return;
    }

    // Act 1: 0 - 360 (Near silence, isolated soft harmonic tone)
    if (frame < 360) {
      this.playAct1(frame);
    }
    // Act 2: 360 - 960 (Sparse piano / soft harmonic texture)
    else if (frame < 960) {
      this.playAct2(frame);
    }
    // Act 3: 960 - 1380 (Gentle sustained texture)
    else if (frame < 1380) {
      this.playAct3(frame);
    }
    // Act 4: 1380 - 4260 (Michelson core & Phasors, subtle pulse following mirror rhythm)
    else if (frame < 4260) {
      this.playAct4(frame);
    }
    // Act 5: 4260 - 4980 (Sample parallel strands + Detector, light to signal transition)
    else if (frame < 4980) {
      this.playAct5(frame);
    }
    // Act 6: 4980 - 5880 (Interferogram to ZPD burst)
    else if (frame < 5880) {
      this.playAct6(frame);
    }
    // Act 7: 5880 - 8460 (Fourier Transform, visible accumulation sonification)
    else if (frame < 8460) {
      this.playAct7(frame);
    }
    // Act 8: 8460 - 9060 (Background + Sample ratio)
    else if (frame < 9060) {
      this.playAct8(frame);
    }
    // Act 9: 9060 - 9720 (Spectrum interpretation, C=O resonance)
    else if (frame < 9720) {
      this.playAct9(frame);
    }
    // Act 10: 9720 - 10080 (Epilogue: single sustained tone, decay, final silence)
    else {
      this.playAct10(frame);
    }
  }

  // Act 1: Near silence, soft warm sub-drone and isolated resonant ping
  private playAct1(frame: number) {
    this.ensureDrone(55, 0.12);
    if (frame >= 250 && frame < 330) {
      this.ensureToneA(440, 0.18, 'sine');
    } else {
      this.fadeToneA(0.02);
    }
    this.fadeToneB(0.02);
  }

  // Act 2: Soft harmonic texture
  private playAct2(frame: number) {
    this.ensureDrone(110, 0.14);
    if (frame % 120 < 40) {
      this.ensureToneA(330, 0.12, 'sine');
    } else {
      this.fadeToneA(0.04);
    }
  }

  // Act 3: Whole system traversal
  private playAct3(_frame: number) {
    this.ensureDrone(110, 0.16);
    this.ensureToneA(220, 0.1, 'sine');
    this.fadeToneB(0.04);
  }

  // Act 4: Michelson Core — subtle pulse following mirror scan rhythm
  private playAct4(frame: number) {
    this.ensureDrone(110, 0.18);
    // Subtle rhythmic modulation
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.08);
    this.ensureToneA(220, 0.08 + pulse * 0.06, 'sine');
    if (frame >= 2010) {
      this.ensureToneB(440, 0.08, 'sine');
    } else {
      this.fadeToneB(0.05);
    }
  }

  // Act 5: Sample + Detector — light to signal
  private playAct5(frame: number) {
    this.ensureDrone(110, 0.15);
    if (frame >= 560) {
      // Cyan signal born
      this.ensureToneA(554.37, 0.14, 'sine'); // C#5
    } else {
      this.ensureToneA(440, 0.1, 'sine');
    }
  }

  // Act 6: Interferogram to ZPD Center Burst
  private playAct6(frame: number) {
    if (frame >= 760 && frame < 860) {
      // Center burst convergence: warm chord
      this.ensureDrone(55, 0.22);
      this.ensureToneA(440, 0.2, 'sine');
      this.ensureToneB(659.25, 0.16, 'sine');
    } else {
      this.ensureDrone(110, 0.14);
      this.ensureToneA(440, 0.1, 'sine');
      this.fadeToneB(0.05);
    }
  }

  // Act 7: Fourier Transform — subtle probe sonification
  private playAct7(frame: number) {
    if (frame < 180) {
      // Hold in silence
      this.fadeDrone(0.02);
      this.fadeToneA(0.02);
      this.fadeToneB(0.02);
    } else if (frame >= 510 && frame < 930) {
      // Wrong probe: slight detuned low beating
      this.ensureToneA(220, 0.08, 'sine');
      this.ensureToneB(224, 0.06, 'sine'); // beating
    } else if (frame >= 930 && frame < 1380) {
      // Matching probe: pure stable tone
      this.fadeToneB(0.05);
      this.ensureToneA(440, 0.2, 'sine');
    } else if (frame >= 1380 && frame < 2100) {
      // Accelerated sweep: ascending harmonious chords
      this.ensureDrone(110, 0.15);
      this.ensureToneA(440, 0.12, 'sine');
      this.ensureToneB(554.37, 0.1, 'sine');
    } else {
      // Dual representation: warm resting harmony
      this.ensureDrone(110, 0.18);
      this.ensureToneA(440, 0.14, 'sine');
      this.ensureToneB(659.25, 0.12, 'sine');
    }
  }

  // Act 8: Background + Sample ratio
  private playAct8(_frame: number) {
    this.ensureDrone(110, 0.15);
    this.ensureToneA(330, 0.12, 'sine');
    this.fadeToneB(0.05);
  }

  // Act 9: Spectrum Interpretation — 1715 C=O Resonance
  private playAct9(frame: number) {
    this.ensureDrone(110, 0.16);
    if (frame >= 480) {
      // C=O bond vibration
      this.ensureToneA(440, 0.18, 'sine');
      this.ensureToneB(554.37, 0.14, 'sine');
    } else {
      this.ensureToneA(440, 0.1, 'sine');
      this.fadeToneB(0.05);
    }
  }

  // Act 10: Epilogue — single sustained tone, decay, final second of silence
  private playAct10(frame: number) {
    if (frame < 260) {
      this.ensureDrone(55, 0.12);
      this.ensureToneA(220, 0.12, 'sine');
      this.fadeToneB(0.02);
    } else if (frame < 360) {
      // Natural decay
      this.fadeDrone(0.03);
      this.fadeToneA(0.03);
      this.fadeToneB(0.02);
    } else {
      // Final silence
      this.silenceAll();
    }
  }

  // Helpers
  private ensureDrone(freq: number, targetGain: number) {
    if (!this.ctx || !this.masterGain) return;
    if (!this.droneOsc) {
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      this.droneOsc.type = 'sine';
      this.droneOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.droneOsc.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);
      this.droneOsc.start();
    }
    this.droneOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    this.droneGain?.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.15);
  }

  private fadeDrone(fadeTime = 0.1) {
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setTargetAtTime(0, this.ctx.currentTime, fadeTime);
    }
  }

  private ensureToneA(freq: number, targetGain: number, type: OscillatorType = 'sine') {
    if (!this.ctx || !this.masterGain) return;
    if (!this.toneA) {
      this.toneA = this.ctx.createOscillator();
      this.toneAGain = this.ctx.createGain();
      this.toneA.type = type;
      this.toneA.frequency.setValueAtTime(freq, this.ctx.currentTime);
      this.toneAGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.toneA.connect(this.toneAGain);
      this.toneAGain.connect(this.masterGain);
      this.toneA.start();
    }
    this.toneA.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.08);
    this.toneAGain?.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
  }

  private fadeToneA(fadeTime = 0.1) {
    if (this.toneAGain && this.ctx) {
      this.toneAGain.gain.setTargetAtTime(0, this.ctx.currentTime, fadeTime);
    }
  }

  private ensureToneB(freq: number, targetGain: number, type: OscillatorType = 'sine') {
    if (!this.ctx || !this.masterGain) return;
    if (!this.toneB) {
      this.toneB = this.ctx.createOscillator();
      this.toneBGain = this.ctx.createGain();
      this.toneB.type = type;
      this.toneB.frequency.setValueAtTime(freq, this.ctx.currentTime);
      this.toneBGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.toneB.connect(this.toneBGain);
      this.toneBGain.connect(this.masterGain);
      this.toneB.start();
    }
    this.toneB.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.08);
    this.toneBGain?.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
  }

  private fadeToneB(fadeTime = 0.1) {
    if (this.toneBGain && this.ctx) {
      this.toneBGain.gain.setTargetAtTime(0, this.ctx.currentTime, fadeTime);
    }
  }

  public silenceAll() {
    this.fadeDrone(0.05);
    this.fadeToneA(0.05);
    this.fadeToneB(0.05);
  }
}

export const filmAudio = new FilmAudioEngine();
