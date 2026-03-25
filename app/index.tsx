// Intro.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useGlobalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityRole,
  Alert,
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from './firebaseConfig';

/* ============================================================
 * Platform/IAP wrappers
 * ============================================================ */
const IS_WEB = Platform.OS === 'web';

type UseIAPReturn = {
  connected: boolean;
  products: any[];
  requestProducts: (args?: any) => Promise<void>;
  requestPurchase: (args?: any) => Promise<void>;
  finishTransaction: (args?: any) => Promise<void>;
};
type UseIAPOpts = {
  onPurchaseSuccess?: (purchase: any) => void | Promise<void>;
  onPurchaseError?: (error: any) => void | Promise<void>;
};

function useIAPSafe(opts: UseIAPOpts): UseIAPReturn {
  if (IS_WEB) {
    return {
      connected: false,
      products: [],
      requestProducts: async () => { },
      requestPurchase: async () => { },
      finishTransaction: async () => { },
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useIAP } = require('expo-iap') as { useIAP: (o: UseIAPOpts) => UseIAPReturn };
  return useIAP(opts);
}

/* ============================================================
 * Images
 * ============================================================ */
const poemImage = require('../assets/images/poem.png');
const rosieCompieImage = require('../assets/images/rosieoncompie.png');
const rosieImage = require('../assets/images/mug.png');
const byeImage = require('../assets/images/notNow.png');
const rosieSadImage = require('../assets/images/noCoffee.png');

/* ============================================================
 * IAP config / idempotency helpers
 * ============================================================ */
const LIVE_SKUS = ['buy_good_stuff', 'buy_lousy_stuff'] as const;
type ProductId = (typeof LIVE_SKUS)[number];
type BuyType = 'good' | 'lousy';

const PROCESSED_KEY = 'iap.processed.v1';
function hashString(s: string) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return (h >>> 0).toString(36); }
const txIdOf = (purchase: any) => {
  const pid = purchase?.productId ?? 'unknown';
  const tOrig = purchase?.originalTransactionId;
  const tId = purchase?.transactionId;
  const order = purchase?.orderId;
  const rcpt = purchase?.transactionReceipt;
  if (tOrig) return String(tOrig);
  if (tId) return String(tId);
  if (order) return String(order);
  if (rcpt) return `rcpt_${hashString(rcpt)}_${pid}`;
  return `pid_${pid}`;
};
async function isProcessedLocally(txId: string) {
  const raw = await AsyncStorage.getItem(PROCESSED_KEY);
  const set = new Set<string>(raw ? JSON.parse(raw) : []);
  return { set, exists: set.has(txId) };
}
async function rememberProcessed(set: Set<string>, txId: string) {
  set.add(txId);
  await AsyncStorage.setItem(PROCESSED_KEY, JSON.stringify([...set]));
}
async function ensureNotProcessedRemote(txId: string) {
  const ref = doc(db, 'iap_purchases', txId);
  const snap = await getDoc(ref);
  if (snap.exists()) return { ref, already: true };
  await setDoc(ref, { createdAt: Date.now() });
  return { ref, already: false };
}

/* ============================================================
 * Milestone matrix + helpers (with teaser lines)
 * ============================================================ */
const MASTER_STEPS = [1, 25, 50, 100] as const;
type Step = (typeof MASTER_STEPS)[number];
type Track = 'good' | 'lousy' | 'total';

type MilestoneDef = { active: boolean; teaser: string | null };
type TrackConfig = Record<Step, MilestoneDef>;

const MILESTONES: Record<Track, TrackConfig> = {
  good: {
    1: { active: true, teaser: 'Rosie drinks her first good coffee.' },
    25: { active: true, teaser: 'Rosie causes a mini mug drizzle.' },
    50: { active: true, teaser: 'Rosie whips up a proper mug storm.' },
    100: { active: false, teaser: null },
  },
  lousy: {
    1: { active: true, teaser: 'Ruffie regrets that decision.' },
    25: { active: true, teaser: 'Ruffie attends a Decaf Defense class.' },
    50: { active: true, teaser: 'Ruffie walks home with an A.' },
    100: { active: false, teaser: null },
  },
  total: {
    1: { active: false, teaser: null }, // total starts at 25
    25: { active: true, teaser: 'Rosie slides in dramatically.' },
    50: { active: true, teaser: 'Compie rolls his eyes (again).' },
    100: { active: true, teaser: 'Rosie gets dragged to rehab.' },
  },
};

