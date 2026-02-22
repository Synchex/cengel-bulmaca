/**
 * AnimatedMapBackground — Premium aurora-mesh animated background.
 *
 * Layer 1: Base gradient (handled by parent chapters.tsx)
 * Layer 2: Flowing aurora ribbons — large, organic, color-shifting gradients
 * Layer 3: Ambient mesh orbs — soft overlapping circles creating depth
 * Layer 4: Micro shimmer particles — tiny floating specs with gentle drift
 *
 * Design: Inspired by Apple's fluid gradients + aurora borealis.
 * No stars, no cheap blobs. Organic, alive, premium.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW, height: SH } = Dimensions.get('window');

// ═══════════════════════════════════
//  LAYER 2 — Aurora Ribbons
// ═══════════════════════════════════

const AURORA_RIBBONS = [
    {
        // Primary indigo-violet flow — top section
        colors: ['rgba(99,102,241,0)', 'rgba(99,102,241,0.12)', 'rgba(139,92,246,0.08)', 'rgba(139,92,246,0)'] as const,
        width: SW * 1.8,
        height: 280,
        x: -SW * 0.3,
        y: SH * 0.02,
        rotation: -8,
        driftX: 15,
        driftY: 8,
        duration: 16000,
        scaleRange: [1, 1.06] as [number, number],
    },
    {
        // Secondary cyan-indigo flow — mid section
        colors: ['rgba(56,189,248,0)', 'rgba(56,189,248,0.07)', 'rgba(99,102,241,0.10)', 'rgba(99,102,241,0)'] as const,
        width: SW * 1.6,
        height: 220,
        x: -SW * 0.2,
        y: SH * 0.35,
        rotation: 5,
        driftX: -12,
        driftY: -6,
        duration: 20000,
        scaleRange: [1, 1.04] as [number, number],
    },
    {
        // Tertiary warm purple — lower section
        colors: ['rgba(168,85,247,0)', 'rgba(168,85,247,0.06)', 'rgba(236,72,153,0.04)', 'rgba(236,72,153,0)'] as const,
        width: SW * 1.5,
        height: 200,
        x: -SW * 0.15,
        y: SH * 0.65,
        rotation: -3,
        driftX: 10,
        driftY: 5,
        duration: 22000,
        scaleRange: [1, 1.05] as [number, number],
    },
];

const AuroraRibbon = React.memo(function AuroraRibbon({
    ribbon,
}: {
    ribbon: (typeof AURORA_RIBBONS)[0];
}) {
    const anim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, {
                    toValue: 1,
                    duration: ribbon.duration,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 0,
                    duration: ribbon.duration,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: ribbon.duration * 1.3,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: ribbon.duration * 1.3,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, []);

    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, ribbon.driftX],
    });
    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, ribbon.driftY],
    });
    const scale = scaleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ribbon.scaleRange,
    });

    return (
        <Animated.View
            pointerEvents="none"
            style={{
                position: 'absolute',
                left: ribbon.x,
                top: ribbon.y,
                width: ribbon.width,
                height: ribbon.height,
                borderRadius: ribbon.height / 2,
                transform: [
                    { translateX },
                    { translateY },
                    { rotate: `${ribbon.rotation}deg` },
                    { scale },
                ],
                overflow: 'hidden',
            }}
        >
            <LinearGradient
                colors={ribbon.colors as unknown as [string, string, ...string[]]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ width: '100%', height: '100%', borderRadius: ribbon.height / 2 }}
            />
        </Animated.View>
    );
});

// ═══════════════════════════════════
//  LAYER 3 — Ambient Mesh Orbs
// ═══════════════════════════════════

const MESH_ORBS = [
    { size: 300, x: SW * 0.7, y: SH * 0.05, color: 'rgba(99,102,241,0.06)', driftX: -8, driftY: 6, duration: 18000 },
    { size: 250, x: -SW * 0.1, y: SH * 0.25, color: 'rgba(139,92,246,0.05)', driftX: 10, driftY: -4, duration: 22000 },
    { size: 220, x: SW * 0.5, y: SH * 0.5, color: 'rgba(56,189,248,0.04)', driftX: -6, driftY: 8, duration: 25000 },
    { size: 280, x: SW * 0.8, y: SH * 0.7, color: 'rgba(168,85,247,0.05)', driftX: 7, driftY: -5, duration: 20000 },
    { size: 200, x: SW * 0.15, y: SH * 0.8, color: 'rgba(99,102,241,0.04)', driftX: -5, driftY: 3, duration: 24000 },
];

const MeshOrb = React.memo(function MeshOrb({
    orb,
}: {
    orb: (typeof MESH_ORBS)[0];
}) {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, {
                    toValue: 1,
                    duration: orb.duration,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 0,
                    duration: orb.duration,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, []);

    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, orb.driftX],
    });
    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, orb.driftY],
    });

    return (
        <Animated.View
            pointerEvents="none"
            style={{
                position: 'absolute',
                left: orb.x - orb.size / 2,
                top: orb.y - orb.size / 2,
                width: orb.size,
                height: orb.size,
                borderRadius: orb.size / 2,
                backgroundColor: orb.color,
                transform: [{ translateX }, { translateY }],
            }}
        />
    );
});

// ═══════════════════════════════════
//  LAYER 4 — Shimmer Particles
// ═══════════════════════════════════

const SHIMMER_COUNT = 20;

interface ShimmerData {
    x: number;
    y: number;
    size: number;
    baseOpacity: number;
    driftY: number;
    duration: number;
    delay: number;
}

function generateShimmers(count: number): ShimmerData[] {
    let seed = 77;
    const rng = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };

    const particles: ShimmerData[] = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: rng() * SW,
            y: rng() * SH * 2.5,
            size: 1 + rng() * 2,
            baseOpacity: 0.08 + rng() * 0.15,
            driftY: -(3 + rng() * 6),
            duration: 6000 + rng() * 8000,
            delay: rng() * 5000,
        });
    }
    return particles;
}

const ShimmerParticle = React.memo(function ShimmerParticle({
    particle,
}: {
    particle: ShimmerData;
}) {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: particle.duration,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: particle.duration,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ]),
            ).start();
        }, particle.delay);
        return () => clearTimeout(timeout);
    }, []);

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, particle.driftY],
    });
    const opacity = anim.interpolate({
        inputRange: [0, 0.3, 0.7, 1],
        outputRange: [particle.baseOpacity * 0.3, particle.baseOpacity, particle.baseOpacity, particle.baseOpacity * 0.3],
    });

    return (
        <Animated.View
            pointerEvents="none"
            style={{
                position: 'absolute',
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                backgroundColor: '#C7D2FE',
                opacity,
                transform: [{ translateY }],
            }}
        />
    );
});

// ═══════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════

export default function AnimatedMapBackground() {
    const shimmers = useMemo(() => generateShimmers(SHIMMER_COUNT), []);

    // Global slow breathing for entire aurora layer
    const breathAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(breathAnim, {
                    toValue: 1,
                    duration: 30000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(breathAnim, {
                    toValue: 0,
                    duration: 30000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, []);

    const globalOpacity = breathAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.85, 1, 0.85],
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* ── Layer 2: Aurora Ribbons ── */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { opacity: globalOpacity },
                ]}
            >
                {AURORA_RIBBONS.map((ribbon, i) => (
                    <AuroraRibbon key={`aurora-${i}`} ribbon={ribbon} />
                ))}
            </Animated.View>

            {/* ── Layer 3: Ambient Mesh Orbs ── */}
            <View style={StyleSheet.absoluteFill}>
                {MESH_ORBS.map((orb, i) => (
                    <MeshOrb key={`mesh-${i}`} orb={orb} />
                ))}
            </View>

            {/* ── Layer 4: Shimmer Particles ── */}
            <View style={StyleSheet.absoluteFill}>
                {shimmers.map((p, i) => (
                    <ShimmerParticle key={`shim-${i}`} particle={p} />
                ))}
            </View>
        </View>
    );
}
