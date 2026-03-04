import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentDateISO } from '../utils/dateHelpers';
import { useGamificationStore } from './useGamificationStore';

// ── Constants (rebalanced for Duolingo-level economy) ──
export const HINT_LETTER_COST = 3;
export const HINT_WORD_COST = 7;
export const STREAK_FREEZE_COST = 200;
export const LEVEL_UP_REWARD = 20;
export const LEAGUE_PROMOTION_REWARD = 50;

/** Default coin balance for new users */
const DEFAULT_COINS = 50;

interface EconomyState {
    coins: number;
    firstPuzzleBonusDate: string | null;

    // Actions
    addCoins: (amount: number) => void;
    spendCoins: (amount: number) => boolean;
    awardLevelUp: () => void;
    awardLeaguePromotion: () => void;
    buyStreakFreeze: () => boolean;

    // Derived
    getCoins: () => number;
    canAfford: (amount: number) => boolean;
}

export const useEconomyStore = create<EconomyState>()(
    persist(
        (set, get) => ({
            coins: DEFAULT_COINS,
            firstPuzzleBonusDate: null,

            // ── Core actions ──
            addCoins: (amount) => {
                set((s) => ({ coins: s.coins + amount }));
            },

            spendCoins: (amount) => {
                const { coins } = get();
                if (coins < amount) return false;
                set({ coins: coins - amount });
                return true;
            },

            awardLevelUp: () => {
                set((s) => ({ coins: s.coins + LEVEL_UP_REWARD }));
            },

            awardLeaguePromotion: () => {
                set((s) => ({ coins: s.coins + LEAGUE_PROMOTION_REWARD }));
            },

            buyStreakFreeze: () => {
                const { coins } = get();
                if (coins < STREAK_FREEZE_COST) return false;
                set({ coins: coins - STREAK_FREEZE_COST });
                useGamificationStore.getState().addFreezes(1);
                return true;
            },

            // ── Derived ──
            getCoins: () => {
                return get().coins;
            },

            canAfford: (amount) => {
                return get().coins >= amount;
            },
        }),
        {
            name: 'economy-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // Validate coins on rehydrate from AsyncStorage
            onRehydrateStorage: () => (state) => {
                if (!state) return;
                // If stored coins is NaN, negative, or not a finite number, reset to default
                if (
                    typeof state.coins !== 'number' ||
                    !Number.isFinite(state.coins) ||
                    state.coins < 0
                ) {
                    state.coins = DEFAULT_COINS;
                }
            },
        }
    )
);
