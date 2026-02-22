/**
 * JourneyBackground — Cinematic Space Background
 *
 * 6-layer composited background for the Bölümler journey map.
 *
 * Layer 1: Deep space base gradient + vignette
 * Layer 2: Distant planet horizon arc (atmospheric rim light)
 * Layer 3: Aurora / light curtains (teal-violet, blurred)
 * Layer 4: Dense starfield with depth (3 tiers + twinkle)
 * Layer 5: Space dust / micro particles
 * Layer 6: Film grain overlay (anti-banding)
 *
 * All layers are memoized. Animations use native driver only.
 * Render with StyleSheet.absoluteFill behind the map.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
    View,
    Animated,
    Easing,
    StyleSheet,
    Dimensions,
    PixelRatio,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
    Defs,
    RadialGradient as SvgRadialGradient,
    LinearGradient as SvgLinearGradient,
    Stop,
    Ellipse,
    Path,
    Circle,
    Rect,
    G,
} from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const PX = PixelRatio.get();

// ═══════════════════════════════════════════
//  CONSTANTS — Tweak these for fine-tuning
// ═══════════════════════════════════════════

// Layer 2: Planet
const PLANET_CENTER_X = SW * 0.5;
const PLANET_CENTER_Y = SH * 1.55;
const PLANET_RADIUS_X = SW * 1.4;
const PLANET_RADIUS_Y = SH * 0.85;
const PLANET_ATMOSPHERE_OPACITY = 0.14;

// Layer 3: Aurora
const AURORA_OPACITY = 0.09;

// Layer 4: Stars
const STARS_SMALL = 80;   // 1px dots
const STARS_MEDIUM = 25;  // 2px dots
const STARS_BRIGHT = 6;   // 3px with bloom
const TWINKLE_COUNT = 8;
const STAR_FIELD_HEIGHT = SH * 3; // extend for scroll

// Layer 5: Dust
const DUST_COUNT = 35;
const DUST_OPACITY = 0.04;

// Layer 6: Grain
const GRAIN_OPACITY = 0.03;

// Animations
const STAR_PARALLAX_PX = 1.5;
const STAR_PARALLAX_DURATION = 15000;
const AURORA_SHIFT_PX = 4;
const AURORA_SHIFT_DURATION = 20000;

// ═══════════════════════════════════════════
//  SEEDED RNG (consistent star positions)
// ═══════════════════════════════════════════

function createRNG(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

// ═══════════════════════════════════════════
//  LAYER 1 — Base Gradient + Vignette
// ═══════════════════════════════════════════

const BaseGradient = React.memo(function BaseGradient() {
    return (
        <>
            {/* Deep space multi-stop gradient */}
            <LinearGradient
                colors={[
                    '#020408',
                    '#040B18',
                    '#081428',
                    '#0B1A38',
                    '#0D1D42',
                    '#0B1A38',
                    '#071020',
                    '#030610',
                ]}
                locations={[0, 0.1, 0.25, 0.4, 0.5, 0.65, 0.85, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            {/* Vignette — edges darker */}
            <View style={styles.vignetteTop} />
            <View style={styles.vignetteBottom} />
            <View style={styles.vignetteLeft} />
            <View style={styles.vignetteRight} />
        </>
    );
});

// ═══════════════════════════════════════════
//  LAYER 2 — Distant Planet Horizon
// ═══════════════════════════════════════════

const PlanetHorizon = React.memo(function PlanetHorizon() {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width={SW} height={SH} style={StyleSheet.absoluteFill}>
                <Defs>
                    {/* Atmospheric rim glow */}
                    <SvgRadialGradient
                        id="planetAtmo"
                        cx="50%"
                        cy="100%"
                        rx="70%"
                        ry="55%"
                    >
                        <Stop offset="0.75" stopColor="#6366F1" stopOpacity="0" />
                        <Stop offset="0.88" stopColor="#6366F1" stopOpacity={String(PLANET_ATMOSPHERE_OPACITY * 0.6)} />
                        <Stop offset="0.94" stopColor="#818CF8" stopOpacity={String(PLANET_ATMOSPHERE_OPACITY)} />
                        <Stop offset="0.97" stopColor="#A5B4FC" stopOpacity={String(PLANET_ATMOSPHERE_OPACITY * 0.8)} />
                        <Stop offset="1" stopColor="#C7D2FE" stopOpacity="0" />
                    </SvgRadialGradient>
                    {/* Surface glow at horizon line */}
                    <SvgLinearGradient id="horizonGlow" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#818CF8" stopOpacity="0.12" />
                        <Stop offset="0.4" stopColor="#6366F1" stopOpacity="0.06" />
                        <Stop offset="1" stopColor="#6366F1" stopOpacity="0" />
                    </SvgLinearGradient>
                </Defs>

                {/* Planet body (mostly below viewport) */}
                <Ellipse
                    cx={PLANET_CENTER_X}
                    cy={PLANET_CENTER_Y}
                    rx={PLANET_RADIUS_X}
                    ry={PLANET_RADIUS_Y}
                    fill="url(#planetAtmo)"
                />

                {/* Thin horizon rim light */}
                <Path
                    d={`M 0 ${SH * 0.72} Q ${SW * 0.5} ${SH * 0.66} ${SW} ${SH * 0.74}`}
                    stroke="#818CF8"
                    strokeWidth="1"
                    strokeOpacity="0.08"
                    fill="none"
                />
                <Path
                    d={`M 0 ${SH * 0.72} Q ${SW * 0.5} ${SH * 0.66} ${SW} ${SH * 0.74} L ${SW} ${SH} L 0 ${SH} Z`}
                    fill="url(#horizonGlow)"
                    opacity="0.5"
                />
            </Svg>
        </View>
    );
});

