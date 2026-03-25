// app/why-lousy.tsx
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  AccessibilityRole,
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const rosieMug     = require('../assets/images/mug.png');
const ruffieDecaf  = require('../assets/images/Ruffles.png');
const compieHappy  = require('../assets/images/rosieoncompie.png');

export default function WhyLousy() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={true}
      >
        <Animated.Text
          style={[styles.h1, { opacity: fade }]}
          accessibilityRole="header"
          accessibilityLabel="Why Lousy?"
        >
          Why “Lousy”?
        </Animated.Text>

        {/* Story block */}
        <View
          accessible
          accessibilityRole={'summary' as AccessibilityRole}
          accessibilityLabel="Story: why this page is called Why Lousy"
          style={styles.storyBlock}
        >
          <Text style={styles.p}>
            I started this app with no plans to publish it — it was supposed to
            be a project to learn the basics of React. But as I realized how much
            I already knew from JavaScript, it grew into a greetings app.
          </Text>
          <Text style={styles.p}>
            The monetization idea started with “Buy Me a Coffee,” but since I
            don’t drink coffee, I planned to make it “Buy Rosie a Treat.” Then
            Loretta Swit, famous for Margaret Houlihan on M*A*S*H, passed away. 
            Her favorite episode was *The Nurses*, with the line:
            “Did you ever offer me a lousy cup of coffee?”
          </Text>
          <Text style={styles.p}>
            That line stuck. It wasn’t about the coffee — it was about being
            included. So “Buy Me a Lousy Cup of Coffee” became both a tribute and
            a wink to the show. Rosie still gets the good stuff ☕, Ruffie defends
            the lousy 🫖, and Compie pretends not to care 💻.
          </Text>
        </View>

        {/* Tribute */}
        <View
          style={styles.tribute}
          accessible
          accessibilityRole={'note' as AccessibilityRole}
          accessibilityLabel="Tribute note"
        >
          <Text style={styles.tributeTitle}>A little TV history</Text>
          <Text style={styles.tributeText}>
            The phrase “one lousy cup of coffee” became part of M*A*S*H lore —
            a reminder that tiny gestures can mean everything.
          </Text>
        </View>

        {/* Trio images */}
        <View
          style={styles.trioRow}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Image source={rosieMug} style={styles.trioImg} />
          <Image source={compieHappy} style={styles.trioImg} />
          <Image source={ruffieDecaf} style={styles.trioImg} />
        </View>

        {/* CTAs */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            onPress={() => router.replace({ pathname: '/', params: { coffee: 'true' } })}
            accessibilityRole="button"
            accessibilityLabel="Open the coffee screen to support with a good or lousy coffee"
            style={[styles.button, styles.buttonDark]}
          >
            <Text style={[styles.buttonText, styles.buttonTextLight]}>
              Buy a Coffee
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
            style={styles.button}
          >
            <Text style={styles.buttonText}>Back Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  h1: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'left',
    marginBottom: 10,
  },
  storyBlock: {
    backgroundColor: '#fff',
    borderColor: '#e6e6e6',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  p: {
    fontSize: 15,
    color: '#222',
    lineHeight: 21,
    marginBottom: 10,
  },
  tribute: {
    marginTop: 12,
    backgroundColor: '#faf6e8',
    borderColor: '#eadfbe',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 10,
  },
  tributeTitle: { fontWeight: '800', marginBottom: 4, color: '#6a5d3d' },
  tributeText: { color: '#6a5d3d' },
  trioRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  trioImg: { width: 80, height: 80, resizeMode: 'contain' },
  ctaRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 200,
  },
  buttonDark: { backgroundColor: '#111', borderColor: '#111' },
  buttonText: { fontWeight: '700', color: '#111', textAlign: 'center' },
  buttonTextLight: { color: '#fff' },
});
