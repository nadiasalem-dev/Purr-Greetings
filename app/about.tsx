// app/about.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/** =========================================================
 *  MASTER SWITCH: turn Easter-egg features on/off for testing
 *  ========================================================= */
const DEV_EGG_ENABLED = false; // <- flip to true when you want to test

type Fluff = {
  id: 'rosie' | 'ruffie' | 'skip' | 'zoey' | 'compie';
  name: string;
  species: string;
  gait: 'step' | 'bounce';
  src: any;
  lines: string[];
};

const F: Fluff[] = [
  {
    id: 'rosie',
    name: 'Rosie',
    species: 'Tuxedo Cat',
    gait: 'step',
    src: require('../assets/images/paradeRosie.png'),
    lines: [
      'First appearance: Intro (no mug—just nerves).',
      'Nickname: Chief Caffeine Officer.',
      'Tap to see the next star →',
    ],
  },
  {
    id: 'ruffie',
    name: 'Ruffles',
    species: 'Calico Cat',
    gait: 'step',
    src: require('../assets/images/paradeRuffie.png'),
    lines: [
      'First appearance: App icon.',
      'Nickname: Decaf Defender.',
      'Tap to see the next star →',
    ],
  },
  {
    id: 'skip',
    name: 'Skip',
    species: 'Pup',
    gait: 'step',
    src: require('../assets/images/paradeSkip.png'),
    lines: [
      'First appearance: Total-100 milestone.',
      'Nickname: Leash Wrangler.',
      'Tap to see the next star →',
    ],
  },
  {
    id: 'zoey',
    name: 'Zoey',
    species: 'Baby Zebra',
    gait: 'step',
    src: require('../assets/images/paradeZoey.png'),
    lines: [
      'First appearance: Hidden easter egg.',
      'Nickname: Hug Ambassador.',
      'Tap to see the next star →',
    ],
  },
  {
    id: 'compie',
    name: 'Compie',
    species: 'Laptop (Honorary Fluffball)',
    gait: 'bounce',
    src: require('../assets/images/paradeCompie.png'),
    lines: [
      'First appearance: Intro page.',
      'Nickname: Grumpy.',
      'Tap to see the next star →',
    ],
  },
];

// timings
const ENTER_MS = 900;
const HOLD_MS = 1600;
const EXIT_MS = 900;
const GAP_MS = 200;
const BUBBLE_FADE_MS = 250;
const BOUNCE_PX = 6;

// eggs
const EGG_KEY = 'about_pawwalk_egg_v1';
const SR_EGG_KEY = 'about_pawwalk_sr_egg_v1';

// audience
const PHOTOG_COUNT = 6;

// how far the stage sits above the very bottom (must match styles.stageWrap.bottom)
const STAGE_BOTTOM_PAD = 60;

