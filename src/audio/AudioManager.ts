/**
 * AudioManager — Premium SFX engine.
 *
 * • Uses expo-audio (replaces deprecated expo-av).
 * • Preloads all sounds once, reuses AudioPlayer instances.
 * • Per-sound volume tuning in the 0.18–0.42 range.
 * • Key press throttle (max 1 per 70ms) to prevent stacking.
 * • Synchronized haptic feedback (subtle, optional).
 * • Respects useSettingsStore sound/music toggles.
 */

import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../store/useSettingsStore';

// ──────────────────────────────────
//  Sound Effect Definitions
// ──────────────────────────────────
export type SfxName =
    | 'keyPress'
    | 'correctWord'
    | 'wrongWord'
    | 'buttonTap'
    | 'puzzleComplete';

const SFX_SOURCES: Record<SfxName, any> = {
    keyPress: require('../../assets/sounds/key_press.wav'),
    correctWord: require('../../assets/sounds/correct_word.wav'),
    wrongWord: require('../../assets/sounds/wrong_word.wav'),
    buttonTap: require('../../assets/sounds/button_tap.wav'),
    puzzleComplete: require('../../assets/sounds/puzzle_complete.wav'),
};

// Per-sound volume — all in soft/subtle range
const SFX_VOLUMES: Record<SfxName, number> = {
    keyPress: 0.22,
    buttonTap: 0.26,
    correctWord: 0.32,
    wrongWord: 0.26,
    puzzleComplete: 0.36,
};

// Per-sound haptic feedback (null = no haptic)
const SFX_HAPTICS: Record<SfxName, (() => void) | null> = {
    keyPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    buttonTap: null,
    correctWord: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    wrongWord: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    puzzleComplete: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
};

// Throttle config per sound (ms) — 0 = no throttle
const SFX_THROTTLE: Partial<Record<SfxName, number>> = {
    keyPress: 70,
    buttonTap: 120,
};

const MUSIC_SOURCE = require('../../assets/sounds/bg_music.wav');

// ──────────────────────────────────
//  Singleton AudioManager
// ──────────────────────────────────
class AudioManager {
    private sfxPlayers: Partial<Record<SfxName, AudioPlayer>> = {};
    private bgMusic: AudioPlayer | null = null;
    private isPreloaded = false;
    private isMusicPlaying = false;
    private lastPlayTime: Partial<Record<SfxName, number>> = {};

    /** Call once on game screen mount */
    async preloadSounds(): Promise<void> {
        if (this.isPreloaded) return;

        try {
            await setAudioModeAsync({
                playsInSilentMode: true,
                shouldPlayInBackground: false,
            });

            const sfxNames = Object.keys(SFX_SOURCES) as SfxName[];
            for (const name of sfxNames) {
                try {
                    const player = createAudioPlayer(SFX_SOURCES[name]);
                    player.volume = SFX_VOLUMES[name] ?? 0.25;
                    this.sfxPlayers[name] = player;
                } catch (e) {
                    console.warn(`[AudioManager] Failed to preload "${name}":`, e);
                }
            }

            try {
                const musicPlayer = createAudioPlayer(MUSIC_SOURCE);
                musicPlayer.volume = 0.2;
                musicPlayer.loop = true;
                this.bgMusic = musicPlayer;
            } catch (e) {
                console.warn('[AudioManager] Failed to preload music:', e);
            }

            this.isPreloaded = true;
        } catch (e) {
            console.warn('[AudioManager] preloadSounds error:', e);
        }
    }

    /** Unload all — call on unmount */
    async unloadSounds(): Promise<void> {
        await this.stopMusic();

        const names = Object.keys(this.sfxPlayers) as SfxName[];
        for (const name of names) {
            try { this.sfxPlayers[name]?.remove(); } catch (_) { }
        }

        try { this.bgMusic?.remove(); } catch (_) { }

        this.sfxPlayers = {};
        this.bgMusic = null;
        this.isPreloaded = false;
        this.isMusicPlaying = false;
        this.lastPlayTime = {};
    }

    // ── Background Music ──

    async playMusic(): Promise<void> {
        const musicEnabled = useSettingsStore.getState().music;
        if (!musicEnabled || !this.bgMusic || this.isMusicPlaying) return;
        try {
            await this.bgMusic.seekTo(0);
            this.bgMusic.play();
            this.isMusicPlaying = true;
        } catch (e) {
            console.warn('[AudioManager] playMusic error:', e);
        }
    }

    async stopMusic(): Promise<void> {
        if (!this.bgMusic || !this.isMusicPlaying) return;
        try {
            this.bgMusic.pause();
            this.isMusicPlaying = false;
        } catch (e) {
            console.warn('[AudioManager] stopMusic error:', e);
        }
    }

    async onMusicSettingChanged(enabled: boolean): Promise<void> {
        if (enabled) {
            await this.playMusic();
        } else {
            await this.stopMusic();
        }
    }

    // ── Sound Effects ──

    async playSfx(name: SfxName): Promise<void> {
        const { sound: soundEnabled, haptics: hapticsEnabled } =
            useSettingsStore.getState();
        if (!soundEnabled) return;

        // Throttle check
        const throttleMs = SFX_THROTTLE[name] ?? 0;
        if (throttleMs > 0) {
            const now = Date.now();
            const last = this.lastPlayTime[name] ?? 0;
            if (now - last < throttleMs) return; // Skip — too soon
            this.lastPlayTime[name] = now;
        }

        // Play sound
        const player = this.sfxPlayers[name];
        if (player) {
            try {
                await player.seekTo(0);
                player.play();
            } catch (e) {
                console.warn(`[AudioManager] playSfx "${name}" error:`, e);
            }
        }

        // Synchronized haptic
        if (hapticsEnabled) {
            const hapticFn = SFX_HAPTICS[name];
            if (hapticFn) hapticFn();
        }
    }

    get musicPlaying(): boolean {
        return this.isMusicPlaying;
    }
}

export const audioManager = new AudioManager();
