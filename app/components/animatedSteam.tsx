// components/AnimatedSteam.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

// tiny smooth noise-ish curve modifier (cheap Perlin-ish)
function wobble(t: number, freq = 1, amp = 6) {
  // blend a couple of sines for “organic” motion
  return (
    Math.sin(t * 0.9 * freq) * 0.6 +
    Math.sin(t * 1.7 * freq + 1.2) * 0.3 +
    Math.sin(t * 2.3 * freq + 2.4) * 0.1
  ) * amp;
}

type Props = {
  /** screen-space placement so it sits right at the mug rim */
  left: number;
  top: number;
  /** overall steam width/height area */
  width?: number;
  height?: number;
  /** how fast the steam rises (ms per cycle) */
  cycleMs?: number;
  /** optional style for outer absolute container */
  style?: ViewStyle;
  /** scale steam opacity globally (0–1) */
  opacity?: number;
};

const AnimatedG = Animated.createAnimatedComponent(G);

export default function AnimatedSteam({
  left,
  top,
  width = 80,
  height = 120,
  cycleMs = 3500,
  style,
  opacity = 1,
}: Props) {
  // three independent “wisps”
  const seeds = useMemo(() => [0, 0.7, 1.4].map((s) => s + Math.random() * 0.4), []);
  const aVals = [useRef(new Animated.Value(0)).current,
                 useRef(new Animated.Value(0)).current,
                 useRef(new Animated.Value(0)).current];

  useEffect(() => {
    // loop each wisp with a slight stagger
    aVals.forEach((val, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: cycleMs, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: false }),
        ]),
        { iterations: -1 }
      );
      const id = setTimeout(() => loop.start(), i * (cycleMs / 3));
      return () => { clearTimeout(id); try { (loop as any).stop?.(); } catch {} };
    });
  }, [aVals, cycleMs]);

  // render one wisp path from animated progress
  const renderWisp = (i: number) => {
    // sample the animated value imperatively each render via a listener
    const tRef = useRef(0);
    useEffect(() => {
      const id = aVals[i].addListener(({ value }) => { tRef.current = value; });
      return () => aVals[i].removeListener(id);
    }, [i]);

    // Animated props for translateY + opacity (these are smoother)
    const ty = aVals[i].interpolate({ inputRange: [0, 1], outputRange: [0, -height] });
    const op = aVals[i].interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 0.9, 0.7, 0] });

    // recompute the Path’s “C” control points on each render using tRef
    const pathD = (() => {
      const t = tRef.current + seeds[i];
      const w = width, h = height;
      const x0 = w * 0.5 + wobble(t * 6, 1, 4);   // start
      const y0 = h;

      // two control points + end point for a smooth S-curve
      const c1x = w * 0.35 + wobble(t * 5, 1.1, 10);
      const c1y = h * 0.66 + wobble(t * 4, 0.8, 8);
      const c2x = w * 0.65 + wobble(t * 7, 1.3, 10);
      const c2y = h * 0.33 + wobble(t * 3.3, 1.0, 8);
      const x1  = w * 0.5 + wobble(t * 8, 1.2, 6);
      const y1  = 0;

      return `M ${x0},${y0} C ${c1x},${c1y} ${c2x},${c2y} ${x1},${y1}`;
    })();

    return (
  <AnimatedG
  key={i}
  transform={[{ translateY: ty }]}    // Animated accepts an array for transform
  opacity={Animated.multiply(op, opacity)}
>

        <Path d={pathD} stroke="url(#steamGrad)" strokeWidth={4.5} strokeLinecap="round" fill="none" />
        <Path d={pathD} stroke="url(#steamGrad)" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      </AnimatedG>
    );
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left, top, width, height },
        style,
      ]}
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="steamGrad" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.0)" />
            <Stop offset="40%" stopColor="rgba(255,255,255,0.6)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
          </LinearGradient>
        </Defs>
        {renderWisp(0)}
        {renderWisp(1)}
        {renderWisp(2)}
      </Svg>
    </Animated.View>
  );
}
