// app/ruffie-steam.tsx
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

// Reanimated wrappers for react-native-svg
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// --- Art ---
const ruffieLousyCoffee = require('../assets/images/ruffieWithLousyCoffee.png');

// --- Layout tuning ---
const { width: W, height: H } = Dimensions.get('window');
const RUFFIE_LEFT = Math.round(W * 0.28);
const RUFFIE_TOP  = Math.round(H * 0.48);
const RUFFIE_W    = 220;
const RUFFIE_H    = 220;

// Mug rim center (screen coords) — tune these two
const STEAM_START_X = RUFFIE_LEFT + 50;
const STEAM_START_Y = RUFFIE_TOP  + 150;

// Steam field nominal size
const STEAM_WIDTH  = 70;
const STEAM_HEIGHT = 70;

// How many wisps — keep your current count
const N_WISPS = 7;

/**
 * Per-wisp micro-tweaks:
 * - X_OFF nudges each wisp left/right so one that “escapes” gets pulled back in.
 * - H_SCALE shortens/tallens individual wisps (1 = default).
 * Adjust only the one that was out of the mug (here I shorten & shift #6 as example).
 */
const WISP_X_OFF  = [-10, -6, -2, 0, 3, 6, -8];  // last one pulled left a bit
const WISP_H_SCALE= [0.92, 0.95, 1.0, 1.0, 0.9, 0.85, 0.72]; // last one made shorter

// Optional soft safety rails: clip region just above the mug
const CLIP = {
  x: STEAM_START_X - 18,  // widen/narrow horizontally
  y: STEAM_START_Y - 58,  // raise/lower the clip top
  w: 52,
  h: 76,
  r: 10,
};

// Utility: build a wavy path from bottom to top (fake “noise” with sines)
function makeWispPath(x0: number, y0: number, t: number, skew: number, height: number) {
  const steps = 10;
  const amp = 8 + 6 * Math.sin(t + skew * 0.37); // lateral swing amplitude
  const wiggle = (y: number) =>
    Math.sin((y * 0.06) + t * 1.3 + skew) * 0.6 +
    Math.sin((y * 0.03) + t * 0.7 + skew * 1.7) * 0.4;

  let d = `M ${x0} ${y0}`;
  for (let i = 1; i <= steps; i++) {
    const yy = y0 - (height * (i / steps));
    const phase = i * 8;
    const xx = x0 + amp * wiggle(phase);
    d += ` L ${xx.toFixed(2)} ${yy.toFixed(2)}`;
  }
  return d;
}
export default function RuffieSteam() {
  const router = useRouter();

  // Create shared values per wisp
  const wisps = useMemo(() => {
    return new Array(N_WISPS).fill(0).map((_, i) => {
      const spread = ((i - (N_WISPS - 1) / 2) / (N_WISPS + 1)) * STEAM_WIDTH;
      return {
        // time drives the shape change
        t: useSharedValue(0),
        // vertical drift
        drift: useSharedValue(0),
        // lateral base offset + micro nudge
        xoff: spread + (WISP_X_OFF[i] ?? 0),
        // opacity
        op: useSharedValue(0),
        // stagger delay
        delay: i * 180,
        // little variance
        skew: i * 0.9,
        // height scale to keep outliers inside the mug area
        hscale: WISP_H_SCALE[i] ?? 1,
      };
    });
  }, []);

  useEffect(() => {
    // kick off looping animations
    wisps.forEach(({ t, drift, op, delay }) => {
      // loop time
      t.value = withRepeat(
        withSequence(
          withDelay(delay, withTiming(2 * Math.PI, { duration: 3400, easing: Easing.linear })),
          withTiming(0, { duration: 0 }) // snap back to 0
        ),
        -1,
        false
      );

      // vertical drift up then reset
      drift.value = withRepeat(
        withDelay(delay, withTiming(-STEAM_HEIGHT - 40, { duration: 3600, easing: Easing.out(Easing.quad) })),
        -1,
        false
      );

      // fade in → hold → fade out
      op.value = withRepeat(
        withSequence(
          withDelay(delay, withTiming(1, { duration: 600 })),
          withTiming(1, { duration: 1400 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );
    });
  }, [wisps]);

  // Animated props builders
  const useWispPathProps = (w: typeof wisps[number]) =>
    useAnimatedProps(() => {
      const T = w.t.value || 0;
      const d = makeWispPath(
        STEAM_START_X + w.xoff,
        STEAM_START_Y,
        T,
        w.skew,
        STEAM_HEIGHT * w.hscale
      );
      return {
        d,
        opacity: w.op.value,
      } as any;
    });

  const useGroupProps = (w: typeof wisps[number]) =>
    useAnimatedProps(() => {
      // Use SVG transform attribute (string), not RN style
      const ty = w.drift.value || 0;
      return { transform: `translate(0, ${ty})` } as any;
    });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Ruffie art underlay */}
      <Image
        source={ruffieLousyCoffee}
        style={{
          position: 'absolute',
          left: RUFFIE_LEFT,
          top: RUFFIE_TOP,
          width: RUFFIE_W,
          height: RUFFIE_H,
          resizeMode: 'contain',
        }}
        accessibilityLabel="Ruffie holding a steaming mug"
      />

      {/* SVG overlay for steam */}
      <Svg pointerEvents="none" width={W} height={H} style={StyleSheet.absoluteFill}>
        {/* Clip region to softly keep wisps inside the mug zone (optional; tweak CLIP above) */}
        <Defs>
          <ClipPath id="steamClip">
            <Rect x={CLIP.x} y={CLIP.y} width={CLIP.w} height={CLIP.h} rx={CLIP.r} ry={CLIP.r} />
          </ClipPath>
        </Defs>

        <G clipPath="url(#steamClip)">
          {wisps.map((w, i) => {
            const groupProps = useGroupProps(w);
            const pathProps = useWispPathProps(w);

            return (
              <AnimatedG key={i} animatedProps={groupProps}>
                {/* bright core */}
                <AnimatedPath
                  animatedProps={pathProps}
                  stroke="#ffffff"
                  strokeOpacity={0.95}
                  strokeWidth={3}
                  fill="none"
                />
                {/* soft glow */}
                <AnimatedPath
                  animatedProps={pathProps}
                  stroke="#d0e8ff"
                  strokeOpacity={0.35}
                  strokeWidth={7}
                  fill="none"
                />
              </AnimatedG>
            );
          })}
        </G>
      </Svg>

      {/* tiny back button to leave the lab page */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.back}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Text style={styles.backTxt}>‹ Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // dark helps the semi-transparent steam pop; change to '#fff' if your page is light
  container: { flex: 1, backgroundColor: '#000' },
  back: {
    position: 'absolute',
    left: 12,
    top: Platform.select({ ios: 52, android: 28, default: 16 }),
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  backTxt: { color: '#fff', fontWeight: '800' },
});
