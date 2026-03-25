// app/components/PawWalk.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

type Character = {
  id: 'rosie' | 'ruffie' | 'skip' | 'zoey' | 'compie';
  label: string;
  src: any;
  gait: 'step' | 'bounce';
};

// NOTE: This file is in app/components/, your images are in app/assets/images/
// If your assets are exactly here: app/assets/images/, the correct path is ../assets/images/...
const CHARACTERS: Character[] = [
  { id: 'rosie',  label: 'Rosie with steaming coffee',   src: require('../../assets/images/paradeRosie.png'),  gait: 'step'   },
  { id: 'ruffie', label: 'Ruffie with decaf cup',        src: require('../../assets/images/paradeRuffie.png'), gait: 'step'   },
  { id: 'skip',   label: 'Skip with the leash',          src: require('../../assets/images/paradeSkip.png'),   gait: 'step'   },
  { id: 'zoey',   label: 'Zoey with Free Hugs sign',     src: require('../../assets/images/paradeZoey.png'),   gait: 'step'   },
  { id: 'compie', label: 'Compie the happy laptop',      src: require('../../assets/images/paradeCompie.png'), gait: 'bounce' },
];

const NATIVE_DRIVER = Platform.OS !== 'web';

export default function PawWalk({
  width,
  onPressAbout,
  onDone,
}: {
  width: number;               // navbar width passed from _layout
  onPressAbout: () => void;    // navigate to About
  onDone: () => void;          // tell parent to hide
}) {
  // Hide after first full pass, but show again on full reload (component remount).
  const [finished, setFinished] = useState(false);
  if (finished) return null;

  // Fallback if width is 0 the first render.
  const safeWidth = width > 0 ? width : Dimensions.get('window').width;

  // Size system (kept from your version)
  const sizes = useMemo(() => {
    if (safeWidth >= 1200) return { cat: 56, compieW: 76, compieH: 56, gap: 16, top: 0, duration: 5200 };
    if (safeWidth >= 992)  return { cat: 50, compieW: 68, compieH: 50, gap: 14, top: 0, duration: 5200 };
    if (safeWidth >= 768)  return { cat: 42, compieW: 58, compieH: 44, gap: 12, top: 0, duration: 5200 };
    if (safeWidth >= 430)  return { cat: 34, compieW: 48, compieH: 36, gap: 11, top: 0, duration: 5000 };
    return                    { cat: 30, compieW: 42, compieH: 32, gap: 10, top: 0, duration: 4800 };
  }, [safeWidth]);

  // Compute the actual parade width (sum of 5 images + 4 gaps + a little padding at both ends)
  const paradeWidth = useMemo(() => {
    const catW = sizes.cat;
    const compieW = sizes.compieW;
    const gaps = sizes.gap * 4; // 5 items -> 4 inner gaps
    const imgs = catW * 4 + compieW; // 4 cats + 1 compie
    const sidePad = sizes.gap * 1.6; // paddingHorizontal in container
    return imgs + gaps + sidePad * 2;
  }, [sizes]);

  // Start just off the left; end just off the right
  const startX = useMemo(() => -paradeWidth - 24, [paradeWidth]);
  const endX   = useMemo(() => safeWidth + 24,   [safeWidth]);

  const x       = useRef(new Animated.Value(startX)).current;
  const stepY   = useRef(new Animated.Value(0)).current;
  const bounceY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // In case width changed a lot between renders, reset starting position
    x.setValue(startX);

    const glide = Animated.timing(x, {
      toValue: endX,
      duration: sizes.duration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    });

    const step = Animated.loop(
      Animated.sequence([
        Animated.timing(stepY,   { toValue: -3, duration: 180, easing: Easing.linear,            useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(stepY,   { toValue:  0, duration: 180, easing: Easing.linear,            useNativeDriver: NATIVE_DRIVER }),
      ])
    );

    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceY, { toValue: -6, duration: 240, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(bounceY, { toValue:  0, duration: 240, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      ])
    );

    step.start();
    bounce.start();
    glide.start(({ finished }) => {
      if (finished) {
        setFinished(true);   // self-hide after the first pass
        onDone();
      }
    });

    return () => {
      step.stop();
      bounce.stop();
      x.stopAnimation(() => { x.setValue(endX); }); // prevent snapping back left
    };
  }, [startX, endX, sizes.duration, onDone, x, stepY, bounceY]);

  const wrapStyle: ViewStyle = useMemo(
    () => ({
      transform: [{ translateX: x }],
      top: sizes.top, // pin to top of navbar area for visibility
    }),
    [x, sizes.top]
  );

  return (
    <Animated.View style={[styles.wrap, wrapStyle]} pointerEvents="box-none">
      {/* One accessible button for the whole parade */}
      <TouchableOpacity
        onPress={onPressAbout}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="About the Fluffballs"
        accessibilityHint="Opens character bios"
        style={[styles.row, { paddingHorizontal: sizes.gap * 0.8 }]}
      >
        {CHARACTERS.map((c) => {
          const vY = c.gait === 'bounce' ? bounceY : stepY;
          const dim = c.id === 'compie'
            ? { width: sizes.compieW, height: sizes.compieH }
            : { width: sizes.cat,    height: sizes.cat    };

          return (
            <Animated.View
              key={c.id}
              style={[styles.character, { marginRight: sizes.gap, transform: [{ translateY: vY }] }]}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Image
                source={c.src}
                style={[styles.img, dim]}
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            </Animated.View>
          );
        })}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    zIndex: 60,              // above the scroll row & coffee pill
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  character: {
    alignItems: 'center',
  },
  img: {
    resizeMode: 'contain',
  },
});
