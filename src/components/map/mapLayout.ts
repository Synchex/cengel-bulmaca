/**
 * Deterministic layout for the Candy Crush–style level map.
 *
 * 160 nodes placed along a sinusoidal wave path, bottom to top.
 * Every 5th node is a "boss" node (larger, visually distinct).
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Node sizes ──
export const NODE_SIZE = 64;
export const BOSS_NODE_SIZE = 80;
export const NODE_HITSLOP = 8;

// ── Path layout ──
export const VERTICAL_GAP = 140;          // Vertical distance between nodes
export const WAVE_AMPLITUDE = 90;         // Horizontal wave amplitude
export const PATH_WIDTH = 5;              // Path line thickness
export const PATH_DOT_SIZE = 8;           // Decorative dots along path

// ── Seeded jitter for organic feel ──
function seededRandom(seed: number): number {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

// ── World config ──
export const LEVELS_PER_WORLD = 5;
export const TOTAL_LEVELS = 160;
export const TOTAL_WORLDS = TOTAL_LEVELS / LEVELS_PER_WORLD; // 32

export const WORLD_NAMES = [
    // Part 1–8 (ch1–ch40)
    'Başlangıç',
    'Keşif',
    'Gelişim',
    'Ustalaşma',
    'Meydan Okuma',
    'Zirve',
    'Elit',
    'Efsane',
    // Part 9–24 (ch41–ch120)
    'Yeni Başlangıç',
    'Keşif Yolu',
    'Macera',
    'İlerleme',
    'Güçlenme',
    'Ustalık Yolu',
    'Derinlik',
    'Çelik İrade',
    'Doruklarda',
    'Zirve Ötesi',
    'Altın Çağ',
    'Efsane Ötesi',
    'Büyük Meydan',
    'Son Sınav',
    'Şampiyon',
    'Ultra Zirve',
    // Part 25–32 (ch121–ch160)
    'Yeni Keşif',
    'Cesur Adım',
    'Derin Sular',
    'Kaya Yüzü',
    'Şimşek',
    'Ejderha',
    'Olimpos',
    'Efsanevi Son',
];

// ── World banner height ──
export const WORLD_BANNER_HEIGHT = 52;
export const WORLD_BANNER_GAP = 16; // gap above/below banner

// ── Map dimensions ──
// Total map height: levels * gap + world banners + top/bottom padding
const BANNER_TOTAL = TOTAL_WORLDS * (WORLD_BANNER_HEIGHT + WORLD_BANNER_GAP * 2);
export const MAP_HEIGHT = TOTAL_LEVELS * VERTICAL_GAP + BANNER_TOTAL + 200;
export const MAP_PADDING_TOP = 100;
export const MAP_PADDING_BOTTOM = 140;

// ── Node position ──
export interface NodePosition {
    index: number;       // 0-based level index
    x: number;           // center x
    y: number;           // center y (from TOP of map — inverted later)
    isBoss: boolean;     // every 5th
    worldIndex: number;  // 0-based world
}

/**
 * Generate all 160 node positions, bottom-to-top.
 * The first node is at the BOTTOM of the map, the last at the top.
 */
export function generateNodePositions(): NodePosition[] {
    const positions: NodePosition[] = [];
    const centerX = SCREEN_W / 2;

    let currentY = MAP_HEIGHT - MAP_PADDING_BOTTOM;

    for (let i = 0; i < TOTAL_LEVELS; i++) {
        const worldIndex = Math.floor(i / LEVELS_PER_WORLD);
        const isBoss = (i + 1) % LEVELS_PER_WORLD === 0;

        // Add world banner space at the start of each world (except first)
        if (i > 0 && i % LEVELS_PER_WORLD === 0) {
            currentY -= (WORLD_BANNER_GAP * 2 + WORLD_BANNER_HEIGHT);
        }

        // Sinusoidal wave offset + seeded jitter for organic feel
        const waveOffset = Math.sin((i / 3) * Math.PI) * WAVE_AMPLITUDE;
        const jitterX = (seededRandom(i * 7 + 3) - 0.5) * 18;
        const jitterY = (seededRandom(i * 13 + 7) - 0.5) * 10;

        const x = centerX + waveOffset + jitterX;
        const y = currentY + jitterY;

        positions.push({ index: i, x, y, isBoss, worldIndex });

        currentY -= VERTICAL_GAP;
    }

    return positions;
}

/**
 * Get the Y position for a world banner (placed between worlds).
 * Returns the Y center of the banner.
 */
export function getWorldBannerPositions(nodes: NodePosition[]): { worldIndex: number; y: number }[] {
    const banners: { worldIndex: number; y: number }[] = [];

    for (let w = 1; w < TOTAL_WORLDS; w++) {
        const lastOfPrev = nodes[w * LEVELS_PER_WORLD - 1];
        const firstOfNext = nodes[w * LEVELS_PER_WORLD];
        const midY = (lastOfPrev.y + firstOfNext.y) / 2;
        banners.push({ worldIndex: w, y: midY });
    }

    return banners;
}

// Pre-compute once
export const NODE_POSITIONS = generateNodePositions();
export const BANNER_POSITIONS = getWorldBannerPositions(NODE_POSITIONS);