// ═══════════════════════════════════════════
//  LAYER 3 — Aurora / Light Curtains
// ═══════════════════════════════════════════

const AuroraCurtains = React.memo(function AuroraCurtains() {
    return (
        <Svg
            width={SW}
            height={SH}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
        >
            <Defs>
                <SvgLinearGradient id="aurora1" x1="0.2" y1="0" x2="0.8" y2="1">
                    <Stop offset="0" stopColor="#2DD4BF" stopOpacity="0" />
                    <Stop offset="0.3" stopColor="#2DD4BF" stopOpacity={String(AURORA_OPACITY)} />
                    <Stop offset="0.5" stopColor="#8B5CF6" stopOpacity={String(AURORA_OPACITY * 0.8)} />
                    <Stop offset="0.7" stopColor="#6366F1" stopOpacity={String(AURORA_OPACITY * 0.5)} />
                    <Stop offset="1" stopColor="#6366F1" stopOpacity="0" />
                </SvgLinearGradient>
                <SvgLinearGradient id="aurora2" x1="0.7" y1="0" x2="0.3" y2="1">
                    <Stop offset="0" stopColor="#7C3AED" stopOpacity="0" />
                    <Stop offset="0.25" stopColor="#7C3AED" stopOpacity={String(AURORA_OPACITY * 0.6)} />
                    <Stop offset="0.55" stopColor="#2DD4BF" stopOpacity={String(AURORA_OPACITY * 0.7)} />
                    <Stop offset="0.85" stopColor="#0EA5E9" stopOpacity={String(AURORA_OPACITY * 0.3)} />
                    <Stop offset="1" stopColor="#0EA5E9" stopOpacity="0" />
                </SvgLinearGradient>
            </Defs>

            {/* Aurora ribbon 1 — sweeps from upper-left to mid-right */}
            <Path
                d={`M ${-SW * 0.1} ${SH * 0.05}
                    C ${SW * 0.15} ${SH * 0.12}, ${SW * 0.4} ${SH * 0.08}, ${SW * 0.65} ${SH * 0.18}
                    C ${SW * 0.85} ${SH * 0.26}, ${SW * 1.05} ${SH * 0.32}, ${SW * 1.15} ${SH * 0.38}
                    L ${SW * 1.15} ${SH * 0.46}
                    C ${SW * 1.0} ${SH * 0.40}, ${SW * 0.75} ${SH * 0.32}, ${SW * 0.55} ${SH * 0.26}
                    C ${SW * 0.3} ${SH * 0.18}, ${SW * 0.1} ${SH * 0.20}, ${-SW * 0.1} ${SH * 0.15}
                    Z`}
                fill="url(#aurora1)"
            />

            {/* Aurora ribbon 2 — sweeps from mid-right downward */}
            <Path
                d={`M ${SW * 1.1} ${SH * 0.3}
                    C ${SW * 0.85} ${SH * 0.35}, ${SW * 0.6} ${SH * 0.42}, ${SW * 0.35} ${SH * 0.48}
                    C ${SW * 0.15} ${SH * 0.53}, ${-SW * 0.05} ${SH * 0.50}, ${-SW * 0.15} ${SH * 0.52}
                    L ${-SW * 0.15} ${SH * 0.58}
                    C ${-SW * 0.0} ${SH * 0.57}, ${SW * 0.2} ${SH * 0.60}, ${SW * 0.4} ${SH * 0.55}
                    C ${SW * 0.65} ${SH * 0.48}, ${SW * 0.9} ${SH * 0.42}, ${SW * 1.1} ${SH * 0.38}
                    Z`}
                fill="url(#aurora2)"
            />
        </Svg>
    );
});

