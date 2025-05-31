import { Howl } from 'howler';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SoundConfig {
	volume: number;
	enabled: boolean;
}

interface SoundManagerReturn {
	playOrbBounce: (intensity?: number) => void;
	playTerritoryCapture: (color: 'white' | 'black') => void;
	playPerkActivation: (perkType: string) => void;
	playGameStart: () => void;
	playGameEnd: (winner: 'white' | 'black') => void;
	playOrbCollision: () => void;
	playSpeedBoost: () => void;
	playFreeze: () => void;
	playChaosMode: () => void;
	playExtraOrb: () => void;
	playUnbreakable: () => void;
	config: SoundConfig;
	updateConfig: (newConfig: Partial<SoundConfig>) => void;
	resumeAudioContext: () => Promise<void>;
}

export function useSoundManager(): SoundManagerReturn {
	//
	const [config, setConfig] = useState<SoundConfig>({
		volume: 0.7,
		enabled: true,
	});

	// store sound instances and audio context
	const soundsRef = useRef<Record<string, Howl>>({});
	const audioContextRef = useRef<AudioContext | null>(null);

	/**
	 * gets or creates the audio context and ensures it's running
	 */
	const getAudioContext = useCallback(() => {
		//
		if (!audioContextRef.current) {
			audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
		}

		// resume context if it's suspended (browser autoplay policy)
		if (audioContextRef.current.state === 'suspended') {
			audioContextRef.current.resume().catch((error) => {
				console.warn('Failed to resume audio context:', error);
			});
		}

		return audioContextRef.current;
	}, []);

	/**
	 * creates a sound using Web Audio API synthesis
	 */
	const createSyntheticSound = useCallback(
		(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
			//
			if (!config.enabled) return;

			try {
				const audioContext = getAudioContext();

				// check if context is running
				if (audioContext.state !== 'running') {
					console.warn('Audio context not running, state:', audioContext.state);
					return;
				}

				const oscillator = audioContext.createOscillator();
				const gainNode = audioContext.createGain();

				oscillator.connect(gainNode);
				gainNode.connect(audioContext.destination);

				oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
				oscillator.type = type;

				gainNode.gain.setValueAtTime(0, audioContext.currentTime);
				gainNode.gain.linearRampToValueAtTime(volume * config.volume, audioContext.currentTime + 0.01);
				gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

				oscillator.start(audioContext.currentTime);
				oscillator.stop(audioContext.currentTime + duration);
			} catch (error) {
				console.warn('Failed to create synthetic sound:', error);
			}
		},
		[config.enabled, config.volume, getAudioContext],
	);

	/**
	 * creates a more complex sound with multiple frequencies
	 */
	const createComplexSound = useCallback(
		(frequencies: number[], duration: number, type: OscillatorType = 'sine', volume: number = 0.2) => {
			//
			if (!config.enabled) return;

			frequencies.forEach((freq, index) => {
				//
				setTimeout(
					() => {
						//
						createSyntheticSound(freq, duration / frequencies.length, type, volume);
					},
					((index * duration) / frequencies.length) * 1000,
				);
			});
		},
		[config.enabled, createSyntheticSound],
	);

	/**
	 * plays orb bounce sound with variable intensity
	 */
	const playOrbBounce = useCallback(
		(intensity: number = 1) => {
			//
			// const frequency = 200 + intensity * 100;
			// createSyntheticSound(frequency, 0.1, 'triangle', 0.2);
		},
		[createSyntheticSound],
	);

	/**
	 * plays territory capture sound
	 */
	const playTerritoryCapture = useCallback(
		(color: 'white' | 'black') => {
			//
			const baseFreq = color === 'white' ? 440 : 330;
			const frequencies = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
			createComplexSound(frequencies, 0.3, 'sine', 0.3);
		},
		[createComplexSound],
	);

	/**
	 * plays perk activation sound
	 */
	const playPerkActivation = useCallback(
		(perkType: string) => {
			//
			switch (perkType) {
				case 'speed-boost':
					playSpeedBoost();
					break;
				case 'freeze':
					playFreeze();
					break;
				case 'chaos':
					playChaosMode();
					break;
				case 'extra-orb':
					playExtraOrb();
					break;
				case 'unbreakable':
					playUnbreakable();
					break;
				default:
					createSyntheticSound(500, 0.2, 'square', 0.4);
			}
		},
		[createSyntheticSound],
	);

	/**
	 * plays game start sound
	 */
	const playGameStart = useCallback(() => {
		//
		const frequencies = [262, 330, 392, 523]; // C, E, G, C octave
		createComplexSound(frequencies, 0.8, 'sine', 0.4);
	}, [createComplexSound]);

	/**
	 * plays game end sound
	 */
	const playGameEnd = useCallback(
		(winner: 'white' | 'black') => {
			//
			if (winner === 'white') {
				// ascending victory fanfare
				const frequencies = [523, 659, 784, 1047]; // C, E, G, C
				createComplexSound(frequencies, 1.2, 'sine', 0.5);
			} else {
				// different victory fanfare
				const frequencies = [440, 554, 659, 880]; // A, C#, E, A
				createComplexSound(frequencies, 1.2, 'sine', 0.5);
			}
		},
		[createComplexSound],
	);

	/**
	 * plays orb collision sound
	 */
	const playOrbCollision = useCallback(() => {
		//
		createSyntheticSound(150, 0.08, 'sawtooth', 0.15);
	}, [createSyntheticSound]);

	/**
	 * plays speed boost activation sound
	 */
	const playSpeedBoost = useCallback(() => {
		//
		const frequencies = [440, 554, 659, 880, 1109]; // ascending whoosh
		frequencies.forEach((freq, index) => {
			//
			setTimeout(() => {
				//
				createSyntheticSound(freq, 0.1, 'sawtooth', 0.3);
			}, index * 30);
		});
	}, [createSyntheticSound]);

	/**
	 * plays freeze activation sound
	 */
	const playFreeze = useCallback(() => {
		//
		const frequencies = [880, 659, 440, 330]; // descending freeze
		frequencies.forEach((freq, index) => {
			//
			setTimeout(() => {
				//
				createSyntheticSound(freq, 0.15, 'triangle', 0.25);
			}, index * 50);
		});
	}, [createSyntheticSound]);

	/**
	 * plays chaos mode activation sound - continuous chaotic soundscape
	 */
	const playChaosMode = useCallback(() => {
		//
		if (!config.enabled) return;

		try {
			const audioContext = getAudioContext();

			if (audioContext.state !== 'running') {
				console.warn('Audio context not running for chaos mode');
				return;
			}

			const chaosDuration = 6; // 6 seconds to match perk duration
			const startTime = audioContext.currentTime;
			const endTime = startTime + chaosDuration;

			// create multiple chaotic oscillators with different patterns
			for (let i = 0; i < 8; i++) {
				//
				const oscillator = audioContext.createOscillator();
				const gainNode = audioContext.createGain();
				const filterNode = audioContext.createBiquadFilter();

				// connect the audio graph
				oscillator.connect(filterNode);
				filterNode.connect(gainNode);
				gainNode.connect(audioContext.destination);

				// randomize oscillator type for chaos
				const types: OscillatorType[] = ['square', 'sawtooth', 'triangle'];
				oscillator.type = types[Math.floor(Math.random() * types.length)];

				// chaotic frequency modulation
				const baseFreq = 100 + Math.random() * 400;
				oscillator.frequency.setValueAtTime(baseFreq, startTime);

				// create chaotic frequency changes throughout duration
				for (let t = 0; t < chaosDuration; t += 0.1) {
					//
					const time = startTime + t;
					const randomFreq = 80 + Math.random() * 600;
					oscillator.frequency.exponentialRampToValueAtTime(randomFreq, time);
				}

				// chaotic filter modulation
				filterNode.type = 'lowpass';
				filterNode.frequency.setValueAtTime(200 + Math.random() * 800, startTime);
				filterNode.Q.setValueAtTime(1 + Math.random() * 10, startTime);

				// randomize filter changes
				for (let t = 0; t < chaosDuration; t += 0.2) {
					//
					const time = startTime + t;
					const randomCutoff = 100 + Math.random() * 1000;
					const randomQ = 0.5 + Math.random() * 15;
					filterNode.frequency.exponentialRampToValueAtTime(randomCutoff, time);
					filterNode.Q.linearRampToValueAtTime(randomQ, time);
				}

				// chaotic volume envelope
				const maxVolume = (0.1 + Math.random() * 0.15) * config.volume;
				gainNode.gain.setValueAtTime(0, startTime);
				gainNode.gain.linearRampToValueAtTime(maxVolume, startTime + 0.1);

				// create chaotic volume fluctuations
				for (let t = 0.1; t < chaosDuration - 0.5; t += 0.05 + Math.random() * 0.1) {
					//
					const time = startTime + t;
					const randomVolume = Math.random() * maxVolume;
					gainNode.gain.linearRampToValueAtTime(randomVolume, time);
				}

				// fade out at the end
				gainNode.gain.linearRampToValueAtTime(0, endTime - 0.5);
				gainNode.gain.linearRampToValueAtTime(0, endTime);

				// start and stop the oscillator
				oscillator.start(startTime);
				oscillator.stop(endTime);
			}

			// add some chaotic noise bursts throughout
			for (let burst = 0; burst < 20; burst++) {
				//
				setTimeout(
					() => {
						//
						if (!config.enabled) return;

						// create short chaotic noise burst
						const burstOsc = audioContext.createOscillator();
						const burstGain = audioContext.createGain();
						const burstFilter = audioContext.createBiquadFilter();

						burstOsc.connect(burstFilter);
						burstFilter.connect(burstGain);
						burstGain.connect(audioContext.destination);

						burstOsc.type = 'square';
						burstOsc.frequency.setValueAtTime(50 + Math.random() * 1000, audioContext.currentTime);

						burstFilter.type = 'bandpass';
						burstFilter.frequency.setValueAtTime(200 + Math.random() * 800, audioContext.currentTime);
						burstFilter.Q.setValueAtTime(5 + Math.random() * 20, audioContext.currentTime);

						const burstVolume = (0.05 + Math.random() * 0.1) * config.volume;
						burstGain.gain.setValueAtTime(0, audioContext.currentTime);
						burstGain.gain.linearRampToValueAtTime(burstVolume, audioContext.currentTime + 0.01);
						burstGain.gain.exponentialRampToValueAtTime(
							0.001,
							audioContext.currentTime + 0.05 + Math.random() * 0.1,
						);

						burstOsc.start(audioContext.currentTime);
						burstOsc.stop(audioContext.currentTime + 0.15);
					},
					Math.random() * chaosDuration * 1000,
				);
			}
		} catch (error) {
			console.warn('Failed to create chaos mode sound:', error);
		}
	}, [config.enabled, config.volume, getAudioContext]);

	/**
	 * plays extra orb activation sound
	 */
	const playExtraOrb = useCallback(() => {
		//
		createSyntheticSound(523, 0.3, 'sine', 0.4);
		setTimeout(() => {
			//
			createSyntheticSound(659, 0.2, 'sine', 0.3);
		}, 100);
	}, [createSyntheticSound]);

	/**
	 * plays unbreakable activation sound
	 */
	const playUnbreakable = useCallback(() => {
		//
		const frequencies = [220, 220, 220, 330]; // strong, solid sound
		frequencies.forEach((freq, index) => {
			//
			setTimeout(() => {
				//
				createSyntheticSound(freq, 0.2, 'square', 0.35);
			}, index * 100);
		});
	}, [createSyntheticSound]);

	/**
	 * updates sound configuration
	 */
	const updateConfig = useCallback((newConfig: Partial<SoundConfig>) => {
		//
		setConfig((prev) => ({ ...prev, ...newConfig }));
	}, []);

	/**
	 * manually resumes the audio context
	 */
	const resumeAudioContext = useCallback(async () => {
		//
		const audioContext = getAudioContext();
		if (audioContext.state === 'suspended') {
			try {
				await audioContext.resume();
				console.log('Audio context resumed successfully');
			} catch (error) {
				console.warn('Failed to resume audio context:', error);
			}
		}
	}, [getAudioContext]);

	/**
	 * ensures audio context is resumed on user interaction
	 */
	useEffect(() => {
		//
		const handleUserInteraction = () => {
			//
			if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
				audioContextRef.current.resume().catch((error) => {
					console.warn('Failed to resume audio context on user interaction:', error);
				});
			}
		};

		// add listeners for user interaction events
		const events = ['click', 'touchstart', 'keydown'];
		events.forEach((event) => {
			document.addEventListener(event, handleUserInteraction, { once: true });
		});

		return () => {
			//
			events.forEach((event) => {
				document.removeEventListener(event, handleUserInteraction);
			});
		};
	}, []);

	// cleanup on unmount
	useEffect(() => {
		//
		return () => {
			//
			Object.values(soundsRef.current).forEach((sound) => {
				//
				sound.unload();
			});

			// close audio context
			if (audioContextRef.current) {
				audioContextRef.current.close().catch((error) => {
					console.warn('Failed to close audio context:', error);
				});
			}
		};
	}, []);

	return {
		playOrbBounce,
		playTerritoryCapture,
		playPerkActivation,
		playGameStart,
		playGameEnd,
		playOrbCollision,
		playSpeedBoost,
		playFreeze,
		playChaosMode,
		playExtraOrb,
		playUnbreakable,
		config,
		updateConfig,
		resumeAudioContext,
	};
}
