// app/milestone1lab.tsx
import { Stack } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ---------- Assets ----------
const rosieMouth = require('../assets/images/rosieMouth.png'); // Rosie looking up, mouth open
const cafMug    = require('../assets/images/cafMug.png');      // CAF mug (no drop)
const dropImg   = require('../assets/images/drop.png');        // single drop icon

// ---------- Screen + stage sizing ----------
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Stage padding from the very top of the screen (increase this to move Rosie LOWER)
const STAGE_TOP = Math.round(SCREEN_H * 0.30); // tweak as needed

// Character sizes
const ROSIE_W = 200;
const ROSIE_H = 200;
const MUG_W   = 80;
const MUG_H   = 80;
const DROP_W  = 24;
const DROP_H  = 24;

// Position Rosie horizontally centered
const ROSIE_LEFT = Math.round((SCREEN_W - ROSIE_W) / 2);

// Mouth offsets (relative to Rosie image’s bottom-left corner)
const MOUTH_OFFSET_X = 50;  // move right/left so drop hits center of mouth
const MOUTH_OFFSET_Y = 120;  // move up/down so drop hits mouth height

// Where to place the mug relative to the mouth target
// (positive LEFT offset moves mug to the right; negative moves left)
// (negative TOP offset places mug ABOVE the mouth; positive would place below)
const MUG_LEFT_OFFSET_FROM_MOUTH = -6;
const MUG_TOP_OFFSET_FROM_MOUTH  = -130;

// Drop starting distance above the mug (in px)
const DROP_LAUNCH_ABOVE_MUG = 16;

// ---------- Safe animation helpers ----------
type Anim = Animated.CompositeAnimation | null;

function stopAnim(ref: React.MutableRefObject<Anim>) {
  try { ref.current?.stop?.(); } catch {}
  ref.current = null;
}