export default function AboutFluffballs() {
  const { height: screenH, width: screenW } = Dimensions.get('window');

  // sizing (your tweaks)
  const AREA_H   = Math.max(Math.round(screenH * 0.30), 220);
  const STAGE_H  = Math.round(Math.min(64, Math.max(44, AREA_H * 0.22)));
  const IMG_SIZE = Math.round(Math.min(160, Math.max(92, screenH * 0.32)));
  const CHAR_BOTTOM_MULT = 1.8; // you liked 1.8
  const CHAR_BOTTOM = Math.round(STAGE_H * CHAR_BOTTOM_MULT);

  const AUDIENCE_H = Math.max(44, Math.min(60, Math.round(screenH * 0.08)));

  const [idx, setIdx] = useState(0);
  const [runKey, setRK] = useState(0);
  const current = F[idx];

  const [width, setWidth] = useState(0);
  const startX = useMemo(() => -Math.max(IMG_SIZE + 80, width * 0.55), [width, IMG_SIZE]);
  const endX   = useMemo(() =>  Math.max(IMG_SIZE + 80, width * 0.55), [width, IMG_SIZE]);

  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const bubble = useRef(new Animated.Value(0)).current;

  // prevent “peeking” after final pass
  const [showWalker, setShowWalker] = useState(true);

  // eggs
  const [eggUnlocked, setEggUnlocked] = useState(false);
  const [showEgg, setShowEgg] = useState(false);
  const eggBurst = useRef(new Animated.Value(0)).current;
  const [srEggUnlocked, setSrEggUnlocked] = useState(false);

  // audience flashes
  const flashVals = useRef([...Array(PHOTOG_COUNT)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    (async () => {
      try { setEggUnlocked((await AsyncStorage.getItem(EGG_KEY)) === '1'); } catch {}
      try { setSrEggUnlocked((await AsyncStorage.getItem(SR_EGG_KEY)) === '1'); } catch {}
    })();
  }, []);

  useEffect(() => {
    const loops = flashVals.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(400 + i * 250 + Math.floor(Math.random() * 600)),
          Animated.timing(v, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(600 + Math.floor(Math.random() * 1200)),
        ])
      )
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop?.());
  }, [flashVals]);

  // walker animation
  useEffect(() => {
    if (!width) return;

    setShowWalker(true);
    x.setValue(startX);
    y.setValue(0);
    bubble.setValue(0);

    const loop =
      current.gait === 'bounce'
        ? Animated.loop(
            Animated.sequence([
              Animated.timing(y, { toValue: -BOUNCE_PX, duration: 220, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(y, { toValue:  BOUNCE_PX, duration: 220, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
          )
        : Animated.loop(
            Animated.sequence([
              Animated.timing(y, { toValue: -3, duration: 160, easing: Easing.linear, useNativeDriver: true }),
              Animated.timing(y, { toValue:  0, duration: 160, easing: Easing.linear, useNativeDriver: true }),
            ])
          );
    loop.start();

    Animated.sequence([
      Animated.timing(x, { toValue: 0, duration: ENTER_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(bubble, { toValue: 1, duration: BUBBLE_FADE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(HOLD_MS),
      Animated.timing(bubble, { toValue: 0, duration: BUBBLE_FADE_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(x, { toValue: endX, duration: EXIT_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.delay(GAP_MS),
    ]).start(({ finished }) => {
      loop.stop?.();
      if (!finished) return;
      if (idx < F.length - 1) {
        setIdx(idx + 1);
      } else {
        setShowWalker(false); // hide last walker to prevent edge peek
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, runKey, width, startX, endX]);

  const replay = () => { setShowWalker(true); setIdx(0); setRK(k => k + 1); };
  const next   = () => { setShowWalker(true); if (idx < F.length - 1) setIdx(i => i + 1); };

  const bubbleStyle = {
    opacity: bubble,
    transform: [{ scale: bubble.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
  };

  /** ===========================
   *  EGG FUNCTIONS (all guarded)
   *  =========================== */
  const playEggBurst = async () => {
    if (!DEV_EGG_ENABLED) return;
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    setShowEgg(true);
    eggBurst.setValue(0);
    Animated.timing(eggBurst, {
      toValue: 1,
      duration: 1600, // slower, floaty
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setTimeout(() => setShowEgg(false), 800));
  };

  const unlockEgg = async () => {
    if (!DEV_EGG_ENABLED) return;
    if (eggUnlocked) return; // keep one-time for normal players
    setEggUnlocked(true);
    try { await AsyncStorage.setItem(EGG_KEY, '1'); } catch {}
    playEggBurst();
  };

  const triggerScreenReaderEgg = async (whoId: Fluff['id']) => {
    if (!DEV_EGG_ENABLED) return;
    if (!srEggUnlocked) {
      setSrEggUnlocked(true);
      try { await AsyncStorage.setItem(SR_EGG_KEY, '1'); } catch {}
    }
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft); } catch {}
    const line =
      whoId === 'compie' ? 'Compie whispers: I am not grumpy, I am compiling.'
    : whoId === 'rosie' ? 'Rosie whispers: Finest beans only, darling.'
    : whoId === 'ruffie'? 'Ruffie whispers: Decaf is a lifestyle.'
    : whoId === 'skip'  ? 'Skip whispers: Leashes optional; hugs mandatory!'
    :                     'Zoey whispers: Free hugs… unlimited.';
    try { Speech.stop(); Speech.speak(line, { language: 'en-US', pitch: 1.05, rate: 1.0 }); } catch {}
  };

  const resetEggs = async () => {
    if (!DEV_EGG_ENABLED) return;
    try { await AsyncStorage.multiRemove([EGG_KEY, SR_EGG_KEY]); } catch {}
    setEggUnlocked(false);
    setSrEggUnlocked(false);
    setShowEgg(false);
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    try { Speech.stop(); Speech.speak('Test: Easter eggs reset.', { language: 'en-US' }); } catch {}
  };

  // a11y strings
  const bubbleA11yLabel = [`${current.name}. ${current.species}.`, ...current.lines].join(' ');
  const bubbleHint = idx < F.length - 1 ? 'Shows the next fluffball on the runway.' : 'Runway complete.';

  // SR actions list (guards remove secret actions when eggs are off)
  const replayActions = DEV_EGG_ENABLED
    ? [{ name: 'activate' }, { name: 'magic', label: 'Surprise' }, { name: 'reset', label: 'Reset Surprise (testing)' }]
    : [{ name: 'activate' }];

  return (
    <View style={styles.page}>
      <Text
        style={styles.h1}
        accessibilityRole="header"
        onLongPress={DEV_EGG_ENABLED ? resetEggs : undefined}
        delayLongPress={1200}
      >
        About the Fluffballs
      </Text>

      {/* Quote bubble */}
      <Animated.View style={[styles.bubbleBlock, bubbleStyle]} accessibilityLiveRegion="polite">
        <View style={styles.bubbleCard}>
          <Pressable
            onPress={next}
            accessibilityRole="button"
            accessibilityLabel={bubbleA11yLabel}
            accessibilityHint={bubbleHint}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.bubbleName}>{current.name}</Text>
            <Text style={styles.bubbleLine}>{current.species}</Text>
            {current.lines.map((line, i) => (
              <Text
                key={i}
                style={i === current.lines.length - 1 ? styles.bubbleHint : styles.bubbleLine}
              >
                {line}
              </Text>
            ))}
          </Pressable>

          {/* tail */}
          <View style={styles.tailWrap} pointerEvents="none">
            <View style={styles.tailFill} />
          </View>
        </View>
      </Animated.View>

      {/* Middle fills the screen; no ScrollView */}
      <View style={styles.middle}>
        {/* Runway section */}
        <View
          style={styles.runwaySection}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
          {/* Character above stage (guarded by showWalker) */}
          {showWalker && (
            <Animated.View
              style={[
                styles.onStage,
                { bottom: CHAR_BOTTOM, transform: [{ translateX: x }, { translateY: y }] },
              ]}
              pointerEvents="none"
            >
              <Image
                source={current.src}
                style={{ width: IMG_SIZE, height: IMG_SIZE, resizeMode: 'contain' }}
                accessible={false}
              />
            </Animated.View>
          )}

          {/* Visual egg overlay — anchored above stage, wide, floats to sky (guarded by switch) */}
          {DEV_EGG_ENABLED && showEgg && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0, right: 0, top: 0, bottom: 0,
                opacity: eggBurst.interpolate({ inputRange: [0, 1], outputRange: [0.95, 0] }),
              }}
            >
              {/* soft glow anchored just above the stage top */}
              <View
                style={{
                  position: 'absolute',
                  left: '16%',
                  right: '16%',
                  bottom: STAGE_BOTTOM_PAD + STAGE_H + 6,
                  height: 86,
                  borderRadius: 43,
                  backgroundColor: '#fff',
                  opacity: 0.12,
                  shadowColor: '#ff66cc',
                  shadowOpacity: 0.85,
                  shadowRadius: 26,
                  shadowOffset: { width: 0, height: 0 },
                }}
              />

              {Array.from({ length: 28 }).map((_, i) => {
                // origin band across lower-middle area, anchored above stage
                const leftBase = screenW * 0.16 + (i / 27) * (screenW * 0.68);
                const jitter = (i % 2 ? -1 : 1) * (8 + (i % 5)); // +/-8..12px
                const left = leftBase + jitter;

                // start just above the stage top
                const bottomStart = STAGE_BOTTOM_PAD + STAGE_H + 10;

                // rise 70–80% of screen height
                const rise = screenH * (0.70 + (i % 5) * 0.025);

                // horizontal drift 10–20% of width
                const dir = i % 2 ? 1 : -1;
                const drift = screenW * (0.10 + (i % 6) * 0.02);

                const translateY = eggBurst.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -rise],
                });
                const translateX = eggBurst.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, dir * drift],
                });
                const scale = eggBurst.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1.2],
                });
                const rotate = eggBurst.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${dir * (24 + (i % 7) * 10)}deg`],
                });

                return (
                  <Animated.Text
                    key={i}
                    style={{
                      position: 'absolute',
                      left,
                      bottom: bottomStart,
                      transform: [{ translateX }, { translateY }, { scale }, { rotate }],
                      fontSize: 18,
                    }}
                  >
                    {['✨','💖','🌟','🎉','💫','⭐️','✨'][i % 7]}
                  </Animated.Text>
                );
              })}
            </Animated.View>
          )}

          {/* Stage (lifted so audience fits) */}
          <View style={[styles.stageWrap, { height: STAGE_H }]}>
            <View style={styles.stageGlow} />
            <View style={styles.stage} />
            <View style={styles.stageTopHighlight} />
          </View>

          {/* Audience pinned at bottom */}
          <View style={[styles.audienceAbs]}>
            <View style={[styles.audienceRow, { height: AUDIENCE_H }]}>
              {flashVals.map((v, i) => (
                <View key={i} style={[styles.photographer, { height: AUDIENCE_H }]}>
                  <View style={styles.phHead} />
                  <View style={styles.phBody} />
                  <Text style={styles.camera}>📸</Text>
                  <Animated.View
                    style={[
                      styles.flash,
                      { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] }) }] },
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Controls at bottom */}
        <View style={styles.controls}>
          <Pressable
            onPress={replay}
            onLongPress={DEV_EGG_ENABLED ? unlockEgg : undefined}
            delayLongPress={500}
            accessibilityActions={replayActions}
            onAccessibilityAction={(e) => {
              const a = e.nativeEvent.actionName;
              if (a === 'activate') return replay();
              if (!DEV_EGG_ENABLED) return; // guard SR-only actions
              if (a === 'magic')  return triggerScreenReaderEgg(current.id);
              if (a === 'reset')  return resetEggs();
            }}
            accessibilityRole="button"
            accessibilityLabel="Replay PawWalk runway"
            accessibilityHint="Restarts the fashion show from Rosie"
            style={[styles.cta, styles.ctaDark]}
          >
            <Text style={styles.ctaTextLight}>Replay PawWalk</Text>
          </Pressable>

          <Pressable
            onPress={next}
            accessibilityRole="button"
            accessibilityLabel="Next fluffball"
            accessibilityHint="Skips to the next character walking the runway"
            style={[styles.cta, styles.ctaLight]}
          >
            <Text style={styles.ctaTextDark}>Next</Text>
          </Pressable>
        </View>

        {/* Dev toolbar only when you explicitly enable eggs */}
        {__DEV__ && DEV_EGG_ENABLED && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Pressable onPress={resetEggs} style={[styles.cta, styles.ctaLight]}>
              <Text style={styles.ctaTextDark}>Reset Eggs</Text>
            </Pressable>
            <Pressable onPress={playEggBurst} style={[styles.cta, styles.ctaDark]}>
              <Text style={styles.ctaTextLight}>Play Egg</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  h1: {
    fontSize: 22,
    fontWeight: '800',
  },

  // Bubble block
  bubbleBlock: {
    marginTop: 8,
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bubbleCard: {
    position: 'relative',
    backgroundColor: '#fef2c0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: 560,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bubbleName: { fontSize: 18, fontWeight: '800', marginBottom: 2, color: '#222' },
  bubbleLine: { fontSize: 14, color: '#333', lineHeight: 18 },
  bubbleHint: { fontSize: 12, color: '#5a5a5a', marginTop: 6 },
  tailWrap: { position: 'absolute', left: 18, top: '100%', height: 10, width: 16 },
  tailFill: {
    position: 'absolute',
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#fef2c0',
  },

  // Middle fills remaining screen; no scroll
  middle: { flex: 1, justifyContent: 'flex-end' },

  // Runway section
  runwaySection: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
    overflow: 'hidden', // clip any stragglers offscreen
  },

  // Character container
  onStage: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
  },

  // Stage (lifted so audience/controls fit)
  stageWrap: {
    position: 'absolute',
    left: 0, right: 0,
    bottom: 60, // must match STAGE_BOTTOM_PAD
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  stageGlow: {
    position: 'absolute',
    left: 40, right: 40, top: -22,
    height: 28,
    borderRadius: 20,
    backgroundColor: '#000',
    opacity: 0.10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  stage: {
    height: '100%',
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#242424',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  stageTopHighlight: {
    position: 'absolute',
    left: 4, right: 4,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#3a3a3a',
    opacity: 0.6,
    top: 2,
  },

  // Audience
  audienceAbs: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
  },
  audienceRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    height: '100%',
  },
  photographer: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  phHead: {
    position: 'absolute',
    bottom: 28,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#222',
    opacity: 0.9,
  },
  phBody: {
    position: 'absolute',
    bottom: 12,
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#2a2a2a',
    opacity: 0.9,
  },
  camera: {
    position: 'absolute',
    bottom: 8,
    fontSize: 16,
  },
  flash: {
    position: 'absolute',
    bottom: 20,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  // Controls
  controls: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    paddingBottom: 12,
  },
  cta: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ctaDark: { backgroundColor: '#111', borderColor: '#111' },
  ctaLight:{ backgroundColor: '#fff', borderColor: '#ddd' },
  ctaTextLight: { color: '#fff', fontWeight: '700' },
  ctaTextDark:  { color: '#111', fontWeight: '700' },
});
