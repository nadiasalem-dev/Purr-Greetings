// app/milestonePage.tsx
import { Stack, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Button,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AnimatedRe from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { db } from './firebaseConfig';

// ===== Images already in your project =====
import rosieAnnoyed from '../assets/images/annoyed.png';
import caffeineMug from '../assets/images/caffeineMug.png';
import ruffieAPlus from '../assets/images/calicoAPlus.png';
import draggedToRehab from '../assets/images/draggedToRehab.png';
import rosieFurious from '../assets/images/furious.png';
import rosieGrumbling from '../assets/images/grumbling.png';
import home from '../assets/images/home.png';
import rosieNeutral from '../assets/images/neutral.png';
import rehab from '../assets/images/rehab.png';
import rosieRelieved from '../assets/images/relieved.png';
import rosieSlide from '../assets/images/rosieSlide.png';
import ruffieSchoolDay from '../assets/images/ruffieSchoolDay.png';
import ruffieLousyCoffee from '../assets/images/ruffieWithLousyCoffee.png';
import schoolSign from '../assets/images/school.png';

// ===== Split assets for Rosie CAF-drop =====
const rosieMouth = require('../assets/images/rosieMouth.png');
const cafMug = require('../assets/images/cafMug.png');
const dropImg = require('../assets/images/drop.png');

// ===== Reanimated SVG wrappers (used elsewhere) =====
const AnimatedPath = AnimatedRe.createAnimatedComponent(Path);

// ===== RN-Animated wrapper for <G> (used by the NEW steam overlay) =====
const AnimatedG_RN = Animated.createAnimatedComponent(G);

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

type Mood = 'neutral' | 'annoyed' | 'grumbling' | 'furious' | 'relieved';
type Mug = {
  id: string;
  y: Animated.Value;
  x: number;
  spin: Animated.Value;
  staticRotation: number;
};

/* ------------------------------------------------------------
   Rosie CAF drop (good-1)
------------------------------------------------------------ */
function RosieCAFDrop({
  onDone,
  stageTop = 140,
  stageLeft = Math.round(screenWidth * 0.32),
  imgW = 180,
  imgH = 180,
  MOUTH_OFFSET_X = 50,
  MOUTH_OFFSET_Y = 108,
  mugLeftAdjust = -16,
  mugTopAdjust = -78,
  lingerMs = 1200,
}: {
  onDone?: () => void;
  stageTop?: number;
  stageLeft?: number;
  imgW?: number; imgH?: number;
  MOUTH_OFFSET_X?: number; MOUTH_OFFSET_Y?: number;
  mugLeftAdjust?: number; mugTopAdjust?: number;
  lingerMs?: number;
}) {
  const rosieY = useRef(new Animated.Value(stageTop)).current;
  const rosieX = useRef(new Animated.Value(stageLeft)).current;
  const rosieScale = useRef(new Animated.Value(1)).current;
  const rosieOpacity = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(true);

  const mouthAbsX = stageLeft + MOUTH_OFFSET_X;
  const mouthAbsY = stageTop + (imgH - MOUTH_OFFSET_Y);

  const mugX = mouthAbsX + mugLeftAdjust;
  const mugY = mouthAbsY + mugTopAdjust;

  const dropX = useRef(new Animated.Value(mugX)).current;
  const dropY = useRef(new Animated.Value(mugY)).current;
  const dropScale = useRef(new Animated.Value(0.95)).current;
  const dropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dropX.setValue(mugX);
    dropY.setValue(mugY);
    dropScale.setValue(0.95);
    dropOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(dropOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(dropY, {
        toValue: mouthAbsY - 2,
        duration: 740,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(dropScale, { toValue: 1, duration: 740, useNativeDriver: true }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(dropOpacity, { toValue: 0, delay: 80, duration: 260, useNativeDriver: true }),
        Animated.timing(rosieScale, { toValue: 1.08, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(rosieY, { toValue: stageTop - 10, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start(() => {
        Animated.parallel([
          Animated.timing(rosieScale, { toValue: 1.0, duration: 200, useNativeDriver: true }),
          Animated.timing(rosieY, { toValue: stageTop, duration: 200, useNativeDriver: true }),
        ]).start(() => {
          setTimeout(() => {
            Animated.timing(rosieOpacity, { toValue: 0, duration: 400, useNativeDriver: true })
              .start(() => { setVisible(false); onDone?.(); });
          }, lingerMs);
        });
      });
    });
  }, [mugX, mugY, mouthAbsX, mouthAbsY, stageTop, lingerMs]);

  if (!visible) return null;

  return (
    <>
      {/* Mug */}
      <View pointerEvents="none" style={{ position: 'absolute', left: mugX, top: mugY, zIndex: 50 }}>
        <Image source={cafMug} style={{ width: 36, height: 36, resizeMode: 'contain' }} />
      </View>

      {/* Drop */}
      <View pointerEvents="none" style={{ position: 'absolute', zIndex: 51 }}>
        <Animated.Image
          source={dropImg}
          style={{
            transform: [{ translateX: dropX }, { translateY: dropY }, { scale: dropScale }],
            width: 16,
            height: 16,
            opacity: dropOpacity,
          }}
        />
      </View>

      {/* Rosie */}
      <View pointerEvents="none" style={{ position: 'absolute', left: stageLeft, top: stageTop, zIndex: 40 }}>
        <Animated.Image
          source={rosieMouth}
          style={{
            width: imgW,
            height: imgH,
            transform: [{ scale: rosieScale }],
            opacity: rosieOpacity,
            resizeMode: 'contain',
          }}
        />
      </View>
    </>
  );
}

/* ------------------------------------------------------------
   Ruffie steam overlay (lousy-1) — **RN Animated version**
   - No Reanimated worklets on SVG; only translateY + opacity
   - Eliminates release/TestFlight crash on some iOS devices
------------------------------------------------------------ */
function RuffieSteamOverlay({
  originX, originY, height = 60, width = 64, durationMs = 3600, onDone,
}: {
  originX: number; originY: number;
  height?: number; width?: number; durationMs?: number;
  onDone?: () => void;
}) {
  const W = Dimensions.get('window').width;
  const H = Dimensions.get('window').height;

  const xoff = [-width * 0.32, -width * 0.18, -width * 0.05, width * 0.05, width * 0.18, width * 0.32];
  const delay = [0, 120, 240, 360, 480, 600];

  const makePathStatic = (x0: number, y0: number, seed: number) => {
    const steps = 10;
    let d = `M ${x0} ${y0}`;
    for (let i = 1; i <= steps; i++) {
      const yy = y0 - (height * (i / steps));
      const amp = 6 + ((seed * 13) % 5);
      const freq = 0.18 + ((seed * 7) % 10) / 100;
      const xx = x0 + Math.sin((i + seed) * freq) * amp;
      d += ` L ${xx.toFixed(2)} ${yy.toFixed(2)}`;
    }
    return d;
  };

  const rises = useRef(delay.map(() => new Animated.Value(0))).current;
  const opacs = useRef(delay.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const stops: Array<() => void> = [];

    delay.forEach((del, i) => {
      const rise = rises[i];
      const op = opacs[i];

      const riseLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(del),
          Animated.timing(rise, { toValue: -height - 30, duration: durationMs, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
          Animated.timing(rise, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        { iterations: -1 }
      );

      const opLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(del),
          Animated.timing(op, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(op, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(op, { toValue: 0, duration: 900, useNativeDriver: true }),
          Animated.timing(op, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        { iterations: -1 }
      );

      riseLoop.start();
      opLoop.start();
      stops.push(() => { riseLoop.stop(); opLoop.stop(); });
    });

    const id = setTimeout(() => onDone?.(), durationMs + 800);
    return () => { stops.forEach(fn => fn()); clearTimeout(id); };
  }, [durationMs, height, onDone, rises, opacs, delay]);

  return (
    <Svg pointerEvents="none" width={W} height={H} style={StyleSheet.absoluteFill}>
      {xoff.map((xo, i) => {
        const d = makePathStatic(originX + xo, originY, i + 1);
        return (
          <AnimatedG_RN
            key={i}
            // Animate SVG props directly (react-native-svg supports these on <G>)
            // TypeScript doesn’t know Animated is allowed here, so we cast once.
            opacity={opacs[i] as unknown as number}
            translateY={rises[i] as unknown as number}
          >
            <Path d={d} stroke="#ffffff" strokeOpacity={0.9} strokeWidth={3} fill="none" />
            <Path d={d} stroke="#d0e8ff" strokeOpacity={0.35} strokeWidth={7} fill="none" />
          </AnimatedG_RN>
        );
      })}
    </Svg>

  );
}

/* ------------------------------------------------------------ */

export default function MilestonePage() {
  const router = useRouter();
  const [currentMessage, setCurrentMessage] = useState('Loading...');
  const [milestonesQueue, setMilestonesQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dev, setDev] = useState(false);
  const [mugsReady, setMugsReady] = useState(false);
  const [showRosieSlide, setShowRosieSlide] = useState(false);
  const [showRosieSweep, setShowRosieSweep] = useState(false);
  const [showMugStorm, setShowMugStorm] = useState(false);
  const [showRosieQuote, setShowRosieQuote] = useState(false);

  // NEW overlays
  const [showRosieCAF, setShowRosieCAF] = useState(false);
  const [showRuffieSteam, setShowRuffieSteam] = useState(false);

  // Ruffie walk
  const ruffieX = useRef(new Animated.Value(screenWidth)).current;
  const [showRuffieSlide, setShowRuffieSlide] = useState(false);
  const [showRuffieSlides, setShowRuffieSlides] = useState(false);
  const [showSchoolSign, setShowSchoolSign] = useState(false);
  const [showHome, setShowHome] = useState(false);

  // Compie eye roll
  const [showCompie, setShowCompie] = useState(false);
  const [showCompieQuote, setShowCompieQuote] = useState(false);
  const compieOpacity = useRef(new Animated.Value(1)).current;
  const leftEyeX = useRef(new Animated.Value(0)).current;
  const leftEyeY = useRef(new Animated.Value(0)).current;
  const rightEyeX = useRef(new Animated.Value(0)).current;
  const rightEyeY = useRef(new Animated.Value(0)).current;

  // Rehab
  const rehabX = useRef(new Animated.Value(-120)).current;
  const [showRehabSign, setShowRehabSign] = useState(false);
  const [showDragToRehab, setShowDragToRehab] = useState(false);
  const [showRosieRehabQuote, setShowRosieRehabQuote] = useState(false);

  // Sweep
  const rosieSweepX = useRef(new Animated.Value(0)).current;
  const rosieSweepY = useRef(new Animated.Value(0)).current;
  const rosieLastX = useRef(0);
  const [rosieFacingLeft, setRosieFacingLeft] = useState(false);
  const [rosieMood, setRosieMood] = useState<Mood>('neutral');
  const mugPositions = useRef<{ left: number; bottom: number }[]>([]);
  const [visibleMugs, setVisibleMugs] = useState(Array(100).fill(true));
  const [remainingMugs, setRemainingMugs] = useState(100);

  const getRosieSweepImage = () => {
    switch (rosieMood) {
      case 'annoyed': return rosieAnnoyed;
      case 'grumbling': return rosieGrumbling;
      case 'furious': return rosieFurious;
      case 'relieved': return rosieRelieved;
      default: return rosieNeutral;
    }
  };
  const getRosieMoodQuote = () => {
    switch (rosieMood) {
      case 'neutral': return 'Just doing my job...';
      case 'annoyed': return 'Ugh. Really?';
      case 'grumbling': return '...this is so dumb.';
      case 'furious': return 'WHY do I live here?!';
      case 'relieved': return 'Finally. Peace.';
      default: return '';
    }
  };

  const moveRosieToMug = (index: number) => {
    const target = mugPositions.current[index];
    if (!target) return;
    const isLeft = target.left < rosieLastX.current;
    setRosieFacingLeft(isLeft);

    Animated.parallel([
      Animated.timing(rosieSweepX, { toValue: target.left, duration: 500, useNativeDriver: true }),
      Animated.timing(rosieSweepY, { toValue: target.bottom, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      rosieLastX.current = target.left;
      setVisibleMugs((prev) => { const u = [...prev]; u[index] = false; return u; });
      setRemainingMugs((prev) => prev - 1);

      const mugsLeft = visibleMugs.filter(Boolean).length - 1;
      if (mugsLeft > 75) setRosieMood('neutral');
      else if (mugsLeft > 50) setRosieMood('annoyed');
      else if (mugsLeft > 25) setRosieMood('grumbling');
      else if (mugsLeft > 0) setRosieMood('furious');
      else { setRosieMood('relieved'); setShowRosieSweep(false); }

      if (index + 1 < mugPositions.current.length) setTimeout(() => moveRosieToMug(index + 1), 200);
    });
  };

  const clearMilestoneVisuals = () => {
    setShowRosieSlide(false);
    setShowRosieSweep(false);
    setShowMugStorm(false);
    setShowRosieQuote(false);
    setShowCompie(false);
    setShowCompieQuote(false);
    setShowRuffieSlide(false);
    setShowRuffieSlides(false);
    setShowSchoolSign(false);
    setShowHome(false);
    setShowRehabSign(false);
    setShowDragToRehab(false);
    setShowRosieRehabQuote(false);
    setVisibleMugs(Array(100).fill(true));
    setRemainingMugs(100);
    setShowRosieCAF(false);
    setShowRuffieSteam(false);
  };

  const rosieXSlide = useRef(new Animated.Value(-100)).current;
  const slideCharacter = (xValue: Animated.Value, duration: number, direction: 'right' | 'left', onFinish?: () => void) => {
    const startX = direction === 'right' ? -150 : screenWidth + 150;
    const endX = direction === 'right' ? screenWidth + 100 : -120;
    xValue.setValue(startX);
    Animated.timing(xValue, { toValue: endX, duration, useNativeDriver: true }).start(() => onFinish?.());
  };

  const mugFall = () => {
    const list: Mug[] = [];
    for (let i = 0; i < 100; i++) {
      list.push({
        id: `mug-${i}`,
        y: new Animated.Value(-100),
        x: Math.floor(Math.random() * (screenWidth - 40)),
        spin: new Animated.Value(0),
        staticRotation: Math.floor(Math.random() * 90 - 45),
      });
    }
    setMugsReady(true);
    setShowMugStorm(true);
    setShowRosieQuote(true);

    let i = 0;
    const tick = setInterval(() => {
      const batch = list.slice(i, i + 10);
      if (!batch.length) {
        clearInterval(tick);
        setTimeout(() => setShowRosieQuote(false), 2000);
        setTimeout(() => setShowMugStorm(false), 2000);
        return;
      }
      batch.forEach((m) => {
        Animated.parallel([
          Animated.timing(m.y, { toValue: screenHeight + 100, duration: 2500 + Math.random() * 1000, useNativeDriver: true }),
          Animated.timing(m.spin, { toValue: 1, duration: 3000, useNativeDriver: true }),
        ]).start();
      });
      i += 10;
    }, 300);
    mugsRef.current = list;
  };
  const mugsRef = useRef<Mug[]>([]);

  // ====== MILESTONES ======
  const milestoneDefs: Record<string, any> = {
    // Good
    'good-1': {
      message: '🎉 Rosie drinks her first good coffee!',
      animate: () => { clearMilestoneVisuals(); setShowRosieCAF(true); },
    },
    'good-25': {
      message: '🌧️ 25 good mugs — Mug storm!',
      animate: () => { clearMilestoneVisuals(); mugFall(); },
    },
    'good-50': {
      message: '🧹 50 good mugs — Rosie sweeps!',
      animate: () => {
        clearMilestoneVisuals();
        const positions = Array.from({ length: 100 }, () => ({
          left: Math.floor(Math.random() * (screenWidth - 30)),
          bottom: Math.floor(Math.random() * 120) + 30,
        }));
        mugPositions.current = positions;
        setVisibleMugs(Array(100).fill(true));
        setRemainingMugs(100);
        setShowRosieSweep(true);
        setTimeout(() => moveRosieToMug(0), 150);
      },
    },

    // Lousy
    'lousy-1': {
      message: '😬 Ruffie tries a lousy one (hot!)',
      animate: () => { clearMilestoneVisuals(); setShowRuffieSteam(true); },
    },
    'lousy-25': {
      message: '🏫 25 lousy mugs — Ruffie goes to school.',
      animate: () => {
        clearMilestoneVisuals();
        ruffieX.setValue(-200);
        setShowRuffieSlide(true);
        setShowSchoolSign(true);
        slideCharacter(ruffieX, 9000, 'right', () => { setShowRuffieSlide(false); setShowSchoolSign(false); });
      },
    },
    'lousy-50': {
      message: '🏠 50 lousy mugs — Ruffie walks home proudly.',
      animate: () => {
        clearMilestoneVisuals();
        ruffieX.setValue(screenWidth + 200);
        setShowRuffieSlides(true);
        setShowSchoolSign(true);
        setShowHome(true);
        slideCharacter(ruffieX, 3000, 'left', () => { setShowRuffieSlides(false); setShowHome(false); setShowSchoolSign(false); });
      },
    },

    // Total
    'total-25': {
      message: '🎉 Total 25 — Rosie slides in!',
      animate: () => {
        clearMilestoneVisuals();
        setShowRosieSlide(true);
        rosieXSlide.setValue(-100);
        Animated.timing(rosieXSlide, { toValue: screenWidth + 100, duration: 3000, useNativeDriver: true })
          .start(() => setShowRosieSlide(false));
      },
    },
    'total-50': {
      message: '😑 Total 50 — Compie eye roll.',
      animate: () => {
        clearMilestoneVisuals();
        setShowRosieSlide(true);
        rosieXSlide.setValue(-100);
        Animated.timing(rosieXSlide, { toValue: screenWidth + 100, duration: 3000, useNativeDriver: true })
          .start(() => setShowRosieSlide(false));

        setShowCompie(true);
        setShowCompieQuote(true);
        setTimeout(() => {
          setShowCompieQuote(false);
          Animated.parallel([
            Animated.timing(leftEyeX, { toValue: 8, duration: 500, useNativeDriver: true }),
            Animated.timing(leftEyeY, { toValue: -5, duration: 500, useNativeDriver: true }),
            Animated.timing(rightEyeX, { toValue: 8, duration: 500, useNativeDriver: true }),
            Animated.timing(rightEyeY, { toValue: -5, duration: 500, useNativeDriver: true }),
          ]).start(() => {
            Animated.parallel([
              Animated.timing(compieOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
              Animated.timing(leftEyeX, { toValue: 0, duration: 1, useNativeDriver: true }),
              Animated.timing(leftEyeY, { toValue: 0, duration: 1, useNativeDriver: true }),
              Animated.timing(rightEyeX, { toValue: 0, duration: 1, useNativeDriver: true }),
              Animated.timing(rightEyeY, { toValue: 0, duration: 1, useNativeDriver: true }),
            ]).start(() => setShowCompie(false));
          });
        }, 2600);
      },
    },
    'total-100': {
      message: '🌀 Total 100 — Rosie dragged to rehab.',
      animate: () => {
        clearMilestoneVisuals();
        rehabX.setValue(-200);
        setShowRehabSign(true);
        setShowDragToRehab(true);
        slideCharacter(rehabX, 7000, 'right', () => {
          setShowDragToRehab(false);
          setShowRehabSign(false);
          setShowRosieRehabQuote(true);
          setTimeout(() => setShowRosieRehabQuote(false), 4000);
        });
      },
    },
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    const next = milestonesQueue[nextIndex];
    if (next) {
      clearMilestoneVisuals();
      setCurrentIndex(nextIndex);
      setCurrentMessage(next.message);
      next.animate?.();
    }
  };

  useEffect(() => {
    const loadMilestones = async () => {
      try {
        const goodSnap = await getDoc(doc(db, 'milestones', 'goodCount'));
        const lousySnap = await getDoc(doc(db, 'milestones', 'lousyCount'));
        const good = goodSnap.exists() ? goodSnap.data().count || 0 : 0;
        const lousy = lousySnap.exists() ? lousySnap.data().count || 0 : 0;
        const t = good + lousy;

        const keys = [`good-${good}`, `lousy-${lousy}`, `total-${t}`];
        const triggered = keys.map((k) => milestoneDefs[k]).filter(Boolean);

        if (triggered.length) {
          setMilestonesQueue(triggered);
          setCurrentIndex(0);
          setCurrentMessage(triggered[0].message);
          triggered[0].animate?.();
        } else {
          setCurrentMessage('No milestone triggered.');
        }
      } catch (e) {
        console.error('Failed to load milestone data:', e);
        setCurrentMessage('Error loading milestones.');
      }
    };
    loadMilestones();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.header}>Milestone Sequence</Text>
      <Text style={styles.message}>{currentMessage}</Text>

      {/* Good-1 */}
      {showRosieCAF && (
        <RosieCAFDrop
          stageTop={140}
          stageLeft={Math.round(screenWidth * 0.32)}
          MOUTH_OFFSET_X={50}
          MOUTH_OFFSET_Y={108}
          mugLeftAdjust={-16}
          mugTopAdjust={-200}
          lingerMs={1400}
        />
      )}

      {/* Lousy-1 — NEW RN-Animated steam */}
      {showRuffieSteam && (
        <>
          <Image
            source={ruffieLousyCoffee}
            style={{ position: 'absolute', left: Math.round(screenWidth * 0.26), top: Math.round(screenHeight * 0.48), width: 220, height: 220, resizeMode: 'contain' }}
          />
          <RuffieSteamOverlay
            originX={Math.round(screenWidth * 0.26) + 52}
            originY={Math.round(screenHeight * 0.48) + 150}
            height={60}
            width={64}
            onDone={() => setShowRuffieSteam(false)}
          />
        </>
      )}

      {/* Rosie slide */}
      {showRosieSlide && (
        <Animated.Image
          source={rosieSlide}
          style={{ width: 100, height: 100, position: 'absolute', bottom: 50, transform: [{ translateX: rosieXSlide }] }}
        />
      )}

      {/* Mug storm */}
      {showRosieQuote && (
        <View style={styles.quoteBubble}>
          <Text style={styles.quoteText}>"It's raining mugs, hallelujah!"</Text>
        </View>
      )}
      {mugsReady &&
        mugsRef.current.map((mug) => {
          const spin = mug.spin.interpolate({ inputRange: [0, 1], outputRange: [`${mug.staticRotation}deg`, `${360 + mug.staticRotation}deg`] });
          return (
            <Animated.Image
              key={mug.id}
              source={caffeineMug}
              style={{ width: 30, height: 30, position: 'absolute', left: mug.x, transform: [{ translateY: mug.y }, { rotate: spin }] }}
            />
          );
        })}

      {/* Rosie sweeping */}
      {showRosieSweep && (
        <>
          {visibleMugs.map((isVisible, index) => {
            if (!isVisible) return null;
            const pos = mugPositions.current[index];
            return <Image key={`sweep-mug-${index}`} source={caffeineMug} style={{ width: 30, height: 30, position: 'absolute', left: pos.left, bottom: pos.bottom }} />;
          })}
          <Animated.Image
            source={getRosieSweepImage()}
            style={{ width: 100, height: 100, position: 'absolute', bottom: 50, transform: [{ translateX: rosieSweepX }, { translateY: rosieSweepY }, { scaleX: rosieFacingLeft ? -1 : 1 }] }}
          />
          <View style={styles.quoteBubble}>
            <Text style={styles.quoteText}>{getRosieMoodQuote()}</Text>
            <Text style={styles.quoteText}>{remainingMugs} mugs left.</Text>
          </View>
        </>
      )}

      {/* Ruffie walks + signs */}
      {showRuffieSlide && (
        <Animated.Image source={ruffieSchoolDay} style={[styles.ruffieImage, { transform: [{ translateX: ruffieX }, { scaleX: -1 }] }]} />
      )}
      {showRuffieSlides && (
        <Animated.Image source={ruffieAPlus} style={[styles.ruffieImage, { transform: [{ translateX: ruffieX }, { scaleX: -1 }] }]} />
      )}
      {showSchoolSign && <Image source={schoolSign} style={styles.schoolSign} />}
      {showHome && <Image source={home} style={styles.homeSign} />}

      {/* Rehab */}
      {showRehabSign && <Image source={rehab} style={styles.rehabSign} />}
      {showDragToRehab && (
        <Animated.Image source={draggedToRehab} style={{ width: 120, height: 100, position: 'absolute', bottom: 50, transform: [{ translateX: rehabX }] }} />
      )}
      {showRosieRehabQuote && (
        <View style={styles.quoteBubble}><Text style={styles.quoteText}>“I can quit whenever I want.”</Text></View>
      )}

      {/* NEXT */}
      <View style={{ marginTop: 40, alignItems: 'center' }}>
        {milestonesQueue.length > 1 && currentIndex < milestonesQueue.length - 1 && (
          <View style={{ width: 240, marginBottom: 16 }}><Button title="Next" onPress={handleNext} /></View>
        )}
        <Text style={{ textAlign: 'center', marginBottom: 16 }}>What would you like to do?</Text>

        <View style={{ width: 240, marginBottom: 10 }}>
          <Button
            title="🔁 Replay Milestones"
            onPress={() => {
              if (!milestonesQueue.length) return;
              setCurrentIndex(0);
              setCurrentMessage(milestonesQueue[0].message);
              milestonesQueue[0].animate?.();
            }}
          />
        </View>
        <View style={{ width: 240, marginBottom: 10 }}>
          <Button title="☕ Go to Coffee Mode" onPress={() => router.replace({ pathname: '/', params: { coffee: 'true' } })} />
        </View>
        <View style={{ width: 240, marginBottom: 10 }}>
          <Button title="❌ Go to No Coffee Mode" onPress={() => router.replace({ pathname: '/', params: { coffee: 'false' } })} />
        </View>
        <View style={{ width: 240 }}>
          <Button title="👋 Go to Greetings Page" onPress={() => router.push('/greetings')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 22, marginTop: 16, textAlign: 'center' },
  message: { fontSize: 18, marginTop: 12, textAlign: 'center' },
  quoteBubble: {
    position: 'absolute', top: 20, left: 20,
    backgroundColor: '#fef2c0', borderRadius: 12, padding: 10, maxWidth: '80%',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: '#333' },
  eyeDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#000', bottom: screenHeight / 2 + 135 },
  compie: { width: 100, height: 100, position: 'absolute', bottom: screenHeight / 2 + 80, left: screenWidth / 2 - 50 },
  ruffieImage: { width: 100, height: 100, position: 'absolute', bottom: 50 },
  schoolSign: { position: 'absolute', bottom: 50, right: 10, width: 100, height: 100 },
  homeSign: { position: 'absolute', bottom: 50, left: 10, width: 100, height: 100 },
  rehabSign: { position: 'absolute', bottom: 50, right: 10, width: 100, height: 100 },
});