// ═══════════════════════════════════════════
//  LAYER 4 — Starfield
// ═══════════════════════════════════════════

interface StarData {
    x: number;
    y: number;
    r: number;
    opacity: number;
    tier: 'small' | 'medium' | 'bright';
    twinkle: boolean;
}

function generateStarfield(): StarData[] {
    const rng = createRNG(2024);
    const stars: StarData[] = [];

    // Small stars
    for (let i = 0; i < STARS_SMALL; i++) {
        stars.push({
            x: rng() * SW,
            y: rng() * STAR_FIELD_HEIGHT,
            r: 0.5 + rng() * 0.3,
            opacity: 0.15 + rng() * 0.25,
            tier: 'small',
            twinkle: false,
        });
    }

    // Medium stars
    for (let i = 0; i < STARS_MEDIUM; i++) {
        stars.push({
            x: rng() * SW,
            y: rng() * STAR_FIELD_HEIGHT,
            r: 0.8 + rng() * 0.4,
            opacity: 0.3 + rng() * 0.3,
            tier: 'medium',
            twinkle: i < TWINKLE_COUNT,
        });
    }

    // Bright stars with bloom
    for (let i = 0; i < STARS_BRIGHT; i++) {
        stars.push({
            x: rng() * SW,
            y: rng() * STAR_FIELD_HEIGHT,
            r: 1.2 + rng() * 0.5,
            opacity: 0.5 + rng() * 0.35,
            tier: 'bright',
            twinkle: true,
        });
    }

    return stars;
}

const StaticStarLayer = React.memo(function StaticStarLayer({
    stars,
}: {
    stars: StarData[];
}) {
    const staticStars = stars.filter((s) => !s.twinkle);

    return (
        <Svg width={SW} height={STAR_FIELD_HEIGHT}>
            <Defs>
                <SvgRadialGradient id="starBloom" cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor="#E0E7FF" stopOpacity="0.9" />
                    <Stop offset="0.5" stopColor="#C7D2FE" stopOpacity="0.3" />
                    <Stop offset="1" stopColor="#A5B4FC" stopOpacity="0" />
                </SvgRadialGradient>
            </Defs>
            {staticStars.map((star, i) => (
                <G key={`s-${i}`}>
                    <Circle
                        cx={star.x}
                        cy={star.y}
                        r={star.r}
                        fill="#E0E7FF"
                        opacity={star.opacity}
                    />
                    {star.tier === 'bright' && (
                        <Circle
                            cx={star.x}
                            cy={star.y}
                            r={star.r * 4}
                            fill="url(#starBloom)"
                            opacity={star.opacity * 0.4}
                        />
                    )}
                </G>
            ))}
        </Svg>
    );
});

const TwinkleStar = React.memo(function TwinkleStar({
    star,
}: {
    star: StarData;
}) {
    const anim = useRef(new Animated.Value(star.opacity)).current;

    useEffect(() => {
        const delay = Math.random() * 6000;
        const timeout = setTimeout(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: star.opacity * 0.3,
                        duration: 2000 + Math.random() * 3000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: star.opacity,
                        duration: 2000 + Math.random() * 3000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ]),
            ).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, []);

    const size = star.r * 2;
    const bloomSize = star.tier === 'bright' ? star.r * 8 : 0;

    return (
        <Animated.View
            pointerEvents="none"
            style={{
                position: 'absolute',
                left: star.x - size / 2,
                top: star.y - size / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: '#E0E7FF',
                opacity: anim,
                ...(star.tier === 'bright' && {
                    shadowColor: '#C7D2FE',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: bloomSize / 2,
                }),
            }}
        />
    );
});

// ═══════════════════════════════════════════
//  LAYER 5 — Space Dust
// ═══════════════════════════════════════════

function generateDust(): Array<{
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    opacity: number;
    rotation: number;
}> {
    const rng = createRNG(999);
    const dust = [];
    for (let i = 0; i < DUST_COUNT; i++) {
        dust.push({
            cx: rng() * SW,
            cy: rng() * STAR_FIELD_HEIGHT,
            rx: 8 + rng() * 30,
            ry: 3 + rng() * 12,
            opacity: DUST_OPACITY * (0.3 + rng() * 0.7),
            rotation: rng() * 360,
        });
    }
    return dust;
}

const SpaceDustLayer = React.memo(function SpaceDustLayer() {
    const dust = useMemo(() => generateDust(), []);

    return (
        <Svg width={SW} height={STAR_FIELD_HEIGHT} pointerEvents="none">
            {dust.map((d, i) => (
                <Ellipse
                    key={`dust-${i}`}
                    cx={d.cx}
                    cy={d.cy}
                    rx={d.rx}
                    ry={d.ry}
                    fill="#A5B4FC"
                    opacity={d.opacity}
                    rotation={d.rotation}
                    origin={`${d.cx}, ${d.cy}`}
                />
            ))}
        </Svg>
    );
});