function runAnim(ref: React.MutableRefObject<Anim>, a: Animated.CompositeAnimation, onEnd?: () => void) {
  stopAnim(ref);
  ref.current = a;
  a.start(({ finished }) => {
    if (finished) onEnd?.();
    // only clear if it's still the current instance
    if (ref.current === a) ref.current = null;
  });
}
// ---------- Component ----------
export default function Milestone1Lab() {
  // One state to force re-render if you want to tweak constants live later
  const [runKey, setRunKey] = useState(0);

  // --- Derived absolute positions (screen coords) ---
  const layout = useMemo(() => {
    const rosieTop = STAGE_TOP;                         // where Rosie sits vertically
    const rosieLeft = ROSIE_LEFT;

    // Mouth absolute position on screen (X from left, Y from top)
    const mouthX = rosieLeft + MOUTH_OFFSET_X;
    const mouthY = rosieTop + (ROSIE_H - MOUTH_OFFSET_Y);

    // Mug anchored relative to mouth
    const mugLeft = mouthX - MUG_W / 2 + MUG_LEFT_OFFSET_FROM_MOUTH;
    const mugTop  = mouthY - MUG_H + MUG_TOP_OFFSET_FROM_MOUTH;

    // Drop starts just under the mug (or above it if you make DROP_LAUNCH_ABOVE_MUG negative)
    const dropStartX = mouthX - DROP_W / 2;
    const dropStartY = mugTop + MUG_H - DROP_LAUNCH_ABOVE_MUG;

    // Drop target is centered on mouth
    const dropEndX = dropStartX;
    const dropEndY = mouthY - DROP_H / 2;

    return { rosieTop, rosieLeft, mouthX, mouthY, mugLeft, mugTop, dropStartX, dropStartY, dropEndX, dropEndY };
  }, [runKey]);

  // --- Animated values ---
  const dropY = useRef(new Animated.Value(layout.dropStartY)).current;
  const dropOpacity = useRef(new Animated.Value(0)).current;
  const dropScale = useRef(new Animated.Value(0.9)).current;

  const rosieY = useRef(new Animated.Value(0)).current;
  const rosieScale = useRef(new Animated.Value(1)).current;

  // keep a ref for the running sequence
  const seqRef = useRef<Anim>(null);

  const resetAnims = () => {
    dropOpacity.setValue(0);
    dropScale.setValue(0.9);
    dropY.setValue(layout.dropStartY);
    rosieY.setValue(0);
    rosieScale.setValue(1);
  };

  const playRosieCAF = () => {
    // if you tweak tunables live, this puts the drop back under the mug
    resetAnims();

    // 1) reveal & fall
    const fall = Animated.parallel([
      Animated.timing(dropOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(dropY, {
        toValue: layout.dropEndY,
        duration: 700,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(dropScale, { toValue: 1.0, duration: 700, useNativeDriver: true }),
    ]);

    // 2) gulp pop (Rosie squish up, drop disappears)
    const gulp = Animated.parallel([
      Animated.timing(dropOpacity, { toValue: 0, duration: 80, useNativeDriver: true }),
      Animated.timing(rosieScale, { toValue: 1.08, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(rosieY,     { toValue: -10,  duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]);

    // 3) settle + tiny happy bounce
    const settle = Animated.sequence([
      Animated.parallel([
        Animated.timing(rosieScale, { toValue: 1.0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(rosieY,     { toValue: 0,   duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(rosieY, { toValue: -6, duration: 140, useNativeDriver: true }),
        Animated.timing(rosieY, { toValue: 0,  duration: 160, useNativeDriver: true }),
      ]),
    ]);

    runAnim(seqRef, Animated.sequence([fall, gulp, settle]));
  };

  // Recompute derived positions if you ever change tunables at runtime.
  // For now we only compute them once; call setRunKey(v=>v+1) if you add controls.
  // useEffect(() => resetAnims(), [layout]); // optional if you add sliders later

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Text style={styles.title}>Milestone 1 — CAF Drop Test</Text>

      <Text style={styles.tip}>
        Tip: to move Rosie lower, increase <Text style={styles.code}>STAGE_TOP</Text>.
        {"\n"}To line up the drop, tune <Text style={styles.code}>MOUTH_OFFSET_X/Y</Text>.
        {"\n"}To place the mug, tune <Text style={styles.code}>MUG_LEFT_OFFSET_FROM_MOUTH</Text> and <Text style={styles.code}>MUG_TOP_OFFSET_FROM_MOUTH</Text>.
      </Text>

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={[styles.btn, styles.btnDark]} onPress={playRosieCAF} accessibilityLabel="Play Rosie coffee animation">
          <Text style={styles.btnTextLight}>Play CAF drop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => { resetAnims(); setRunKey(k => k + 1); }}
          accessibilityLabel="Reset positions"
        >
          <Text style={styles.btnText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Stage (absolute children) */}
      <View style={styles.stage}>
        {/* Rosie (static image; only her local Y/scale animates) */}
        <Animated.Image
          source={rosieMouth}
          style={[
            styles.rosie,
            {
              left: layout.rosieLeft,
              top: layout.rosieTop,
              transform: [{ translateY: rosieY }, { scale: rosieScale }],
            },
          ]}
          resizeMode="contain"
          accessibilityLabel="Rosie looking up with her mouth open"
        />

        {/* Mug above her (static position; tune offsets) */}
        <Image
          source={cafMug}
          style={[
            styles.mug,
            { left: layout.mugLeft, top: layout.mugTop },
          ]}
          resizeMode="contain"
          accessibilityLabel="Coffee mug"
        />

        {/* Drop (animates straight down into mouth) */}
        <Animated.Image
          source={dropImg}
          style={[
            styles.drop,
            {
              left: layout.dropStartX,
              transform: [{ translateY: dropY }, { scale: dropScale }],
              opacity: dropOpacity,
            },
          ]}
          resizeMode="contain"
          accessibilityLabel="Coffee drop"
        />
      </View>
    </View>
  );
}
// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  tip: {
    fontSize: 13,
    textAlign: 'center',
    color: '#444',
    marginBottom: 10,
    lineHeight: 18,
  },
  code: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
    backgroundColor: '#f3f3f3',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  btn: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 160,
    alignItems: 'center',
  },
  btnDark: { backgroundColor: '#111', borderColor: '#111' },
  btnText: { color: '#111', fontWeight: '700' },
  btnTextLight: { color: '#fff', fontWeight: '700' },

  stage: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#fafafa',
  },

  // Art sizes — must match the tunables’ ROSIE_W/H, MUG_W/H, DROP_W/H
  rosie: {
    position: 'absolute',
    width: ROSIE_W,
    height: ROSIE_H,
  },
  mug: {
    position: 'absolute',
    width: MUG_W,
    height: MUG_H,
  },
  drop: {
    position: 'absolute',
    width: DROP_W,
    height: DROP_H,
  },
});
