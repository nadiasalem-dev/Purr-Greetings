// app/_layout.tsx
import { Stack, useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PawWalk from './components/PawWalk';

function NavBarInline() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useGlobalSearchParams();

  const isPhone = Dimensions.get('window').width < 430;

  // scroll row measurements
  const scrollRef = useRef<ScrollView>(null);
  const [contentW, setContentW] = useState(0);
  const [containerW, setContainerW] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const overflow = contentW > containerW + 2;

  // Show PawWalk once per refresh (all screens)
  const [showPaw, setShowPaw] = useState(false);
  useEffect(() => {
    setShowPaw(true);
  }, []);
  const onPawDone = () => setShowPaw(false);

  // auto-nudge if coffee query
  useEffect(() => {
    if (params?.coffee === 'true') {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [params?.coffee]);

  const go = (key: string) => {
    switch (key) {
      case 'home':         router.replace({ pathname: '/', params: {} }); break;
      case 'greet':        router.replace('/greetings'); break;
      case 'milestones':   router.replace('/milestonePage'); break;
      case 'achievements': router.replace('/milestoneAchievements'); break;
      case 'about':        router.replace('/about'); break;
      case 'whyLousy':     router.replace('/why-lousy'); break; // kebab-case path
      case 'coffee':       router.replace({ pathname: '/', params: { coffee: 'true' } }); break;
    }
  };

  const isActive = (key: string) => {
    if (key === 'home')         return pathname === '/' && params?.coffee !== 'true';
    if (key === 'greet')        return pathname?.startsWith('/greetings');
    if (key === 'milestones')   return pathname?.startsWith('/milestonePage');
    if (key === 'achievements') return pathname?.startsWith('/milestoneAchievements');
    if (key === 'about')        return pathname?.startsWith('/about');
    if (key === 'whyLousy')     return pathname?.startsWith('/why-lousy'); // kebab-case path
    if (key === 'coffee')       return pathname === '/' && params?.coffee === 'true';
    return false;
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollX(e.nativeEvent.contentOffset.x);
  };

  const effectiveWidth = containerW > 0 ? containerW : Dimensions.get('window').width;

  return (
    <SafeAreaView
      edges={['top']}
      style={navStyles.wrap}
      onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
    >
      <View style={navStyles.rowWrap}>
        {/* left chevron when scrolled */}
        {overflow && scrollX > 2 && (
          <TouchableOpacity
            onPress={() => scrollRef.current?.scrollTo({ x: 0, animated: true })}
            style={navStyles.leftChevron}
            accessibilityRole="button"
            accessibilityLabel="Back to first tabs"
          >
            <Text style={{ fontSize: 18, fontWeight: '700' }}>{'‹'}</Text>
          </TouchableOpacity>
        )}

        {/* scroll row */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={[navStyles.bar, isPhone && { paddingRight: 120 }]}
          onContentSizeChange={(w) => setContentW(w)}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <NavItem label="Home"                  active={isActive('home')}         onPress={() => go('home')} />
          <NavItem label="Greetings"             active={isActive('greet')}        onPress={() => go('greet')} />
          <NavItem label="Milestones"            active={isActive('milestones')}   onPress={() => go('milestones')} />
          <NavItem label="Achievements"          active={isActive('achievements')} onPress={() => go('achievements')} />
          <NavItem label="About the Fluffballs"  active={isActive('about')}        onPress={() => go('about')} />
          <NavItem label="Why Lousy"             active={isActive('whyLousy')}     onPress={() => go('whyLousy')} />
          {!isPhone && (
            <NavItem label="Buy Coffee"          active={isActive('coffee')}       onPress={() => go('coffee')} />
          )}
        </ScrollView>

        {/* fixed Buy Coffee pill on phones */}
        {isPhone && (
          <TouchableOpacity
            onPress={() => go('coffee')}
            style={navStyles.coffeeCTA}
            accessibilityRole="button"
            accessibilityLabel="Buy Coffee"
            accessibilityHint="Opens Rosie's coffee page"
          >
            <Text style={navStyles.coffeeCTAText}>Buy Coffee</Text>
          </TouchableOpacity>
        )}

        {/* Paw Walk — show once per refresh on all screens */}
        {showPaw && (
          <PawWalk
            width={effectiveWidth}
            onPressAbout={() => { onPawDone(); go('about'); }}
            onDone={onPawDone}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function NavItem({
  label, active, onPress,
}: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[navStyles.btn, active && navStyles.btnActive]}
    >
      <Text style={[navStyles.txt, active && navStyles.txtActive]} numberOfLines={1} ellipsizeMode="tail">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  return (
    <>
      <NavBarInline />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

const navStyles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dcdcdc',
    zIndex: 999,
  },
  rowWrap: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  bar: { paddingTop: 12, paddingBottom: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },

  btn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, marginRight: 8 },
  btnActive: { backgroundColor: '#f2f2f2' },
  txt: { fontSize: 15, color: '#333' },
  txtActive: { fontWeight: '700' },

  coffeeCTA: {
    position: 'absolute',
    right: 8,
    top: 6,
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    zIndex: 40,
  },
  coffeeCTAText: { color: '#fff', fontWeight: '700' },

  leftChevron: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
});