// ═══════════════════════════════════════════
//  LAYER 6 — Film Grain
// ═══════════════════════════════════════════

function generateGrainDots(): Array<{ x: number; y: number; o: number }> {
    const rng = createRNG(314);
    const dots = [];
    const count = 200;
    for (let i = 0; i < count; i++) {
        dots.push({
            x: rng() * SW,
            y: rng() * SH,
            o: GRAIN_OPACITY * (0.4 + rng() * 0.6),
        });
    }
    return dots;
}

const FilmGrain = React.memo(function FilmGrain() {
    const dots = useMemo(() => generateGrainDots(), []);

    return (
        <Svg width={SW} height={SH} style={StyleSheet.absoluteFill} pointerEvents="none">
            {dots.map((d, i) => (
                <Rect
                    key={`g-${i}`}
                    x={d.x}
                    y={d.y}
                    width={1}
                    height={1}
                    fill="#FFF"
                    opacity={d.o}
                />
            ))}
        </Svg>
    );
});

// ═══════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════

export default function JourneyBackground() {
    const starfield = useMemo(() => generateStarfield(), []);
    const twinklingStars = useMemo(
        () => starfield.filter((s) => s.twinkle),
        [starfield],
    );

    // Parallax: starfield drift
    const starParallax = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(starParallax, {
                    toValue: 1,
                    duration: STAR_PARALLAX_DURATION,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(starParallax, {
                    toValue: 0,
                    duration: STAR_PARALLAX_DURATION,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, []);

    const starDriftX = starParallax.interpolate({
        inputRange: [0, 1],
        outputRange: [0, STAR_PARALLAX_PX],
    });
    const starDriftY = starParallax.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -STAR_PARALLAX_PX * 0.8],
    });

    // Parallax: aurora shift
    const auroraParallax = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(auroraParallax, {
                    toValue: 1,
                    duration: AURORA_SHIFT_DURATION,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(auroraParallax, {
                    toValue: 0,
                    duration: AURORA_SHIFT_DURATION,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, []);

    const auroraDriftX = auroraParallax.interpolate({
        inputRange: [0, 1],
        outputRange: [0, AURORA_SHIFT_PX],
    });
    const auroraDriftY = auroraParallax.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -AURORA_SHIFT_PX * 0.5],
    });

    // Aurora breathing opacity
    const auroraOpacity = auroraParallax.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.85, 1, 0.85],
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Layer 1: Base gradient + vignette */}
            <BaseGradient />

            {/* Layer 2: Planet horizon (static) */}
            <PlanetHorizon />

            {/* Layer 3: Aurora curtains (slow drift) */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        opacity: auroraOpacity,
                        transform: [
                            { translateX: auroraDriftX },
                            { translateY: auroraDriftY },
                        ],
                    },
                ]}
            >
                <AuroraCurtains />
            </Animated.View>

            {/* Layer 4 + 5: Starfield + dust (slow parallax) */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        transform: [
                            { translateX: starDriftX },
                            { translateY: starDriftY },
                        ],
                    },
                ]}
            >
                <StaticStarLayer stars={starfield} />
                <SpaceDustLayer />
            </Animated.View>

            {/* Twinkling stars (separate for animation) */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        transform: [
                            { translateX: starDriftX },
                            { translateY: starDriftY },
                        ],
                    },
                ]}
            >
                {twinklingStars.map((star, i) => (
                    <TwinkleStar key={`tw-${i}`} star={star} />
                ))}
            </Animated.View>

            {/* Layer 6: Film grain (static, viewport only) */}
            <FilmGrain />
        </View>
    );
}

// ═══════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
    vignetteTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: SH * 0.15,
        backgroundColor: 'transparent',
        borderBottomWidth: 0,
        // Use shadow for soft vignette
        shadowColor: '#000',
        shadowOffset: { width: 0, height: SH * 0.1 },
        shadowOpacity: 0.4,
        shadowRadius: SH * 0.1,
    },
    vignetteBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SH * 0.12,
        backgroundColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -SH * 0.08 },
        shadowOpacity: 0.5,
        shadowRadius: SH * 0.08,
    },
    vignetteLeft: {
        position: 'absolute',
        top: 0,
        left: -20,
        bottom: 0,
        width: 40,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    vignetteRight: {
        position: 'absolute',
        top: 0,
        right: -20,
        bottom: 0,
        width: 40,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
});
