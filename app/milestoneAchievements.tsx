// app/milestoneAchievements.tsx
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Svg, { G, Path } from 'react-native-svg';

// --- Milestone data (Firestore) ---
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// --- Art you already have ---
import rosieAnnoyed from '../assets/images/annoyed.png';
import caffeineMug from '../assets/images/caffeineMug.png';
import ruffieAPlus from '../assets/images/calicoAPlus.png';
import compie from '../assets/images/compie1.png';
import draggedToRehab from '../assets/images/draggedToRehab.png';
import rosieFurious from '../assets/images/furious.png';
import rosieGrumbling from '../assets/images/grumbling.png';
import homeSign from '../assets/images/home.png';
import rosieNeutral from '../assets/images/neutral.png';
import rehabSign from '../assets/images/rehab.png';
import rosieRelieved from '../assets/images/relieved.png';
import rosieSlide from '../assets/images/rosieSlide.png';
import ruffieSchoolDay from '../assets/images/ruffieSchoolDay.png';
import ruffieLousyCoffee from '../assets/images/ruffieWithLousyCoffee.png';
import schoolSign from '../assets/images/school.png';

// --- Split assets for Rosie CAF drop ---
const rosieMouth = require('../assets/images/rosieMouth.png');
const cafMug = require('../assets/images/cafMug.png');
const dropImg = require('../assets/images/drop.png');

// RN-Animated wrapper for <G> (steam overlay)
const AnimatedG_RN = Animated.createAnimatedComponent(G);

const { width: W, height: H } = Dimensions.get('window');

