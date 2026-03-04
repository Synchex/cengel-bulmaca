/**
 * Developer Mode configuration.
 *
 * Toggle via environment variable:
 *   EXPO_PUBLIC_DEV_MODE=true   →  unlimited coins, dev panel access
 *   EXPO_PUBLIC_DEV_MODE=false  →  normal production behaviour
 *
 * In .env or .env.local:
 *   EXPO_PUBLIC_DEV_MODE=true
 */

export const IS_DEV =
    process.env.EXPO_PUBLIC_DEV_MODE === 'true' || __DEV__;

/**
 * When true, all levels are playable without lock restrictions.
 * Set to false for production-ready behaviour. Use Developer Panel
 * "Unlock All" button when testing level access during development.
 */
export const DEV_UNLOCK_ALL: boolean = false;

if (DEV_UNLOCK_ALL) {
    console.log('DEV MODE: All levels unlocked');
}

/** Unlimited coin balance shown in DEV mode */
export const DEV_COIN_BALANCE = 999_999;