const activeSteps = (track: Track): Step[] =>
  MASTER_STEPS.filter((s) => MILESTONES[track][s].active);

function nextTarget(current: number, track: Track) {
  const steps = activeSteps(track);
  const target = steps.find((s) => current < s) ?? steps[steps.length - 1];
  const prev = steps.filter((s) => s <= current).at(-1) ?? 0;
  return { prev, target };
}

function segmentFill(current: number, track: Track) {
  const { prev, target } = nextTarget(current, track);
  const range = Math.max(1, target - prev);
  return Math.max(0, Math.min(1, (current - prev) / range));
}

function mugsLeft(current: number, track: Track) {
  const { target } = nextTarget(current, track);
  return Math.max(0, target - current);
}

/* ============================================================
 * Progress Jar (per-track icon + ticks + teaser)
 * ============================================================ */
function ProgressJar({
  current,
  track,
  label,
}: {
  current: number;
  track: Track;
  label: string;
}) {
  // animated segment fill
  const fill = segmentFill(current, track);
  const animatedFill = useRef(new Animated.Value(fill)).current;
  useEffect(() => {
    Animated.timing(animatedFill, {
      toValue: fill,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fill, animatedFill]);

  // falling icon (only when count increases and > 0)
  const last = useRef(current);
  const drop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (current > last.current && current > 0) {
      drop.setValue(0);
      Animated.timing(drop, {
        toValue: 1,
        duration: 700,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
    last.current = current;
  }, [current, drop]);

  const WIDTH = 260;
  const HEIGHT = 22;
  const R = 12;

  // icons & tints
  const ICONS: Record<Track, string> = { good: '☕', lousy: '🫖', total: '🫘' };
  const TINTS: Record<Track, string> = {
    good: '#e7dccb',
    lousy: '#e9eef6',
    total: '#e8d9c7',
  };

  // a11y + teaser text
  const ticksActive = activeSteps(track);
  // Show a leading "0" only for the total bar
  const tickLabels = track === 'total' ? [0, ...ticksActive] : ticksActive;
  const { prev, target } = nextTarget(current, track);
  const left = mugsLeft(current, track);
  const teaser = MILESTONES[track][target].teaser ?? '';
  const preview =
    left > 0 ? `${left} more to next milestone (${target})${teaser ? ` — ${teaser}` : ''}` : `Next milestone reached (${target}).`;

  // falling icon transforms
  const beanY = drop.interpolate({ inputRange: [0, 1], outputRange: [-36, 0] });
  const beanOpacity = drop.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0, 1, 0] });
  const beanX = drop.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });

  // ✅ FIX: total should start truly empty at 0 (no forced tile)
  let tileCount = 0;
  if (track === 'total') {
    tileCount = current > 0 ? Math.round(fill * 24) : 0;
  } else {
    tileCount = current > 0 ? Math.max(1, Math.round(fill * 24)) : 0;
  }

  return (
    <View
      accessible
      accessibilityRole={'progressbar' as AccessibilityRole}
      accessibilityLabel={`${label}. ${current} of ${target}. ${left} to next milestone.`}
      accessibilityValue={{ min: prev, max: target, now: Math.min(current, target) }}
      style={{ alignItems: 'center' }}
    >
      <Text style={{ fontWeight: '700', marginBottom: 6 }}>{label}</Text>

      <View style={{ width: WIDTH, height: HEIGHT + 12, alignItems: 'center' }}>
        {current > 0 && (
          <Animated.Text
            style={{
              position: 'absolute',
              top: 0,
              transform: [{ translateY: beanY }, { translateX: beanX }, { rotate: '10deg' }],
              opacity: beanOpacity,
              fontSize: 18,
            }}
            accessible={false}
          >
            {ICONS[track]}
          </Animated.Text>
        )}

        <View
          style={{
            width: WIDTH,
            height: HEIGHT,
            borderRadius: R,
            backgroundColor: '#fafafa',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: '#ddd',
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              width: animatedFill.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              height: '100%',
              backgroundColor: TINTS[track],
              paddingHorizontal: 6,
              paddingTop: 2,
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            {tileCount > 0 &&
              Array.from({ length: tileCount }).map((_, i) => (
                <Text key={i} style={{ marginRight: 4, lineHeight: 16 }} accessible={false}>
                  {ICONS[track]}
                </Text>
              ))}
          </Animated.View>
        </View>

        {/* segment ticks (only the active ones per track) */}
        <View
          style={{
            width: WIDTH,
            position: 'absolute',
            top: HEIGHT + 2,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          {tickLabels.map((s) => (
            <Text key={s} style={{ fontSize: 10, color: '#555' }} accessible={false}>
              {s}
            </Text>
          ))}
        </View>

      </View>

      {/* sneak-peek line */}
      <Text style={{ marginTop: 6, fontSize: 12, color: '#555', textAlign: 'center' }}>
        {preview}
      </Text>
    </View>
  );
}

/* ============================================================
 * Main component
 * ============================================================ */
export default function Intro() {
  const router = useRouter();
  const params = useGlobalSearchParams();

  const [showCoffee, setShowCoffee] = useState(false);
  const [showIapOptions, setShowIapOptions] = useState(false);

  // prices (store or Firestore fallback)
  const [goodPrice, setGoodPrice] = useState<number | null>(null);
  const [lousyPrice, setLousyPrice] = useState<number | null>(null);

  // counts
  const [goodCount, setGoodCount] = useState(0);
  const [lousyCount, setLousyCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const devMode = params?.dev === 'true';

  const { connected, products, requestProducts, requestPurchase, finishTransaction } = useIAPSafe({
    onPurchaseSuccess: async (purchase) => {
      try {
        const pid = purchase?.productId as string | undefined;
        if (!pid) return;

        const txId = txIdOf(purchase);
        const { set, exists } = await isProcessedLocally(txId);
        if (exists) {
          await finishTransaction({ purchase, isConsumable: true }).catch(() => { });
          return;
        }

        const { ref, already } = await ensureNotProcessedRemote(txId);
        if (already) {
          await finishTransaction({ purchase, isConsumable: true }).catch(() => { });
          await rememberProcessed(set, txId);
          return;
        }

        await finishTransaction({ purchase, isConsumable: true });

        if (pid === 'buy_good_stuff') {
          await incrementCount('goodCount');
        } else if (pid === 'buy_lousy_stuff') {
          await incrementCount('lousyCount');
        }

        await setDoc(ref, { createdAt: Date.now(), productId: pid }, { merge: true });
        await rememberProcessed(set, txId);
        await fetchCounts();
      } catch (err) {
        console.error('IAP success handler error', err);
        Alert.alert('Purchase', 'Something went wrong finishing your purchase.');
      }
    },
    onPurchaseError: (error) => {
      if (error?.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase failed', error?.message || 'Please try again.');
      }
    },
  });

  // toggle coffee screen via query
  useEffect(() => {
    setShowCoffee(params?.coffee === 'true');
  }, [params?.coffee]);

  // fetch products (native only)
  useEffect(() => {
    if (!IS_WEB && showCoffee && connected) {
      requestProducts({ skus: [...LIVE_SKUS], type: 'inapp' }).catch(() => { });
    }
  }, [showCoffee, connected, requestProducts]);

  const priceFor = (id: ProductId) => products.find((p) => p.id === id)?.displayPrice ?? null;
  const isLoaded = (id: ProductId) => products.some((p) => p.id === id);

  const incrementCount = async (docName: 'goodCount' | 'lousyCount') => {
    await runTransaction(db, async (trx) => {
      const refCount = doc(db, 'milestones', docName);
      const snap = await trx.get(refCount);
      const current = snap.exists() ? (snap.data()?.count ?? 0) : 0;
      trx.set(refCount, { count: current + 1 }, { merge: true });
    });
    await fetchCounts();
  };

  const handleIapPurchase = async (type: BuyType) => {
    if (IS_WEB) {
      Alert.alert('Tip unavailable on web', 'Please install from the App Store to buy a coffee.');
      return;
    }
    const productId: ProductId = type === 'good' ? 'buy_good_stuff' : 'buy_lousy_stuff';

    if (!connected || !isLoaded(productId)) {
      if (devMode && !IS_WEB) {
        await incrementCount(type === 'good' ? 'goodCount' : 'lousyCount');
        Alert.alert('Dev mode', `Simulated ${type === 'good' ? 'Good' : 'Lousy'} Coffee.`);
        setShowIapOptions(false);
        return;
      }
      Alert.alert('Store not ready', 'Still loading product info. Try again in a moment.');
      return;
    }

    try {
      await requestPurchase({
        request: { ios: { sku: productId }, android: { skus: [productId] } },
      });
      setShowIapOptions(false);
    } catch (err: any) {
      console.error('❌ Purchase error:', err);
      Alert.alert('Purchase', 'Purchase failed or was canceled.');
    }
  };

  // Firestore “suggested” prices (fallback)
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const goodSnap = await getDoc(doc(db, 'milestones', 'goodCost'));
        const lousySnap = await getDoc(doc(db, 'milestones', 'lousyCost'));
        setGoodPrice(goodSnap.exists() ? goodSnap.data().cost : null);
        setLousyPrice(lousySnap.exists() ? lousySnap.data().cost : null);
      } catch (e) {
        console.error('🔥 Failed to fetch prices:', e);
      }
    };
    if (params?.coffee === 'true') fetchPrices();
  }, [params?.coffee]);

  // Firestore counts
  const fetchCounts = async () => {
    try {
      const goodSnap = await getDoc(doc(db, 'milestones', 'goodCount'));
      const lousySnap = await getDoc(doc(db, 'milestones', 'lousyCount'));

      const good = goodSnap.exists() ? goodSnap.data().count || 0 : 0;
      const lousy = lousySnap.exists() ? lousySnap.data().count || 0 : 0;
      const total = good + lousy;

      setGoodCount(good);
      setLousyCount(lousy);
      setTotalCount(total);
    } catch (e) {
      console.error('Failed to fetch counts:', e);
    }
  };
  useEffect(() => {
    if (params?.coffee === 'true') fetchCounts();
  }, [params?.coffee]);

  const routerGoodPrice = useMemo(() => (IS_WEB ? null : priceFor('buy_good_stuff')), [products]);
  const routerLousyPrice = useMemo(() => (IS_WEB ? null : priceFor('buy_lousy_stuff')), [products]);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

      {showCoffee ? (
        <ScrollView contentContainerStyle={styles.coffeeContainer}>
          <View style={styles.row}>
            {/* Rosie (buy coffee) */}
            <View style={styles.column}>
              <TouchableOpacity
                onPress={() => setShowIapOptions(true)}
                accessibilityRole="button"
                accessibilityLabel="Buy Rosie a good coffee or Ruffie a lousy coffee"
              >
                <Image source={rosieImage} style={styles.image} />
              </TouchableOpacity>

              {showIapOptions && (
                <View style={{ marginTop: 10, alignItems: 'stretch', width: 220 }}>
                  <TouchableOpacity
                    onPress={() => handleIapPurchase('good')}
                    accessibilityRole="button"
                    accessibilityLabel="Buy Rosie a good coffee"
                    disabled={IS_WEB || !isLoaded('buy_good_stuff')}
                    style={[styles.button, { backgroundColor: '#111' }]}
                  >
                    <Text style={[styles.buttonText, { color: '#fff' }]}>
                      {IS_WEB
                        ? 'Buy Rosie a Good Coffee (Install on iPhone)'
                        : `Buy Rosie a Good Coffee (${routerGoodPrice ?? (goodPrice !== null ? `$${goodPrice}` : '')})`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleIapPurchase('lousy')}
                    accessibilityRole="button"
                    accessibilityLabel="Buy Ruffie a lousy coffee"
                    disabled={IS_WEB || !isLoaded('buy_lousy_stuff')}
                    style={[styles.button, { marginTop: 10 }]}
                  >
                    <Text style={styles.buttonText}>
                      {IS_WEB
                        ? 'Buy Ruffie a Lousy Coffee (Install on iPhone)'
                        : `Buy Ruffie a Lousy Coffee (${routerLousyPrice ?? (lousyPrice !== null ? `$${lousyPrice}` : '')})`}
                    </Text>
                  </TouchableOpacity>

                  {IS_WEB && (
                    <Text style={{ textAlign: 'center', marginTop: 8 }}>
                      In-app purchases aren’t available on the web. Please use your iPhone/iPad.
                    </Text>
                  )}
                </View>
              )}

              {goodCount === 0 && lousyCount === 0 && (
                <View style={{ alignItems: 'center', marginTop: 16 }}>
                  <Image source={rosieSadImage} style={{ width: 140, height: 140, marginBottom: 10 }} />
                  <Text style={{ textAlign: 'center' }}>
                    No one has bought even one lousy mug of coffee.{'\n'}
                    Rosie is mildly crushed. This is worse than decaf.
                  </Text>
                </View>
              )}
            </View>

            {/* Ruffie (exit) */}
            <View style={styles.column}>
              <TouchableOpacity
                onPress={() => router.push('/greetings')}
                accessibilityRole="button"
                accessibilityLabel="Return to the greeting builder"
              >
                <Image source={byeImage} style={styles.image} />
              </TouchableOpacity>
              <Text style={styles.centeredText}>
                No coffee? Ruffie go bye-bye!{'\n'}
                Tap me to sneak back to the greeting page.
              </Text>
            </View>
          </View>

          {/* Progress jars */}
          <View style={{ marginTop: 18, gap: 14, alignItems: 'center' }}>
            <ProgressJar current={goodCount} track="good" label="Good Progress" />
            <ProgressJar current={lousyCount} track="lousy" label="Lousy Progress" />
            <ProgressJar current={totalCount} track="total" label="Total Progress" />
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Image
            source={poemImage}
            style={styles.poemImage}
            accessibilityLabel="A poem by the dev with help by Rosie..."
            accessible
          />
          <Image
            source={rosieCompieImage}
            style={styles.mainImage}
            accessibilityLabel="Rosie the tuxedo cat is sitting on Compie..."
            accessible
          />
          <Text
            style={styles.instructions}
            accessible
            accessibilityLabel="Instructions. Start Greeting to craft a message. Milestone Page shows what's happening now. Milestone Achievements shows unlocked scenes you can replay. Buying Rosie a good coffee (caffeine) or Ruffie a lousy coffee (decaf) advances the totals."
          >
            Start by tapping “Start Greeting” to craft a message with Rosie & friends.
            {'\n\n'}
            ▶ Milestone Page: Live scenes for milestones that are unlocked right now. If multiple are ready, use “Next” or “Replay.”{'\n'}
            ▶ Milestone Achievements: A gallery of moments you’ve already unlocked. Tap any card to replay that scene.
            {'\n\n'}
            Coffee tip: Buy Rosie a good coffee (caffeine) or Ruffie a lousy coffee (decaf). Both help reach new totals!
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/greetings')}
            style={[styles.button, { width: 200, alignSelf: 'center', backgroundColor: '#111' }]}
            accessibilityRole="button"
            accessibilityLabel="Start Greeting. Opens the greeting builder page."
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>Start Greeting</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => router.replace({ pathname: '/', params: { coffee: 'true' } })}
              style={[styles.button, { width: 200, alignSelf: 'center' }]}
              accessibilityRole="button"
              accessibilityLabel="Show Rosie’s coffee appeal screen"
            >
              <Text style={styles.buttonText}>Buy Me a Coffee</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/* ============================================================
 * Styles
 * ============================================================ */
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  coffeeContainer: {
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
  },
  column: {
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: 200,
    marginHorizontal: 10,
  },
  centeredText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  poemImage: {
    width: 220,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  mainImage: {
    width: 220,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  image: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  buttonText: { fontWeight: '700', color: '#111', textAlign: 'center' },
});