// ======================================================
// Rosie: CAF drop overlay (mouth + mug + falling drop)
// ======================================================
function RosieCAFDrop({
  onDone,
  stageTop = 140,
  stageLeft = Math.round(W * 0.32),
  imgW = 180,
  imgH = 180,
  MOUTH_OFFSET_X = 50,
  MOUTH_OFFSET_Y = 108,
  mugLeftAdjust = -16,
  mugTopAdjust = -200,
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
  const [visible, setVisible] = useState(true);

  const mouthAbsX = stageLeft + MOUTH_OFFSET_X;
  const mouthAbsY = stageTop + (imgH - MOUTH_OFFSET_Y);

  const mugX = mouthAbsX + mugLeftAdjust;
  const mugY = mouthAbsY + mugTopAdjust;

  const dropX = useRef(new Animated.Value(mouthAbsX - 8 + mugLeftAdjust)).current;
  const dropY = useRef(new Animated.Value(mugY + 8)).current;
  const dropScale = useRef(new Animated.Value(0.95)).current;
  const dropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(dropOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(dropY, {
        toValue: mouthAbsY - 2,
        duration: 740,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(dropScale, { toValue: 1, duration: 740, useNativeDriver: true }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(dropOpacity, { toValue: 0, delay: 60, duration: 260, useNativeDriver: true }),
        Animated.timing(rosieScale, { toValue: 1.08, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(rosieY, { toValue: stageTop - 10, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start(() => {
        Animated.parallel([
          Animated.timing(rosieScale, { toValue: 1.0, duration: 200, useNativeDriver: true }),
          Animated.timing(rosieY, { toValue: stageTop, duration: 200, useNativeDriver: true }),
        ]).start(() => {
          setTimeout(() => { setVisible(false); onDone?.(); }, lingerMs);
        });
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <>
      <Image
        source={cafMug}
        style={{ position: 'absolute', left: mugX, top: mugY, width: 36, height: 36, resizeMode: 'contain' }}
        accessible={false}
      />
      <Animated.Image
        source={dropImg}
        style={{
          position: 'absolute',
          left: 0,
          transform: [{ translateX: dropX }, { translateY: dropY }, { scale: dropScale }],
          width: 16, height: 16,
          opacity: dropOpacity,
        }}
        accessibilityLabel="Coffee drop"
      />
      <Animated.Image
        source={rosieMouth}
        style={{ position: 'absolute', left: rosieX, top: rosieY, width: imgW, height: imgH, transform: [{ scale: rosieScale }], resizeMode: 'contain' }}
        accessibilityLabel="Rosie takes a sip"
      />
    </>
  );
}

/* ======================================================
   Ruffie steam overlay — RN Animated (no Reanimated worklets)
====================================================== */
function RuffieSteamOverlay({
  originX,
  originY,
  height = 60,
  width = 64,
  durationMs = 3600,
  onDone,
}: {
  originX: number; originY: number;
  height?: number; width?: number; durationMs?: number;
  onDone?: () => void;
}) {
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

// ======================================================
// Main Achievements Screen
// ======================================================
type Mood = 'neutral' | 'annoyed' | 'grumbling' | 'furious' | 'relieved';
type Card = { id: string; label: string; image: any; unlocked: boolean };

export default function MilestoneAchievements() {
  const [good, setGood] = useState(0);
  const [lousy, setLousy] = useState(0);
  const total = good + lousy;

  const [showRosieCAF, setShowRosieCAF] = useState(false);
  const [showRuffieSteam, setShowRuffieSteam] = useState(false);

  const [showRosieSlide, setShowRosieSlide] = useState(false);
  const rosieSlideX = useRef(new Animated.Value(-100)).current;

  const [showMugStorm, setShowMugStorm] = useState(false);
  const [stormDrops, setStormDrops] = useState<Array<{ x: number; animY: Animated.Value; rotate: Animated.Value; angle: number }>>([]);

  const [showRosieSweep, setShowRosieSweep] = useState(false);
  const rosieSweepX = useRef(new Animated.Value(0)).current;
  const rosieSweepY = useRef(new Animated.Value(0)).current;
  const [rosieMood, setRosieMood] = useState<Mood>('neutral');
  const [rosieFacingLeft, setRosieFacingLeft] = useState(false);
  const [remainingMugs, setRemainingMugs] = useState(100);
  const mugPositions = useRef<{ left: number; bottom: number }[]>([]);
  const [visibleMugs, setVisibleMugs] = useState<boolean[]>(Array(100).fill(true));
  const rosieLastX = useRef(0);

  const [showRuffieWalk, setShowRuffieWalk] = useState(false);
  const ruffieX = useRef(new Animated.Value(0)).current;
  const [ruffieSprite, setRuffieSprite] = useState<any>(null);
  const [ruffieScaleX, setRuffieScaleX] = useState(1);

  const [showRehab, setShowRehab] = useState(false);
  const rehabX = useRef(new Animated.Value(-200)).current;
  const [showDragged, setShowDragged] = useState(false);

  const [showHelp, setShowHelp] = useState(false);


  const getRosieSweepImage = () => {
    switch (rosieMood) {
      case 'annoyed': return rosieAnnoyed;
      case 'grumbling': return rosieGrumbling;
      case 'furious': return rosieFurious;
      case 'relieved': return rosieRelieved;
      default: return rosieNeutral;
    }
  };
  const getRosieQuote = () => {
    switch (rosieMood) {
      case 'neutral': return 'Just doing my job...';
      case 'annoyed': return 'Ugh. Really?';
      case 'grumbling': return '...this is so dumb.';
      case 'furious': return 'WHY do I live here?!';
      case 'relieved': return 'Finally. Peace.';
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const goodSnap = await getDoc(doc(db, 'milestones', 'goodCount'));
        const lousySnap = await getDoc(doc(db, 'milestones', 'lousyCount'));
        const g = goodSnap.exists() ? goodSnap.data().count || 0 : 0;
        const l = lousySnap.exists() ? lousySnap.data().count || 0 : 0;
        setGood(g); setLousy(l);
      } catch { }
    })();
  }, []);

  const cards: Card[] = [
    { id: 'good-1', label: '☕ Rosie Drinks', image: rosieMouth, unlocked: good >= 1 },
    { id: 'good-25', label: '🌧️ Mug Storm', image: caffeineMug, unlocked: good >= 25 },
    { id: 'good-50', label: '🧹 Rosie Sweeps', image: rosieAnnoyed, unlocked: good >= 50 },

    { id: 'lousy-1', label: '😬 Hot Lousy Cup', image: ruffieLousyCoffee, unlocked: lousy >= 1 },
    { id: 'lousy-25', label: '🏫 To School', image: ruffieSchoolDay, unlocked: lousy >= 25 },
    { id: 'lousy-50', label: '🏠 Home Proud', image: ruffieAPlus, unlocked: lousy >= 50 },

    { id: 'total-25', label: '🎉 Rosie Slides', image: rosieSlide, unlocked: total >= 25 },
    { id: 'total-50', label: '😑 Compie Eye Roll', image: compie, unlocked: total >= 50 },
    { id: 'total-100', label: '🌀 Rehab Drag', image: draggedToRehab, unlocked: total >= 100 },
  ].filter(c => c.unlocked);

  const startRosieSlide = () => {
    setShowRosieSlide(true);
    rosieSlideX.setValue(-120);
    Animated.timing(rosieSlideX, { toValue: W + 120, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      .start(() => setShowRosieSlide(false));
  };

  const startMugStorm = () => {
    const N = 26;
    const drops = Array.from({ length: N }).map(() => ({
      x: Math.floor(Math.random() * (W - 40)) + 10,
      animY: new Animated.Value(-80 - Math.random() * 200),
      rotate: new Animated.Value(0),
      angle: 90 + Math.random() * 180,
    }));
    setStormDrops(drops);
    setShowMugStorm(true);
    Animated.stagger(60, drops.map((d, i) =>
      Animated.parallel([
        Animated.timing(d.animY, { toValue: H * 0.6, duration: 1400 + Math.random() * 800, delay: i * 60, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(d.rotate, { toValue: 1, duration: 1600 + Math.random() * 600, delay: i * 60, easing: Easing.linear, useNativeDriver: true }),
      ])
    )).start(() => setTimeout(() => setShowMugStorm(false), 600));
  };

  const moveRosieToMug = (i: number) => {
    const target = mugPositions.current[i];
    if (!target) return;
    const isLeft = target.left < (rosieLastX.current || 0);
    setRosieFacingLeft(isLeft);

    Animated.parallel([
      Animated.timing(rosieSweepX, { toValue: target.left, duration: 480, useNativeDriver: true }),
      Animated.timing(rosieSweepY, { toValue: target.bottom, duration: 480, useNativeDriver: true }),
    ]).start(() => {
      rosieLastX.current = target.left;
      setVisibleMugs(prev => { const next = [...prev]; next[i] = false; return next; });

      const left = remainingMugs - 1;
      setRemainingMugs(left);
      if (left > 75) setRosieMood('neutral');
      else if (left > 50) setRosieMood('annoyed');
      else if (left > 25) setRosieMood('grumbling');
      else if (left > 0) setRosieMood('furious');
      else { setRosieMood('relieved'); setShowRosieSweep(false); }

      if (i + 1 < mugPositions.current.length && left > 0) setTimeout(() => moveRosieToMug(i + 1), 160);
    });
  };

  const startRosieSweep = () => {
    const band = 120;
    mugPositions.current = Array.from({ length: 100 }).map(() => ({
      left: Math.floor(Math.random() * (W - 40)),
      bottom: Math.floor(Math.random() * band) + 30,
    }));
    setVisibleMugs(Array(100).fill(true));
    setRemainingMugs(100);
    setShowRosieSweep(true);
    rosieSweepX.setValue(0);
    rosieSweepY.setValue(0);
    setTimeout(() => moveRosieToMug(0), 300);
  };

  const startRuffieWalk = (dir: 'school' | 'home') => {
    setShowRuffieWalk(true);
    if (dir === 'school') {
      setRuffieSprite(ruffieSchoolDay);
      setRuffieScaleX(1);
      ruffieX.setValue(W + 140);
      Animated.timing(ruffieX, { toValue: -160, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
        .start(() => { setShowRuffieWalk(false); });
    } else {
      setRuffieSprite(ruffieAPlus);
      setRuffieScaleX(1);
      ruffieX.setValue(-160);
      Animated.timing(ruffieX, { toValue: W + 140, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
        .start(() => { setShowRuffieWalk(false); });
    }
  };

  const startRehabDrag = () => {
    setShowRehab(true);
    setShowDragged(true);
    rehabX.setValue(-200);
    Animated.timing(rehabX, { toValue: W + 160, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      .start(() => { setShowDragged(false); setShowRehab(false); });
  };

  const onCardPress = (id: string) => {
    setShowRosieCAF(false);
    setShowRuffieSteam(false);
    setShowRosieSlide(false);
    setShowMugStorm(false);
    setShowRosieSweep(false);
    setShowRuffieWalk(false);
    setShowRehab(false);
    setShowDragged(false);

    if (id === 'good-1') setShowRosieCAF(true);
    else if (id === 'good-25') startMugStorm();
    else if (id === 'good-50') startRosieSweep();
    else if (id === 'lousy-1') setShowRuffieSteam(true);
    else if (id === 'lousy-25') startRuffieWalk('school');
    else if (id === 'lousy-50') startRuffieWalk('home');
    else if (id === 'total-25') startRosieSlide();
    else if (id === 'total-50') startRosieSlide();
    else if (id === 'total-100') startRehabDrag();
  };

  return (
    <View style={styles.container}>
      {/* Help button */}
<View style={{ position: 'absolute', top: 20, right: 20, zIndex: 999 }}>
  <Text
    onPress={() => setShowHelp(true)}
    accessibilityRole="button"
    accessibilityLabel="How to use the Achievements page"
    style={{
      backgroundColor: '#222',
      color: 'white',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 12,
      fontWeight: '700',
      fontSize: 16,
    }}
  >
    ?
  </Text>
</View>

      <Stack.Screen options={{ headerShown: false }} />

      {/* Good-1 */}
      {showRosieCAF && (
        <RosieCAFDrop
          stageTop={140}
          stageLeft={Math.round(W * 0.32)}
          MOUTH_OFFSET_X={50}
          MOUTH_OFFSET_Y={108}
          mugLeftAdjust={-16}
          mugTopAdjust={-200}
          lingerMs={1200}
          onDone={() => setShowRosieCAF(false)}
        />
      )}

      {/* Lousy-1 — NEW RN-Animated steam */}
      {showRuffieSteam && (
        <>
          <Image
            source={ruffieLousyCoffee}
            style={{ position: 'absolute', left: Math.round(W * 0.26), top: Math.round(H * 0.48), width: 220, height: 220, resizeMode: 'contain' }}
            accessibilityLabel="Ruffie with a steaming mug"
          />
          <RuffieSteamOverlay
            originX={Math.round(W * 0.26) + 52}
            originY={Math.round(H * 0.48) + 150}
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
          style={{ width: 140, height: 140, position: 'absolute', bottom: 80, left: -120, transform: [{ translateX: rosieSlideX }] }}
          resizeMode="contain"
        />
      )}

      {/* Mug storm */}
      {showMugStorm && stormDrops.map((d, i) => {
        const rot = d.rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${d.angle}deg`] });
        return (
          <Animated.Image
            key={`drop-${i}`}
            source={caffeineMug}
            style={{ position: 'absolute', width: 34, height: 34, left: d.x, transform: [{ translateY: d.animY }, { rotate: rot }] }}
          />
        );
      })}

      {/* Rosie sweeping */}
      {showRosieSweep && (
        <>
          {visibleMugs.map((v, i) => {
            if (!v) return null;
            const p = mugPositions.current[i];
            return <Image key={i} source={caffeineMug} style={{ position: 'absolute', left: p.left, bottom: p.bottom, width: 30, height: 30 }} />;
          })}
          <Animated.Image
            source={getRosieSweepImage()}
            style={{ width: 100, height: 100, position: 'absolute', bottom: 50, transform: [{ translateX: rosieSweepX }, { translateY: rosieSweepY }, { scaleX: rosieFacingLeft ? -1 : 1 }] }}
            resizeMode="contain"
          />
          <View style={styles.quoteBubble}>
            <Text style={styles.quoteText}>{getRosieQuote()}</Text>
            <Text style={styles.quoteText}>{remainingMugs} mugs left.</Text>
          </View>
        </>
      )}

      {/* Ruffie walks + signs */}
      {showRuffieWalk && (
        <>
          <Image source={schoolSign} style={{ position: 'absolute', bottom: 90, left: 8, width: 100, height: 110, resizeMode: 'contain' }} />
          <Image source={homeSign} style={{ position: 'absolute', bottom: 90, right: 8, width: 100, height: 110, resizeMode: 'contain' }} />
          <Animated.Image
            source={ruffieSprite || ruffieSchoolDay}
            style={{ position: 'absolute', bottom: 60, left: 0, width: 140, height: 140, resizeMode: 'contain', transform: [{ translateX: ruffieX }, { scaleX: ruffieScaleX }] }}
          />
        </>
      )}

      {/* Rehab drag */}
      {showRehab && <Image source={rehabSign} style={{ position: 'absolute', bottom: 90, right: 8, width: 110, height: 110, resizeMode: 'contain' }} />}
      {showDragged && (
        <Animated.Image
          source={draggedToRehab}
          style={{ position: 'absolute', bottom: 60, left: -140, width: 160, height: 160, resizeMode: 'contain', transform: [{ translateX: rehabX }] }}
        />
      )}

      {/* Cards */}
      <ScrollView horizontal style={styles.cardBar} contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center' }}>
        {cards.length === 0 ? (
          <Text style={{ paddingHorizontal: 12, color: '#666' }}>No milestones unlocked yet.</Text>
        ) : (
          cards.map(card => (
            <TouchableOpacity key={card.id} onPress={() => onCardPress(card.id)} style={styles.card} accessibilityRole="button" accessibilityLabel={`Play ${card.label}`}>
              <Image source={card.image} style={styles.cardImage} />
              <Text style={styles.cardText}>{card.label}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      {showHelp && (
  <View
    onTouchStart={() => setShowHelp(false)}
    style={{
      position: 'absolute',
      left: 0, right: 0, top: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      zIndex: 1000,
    }}
  >
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        maxWidth: 350,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
        How Achievements Work
      </Text>

      <Text style={{ marginBottom: 8 }}>
        • Tap a card to replay its animation.
      </Text>

      <Text style={{ marginBottom: 8 }}>
        • Cards unlock automatically as you drink good or lousy mugs.
      </Text>

      <Text style={{ marginBottom: 8 }}>
        • Swipe left or right to browse cards.
      </Text>

      <Text style={{ marginTop: 12, color: '#555', textAlign: 'center' }}>
        Tap anywhere to close.
      </Text>
    </View>
  </View>
)}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  cardBar: {
    position: 'absolute',
    bottom: 0,
    height: 100,
    backgroundColor: '#eee',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    zIndex: 10,
  },
  card: { width: 92, height: 92, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  cardImage: { width: 54, height: 54, resizeMode: 'contain', marginBottom: 4 },
  cardText: { fontSize: 12, textAlign: 'center' },

  quoteBubble: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#fef2c0',
    borderRadius: 12,
    padding: 10,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 6,
  },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: '#333' },
});
