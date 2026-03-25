import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import rosieAnnoyed from '../assets/images/annoyed.png';
import caffeineMug from '../assets/images/caffeineMug.png';
import ruffieAPlus from '../assets/images/calicoAPlus.png';
import compie from '../assets/images/compie.png';
import draggedToRehab from '../assets/images/draggedToRehab.png';
import rosieFurious from '../assets/images/furious.png';
import rosieGrumbling from '../assets/images/grumbling.png';
import home from '../assets/images/home.png';
import rosieNeutral from '../assets/images/neutral.png';
import noCoffee from '../assets/images/noCoffee.png';
import rehab from '../assets/images/rehab.png';
import rosieRelieved from '../assets/images/relieved.png';
import rosieDrinks from '../assets/images/rosiedrinks.png';
import rosieSlide from '../assets/images/rosieSlide.png';
import ruffieSchoolDay from '../assets/images/ruffieSchoolDay.png';
import ruffieLousyCoffee from '../assets/images/ruffieWithLousyCoffee.png';
import schoolSign from '../assets/images/school.png';

import { db } from './firebaseConfig';




const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

type Mug = {
  id: string;
  y: Animated.Value;
  x: number;
  spin: Animated.Value;
  staticRotation: number;
};
export default function TestPage() {
  const [showHome, setShowHome] = useState(false);
  const [showRosie, setShowRosie] = useState(false);
  const [showRosieDrinks, setShowRosieDrinks] = useState(false);
  const [showRosieSlide, setShowRosieSlide] = useState(false);
  const [showRuffieSlide, setShowRuffieSlide] = useState(false);
  const [showRuffieSchoolSlide, setShowRuffieSchoolSlide] = useState(false);
  const [showRuffieLousyCoffee, setShowRuffieLousyCoffee] = useState(false);
  const [showSchoolSign, setShowSchoolSign] = useState(false);
  const [showCompie, setShowCompie] = useState(false);
  const [showCompieQuote, setShowCompieQuote] = useState(false);
  const [showRosieQuote, setShowRosieQuote] = useState(false);
  const [result, setResult] = useState('Loading...');
  const [zeroResult, setZeroResult] = useState('Loading...');
  const [showLousyCost, setShowLousyCost] = useState<number | undefined>();
  const [showGoodCost, setShowGoodCost] = useState<number | undefined>();
  const [showRuffieSlides, setShowRuffieSlides] = useState(false);
  const [showRehabSign, setShowRehabSign] = useState(false);
  const [showDragToRehab, setShowDragToRehab] = useState(false);
  const [showRosieRehabQuote, setShowRosieRehabQuote] = useState(false);
  const [showRosiesMood, setShowRosiesMood] = useState(false);
  const [visibleMugs, setVisibleMugs] = useState<boolean[]>(Array(100).fill(true));
  const rehabX = useRef(new Animated.Value(-120)).current;
  const rosieX = useRef(new Animated.Value(-120)).current;
  const rosieY = useRef(new Animated.Value(0)).current;
  const rosieSweepX = useRef(new Animated.Value(0)).current;
  const rosieSweepY = useRef(new Animated.Value(0)).current;
  const [rosieFacingLeft, setRosieFacingLeft] = useState(false);
  const rosieLastX = useRef(0);

  const ruffieX = useRef(new Animated.Value(screenWidth)).current;
  const mugsRef = useRef<Mug[]>([]);
  const compieOpacity = useRef(new Animated.Value(1)).current;
  const leftEyeX = useRef(new Animated.Value(0)).current;
  const leftEyeY = useRef(new Animated.Value(0)).current;
  const rightEyeX = useRef(new Animated.Value(0)).current;
  const rightEyeY = useRef(new Animated.Value(0)).current;
  const mugSweepRef = useRef<Animated.Value[]>([]);
  const mugPositions = useRef<{ left: number; bottom: number }[]>([]);

  const startSweepingMugs = () => {
    let count = 100;

    const sweepInterval = setInterval(() => {
      count--;

      // Update remaining mugs
      setRemainingMugs(count);

      // Update Rosie's mood
      if (count > 75) {
        setRosieMood('neutral');
      } else if (count > 50) {
        setRosieMood('annoyed');
      } else if (count > 25) {
        setRosieMood('grumbling');
      } else if (count > 0) {
        setRosieMood('furious');
      } else {
        setRosieMood('relieved');
        clearInterval(sweepInterval);
      }

      // TODO: Trigger a sweep animation here (like pushing 1 mug off-screen)
    }, 250); // 100 mugs = ~25 seconds total
  };
  const compieBottom = screenHeight / 2 + 80;
  const [remainingMugs, setRemainingMugs] = useState(100);
  const [rosieMood, setRosieMood] = useState('neutral');
  const [goodCoffeeCount, setGoodCoffeeCount] = useState<number | null>(null);
  const slideCharacter = (
    xValue: Animated.Value,
    duration: number,
    direction: 'right' | 'left',
    onFinish?: () => void
  ) => {
    const startX = direction === 'right' ? -120 : screenWidth + 100;
    const endX = direction === 'right' ? screenWidth + 100 : -120;

    xValue.setValue(startX);

    Animated.timing(xValue, {
      toValue: endX,
      duration,
      useNativeDriver: true,
    }).start(() => {
      if (onFinish) onFinish();
    });
  };
  const moveRosieToMug = (index: number) => {
    const target = mugPositions.current[index];
    if (!target) return;

    const isLeft = target.left < rosieLastX.current;
    setRosieFacingLeft(isLeft);

    Animated.parallel([
      Animated.timing(rosieX, {
        toValue: target.left,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(rosieY, {
        toValue: target.bottom,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      rosieLastX.current = target.left; // ✅ update position

      setVisibleMugs((prev) => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });

      setRemainingMugs((prev) => prev - 1);

      const mugsLeft = visibleMugs.length - (index + 1);

      if (mugsLeft > 75) setRosieMood('neutral');
      else if (mugsLeft > 50) setRosieMood('annoyed');
      else if (mugsLeft > 25) setRosieMood('grumbling');
      else if (mugsLeft > 0) setRosieMood('furious');
      else setRosieMood('relieved');


      if (index + 1 < mugPositions.current.length) {
        setTimeout(() => moveRosieToMug(index + 1), 400);
      }
    });


  };


  const rollCompieEyes = () => {
    Animated.parallel([
      Animated.timing(leftEyeX, {
        toValue: 8,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(leftEyeY, {
        toValue: -5,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(rightEyeX, {
        toValue: 8,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(rightEyeY, {
        toValue: -5,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(compieOpacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(leftEyeX, { toValue: 0, duration: 1, useNativeDriver: true }),
        Animated.timing(leftEyeY, { toValue: 0, duration: 1, useNativeDriver: true }),
        Animated.timing(rightEyeX, { toValue: 0, duration: 1, useNativeDriver: true }),
        Animated.timing(rightEyeY, { toValue: 0, duration: 1, useNativeDriver: true }),
      ]).start(() => {
        setShowCompie(false);
      });
    });
  };
  const mugFall = () => {
    const newMugs: Mug[] = [];

    for (let i = 0; i < 100; i++) {
      const y = new Animated.Value(-100);
      const spin = new Animated.Value(0);
      const staticRotation = Math.floor(Math.random() * 90 - 45);

      newMugs.push({
        id: `mug-${i}`,
        y,
        x: Math.floor(Math.random() * (screenWidth - 40)),
        spin,
        staticRotation,
      });
    }

    mugsRef.current = newMugs;
    setShowRosieQuote(true);

    let batchIndex = 0;

    const interval = setInterval(() => {
      const batch = mugsRef.current.slice(batchIndex, batchIndex + 10);

      if (batch.length === 0) {
        clearInterval(interval);
        setTimeout(() => setShowRosieQuote(false), 2000);
        return;
      }

      batch.forEach((mug) => {
        Animated.parallel([
          Animated.timing(mug.y, {
            toValue: screenHeight + 100,
            duration: 2500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(mug.spin, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]).start();
      });

      batchIndex += 10;
    }, 300);
  };
  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, 'milestones', 'goodCoffee');
      const docSnap = await getDoc(docRef);

      const lousyDocRef = doc(db, 'milestones', 'lousyCount');
      const goodDocRef = doc(db, 'milestones', 'goodCount');
      const lousyCostDocRef = doc(db, 'milestones', 'lousyCost');
      const goodCostDocRef = doc(db, 'milestones', 'goodCost');

      const lousyDocSnap = await getDoc(lousyDocRef);
      const goodDocSnap = await getDoc(goodDocRef);
      const lousyCostDocSnap = await getDoc(lousyCostDocRef);
      const goodCostDocSnap = await getDoc(goodCostDocRef);

      if (docSnap.exists()) {
        setResult(`Success! Good coffee type is: ${docSnap.data().type}`);
      } else {
        setResult('Document does not exist.');
      }

      if (lousyDocSnap.exists() && goodDocSnap.exists()) {
        const lousyCount = lousyDocSnap.data()?.count || 0;
        const goodCount = goodDocSnap.data()?.count;
        if (typeof goodCount === 'number') {
          setGoodCoffeeCount(goodCount);
        }

        const lousyCost = lousyCostDocSnap.data()?.cost;
        const goodCost = goodCostDocSnap.data()?.cost;

        setShowLousyCost(lousyCost);
        setShowGoodCost(goodCost);

        // 🔽 now keep your big if...else chain here!


        if (lousyCount + goodCount === 0) {
          setZeroResult('Zero coffees. Rosie is pouting.');
          setShowRosie(true);
        } else if (goodCount === 1 || lousyCount === 1) {
          if (goodCount === 1) setShowRosieDrinks(true);
          if (lousyCount === 1) setShowRuffieLousyCoffee(true);
        } else if (lousyCount + goodCount === 100 && !showRosieSlide) {
          setZeroResult(`🎉 100 Coffees! Rosie slides in! 🎉`);
          setShowRosieSlide(true);
          slideCharacter(rosieX, 3000, 'right', () => setShowRosieSlide(false));
        } else if (goodCount === 100) {
          setShowRosieQuote(true);
          mugFall();
        } else if (lousyCount === 100) {
          setShowSchoolSign(true);
          setShowRuffieSlide(true);
          slideCharacter(ruffieX, 15000, 'right', () => {
            setShowRuffieSlide(false);
            setShowSchoolSign(false);
          });
        } else if (lousyCount + goodCount === 200) {
          setShowCompie(true);
          setShowCompieQuote(true);
          setShowRosieSlide(true);
          slideCharacter(rosieX, 2000, 'right', () => setShowRosieSlide(false));
          setTimeout(() => setShowCompieQuote(false), 3000);
          setTimeout(() => rollCompieEyes(), 3000);
        } else if (lousyCount === 200) {
          setShowSchoolSign(true);
          setShowHome(true);
          setShowRuffieSlides(true);
          slideCharacter(ruffieX, 3000, 'left', () => {
            setShowRuffieSlides(false);
            setShowHome(false);
            setShowSchoolSign(false);
          });
        } else if (lousyCount + goodCount === 500) {
          setShowRehabSign(true);
          setShowDragToRehab(true);
          slideCharacter(rehabX, 7000, 'right', () => {
            setShowDragToRehab(false);
            setShowRehabSign(false);
            setShowRosieRehabQuote(true);
            setTimeout(() => setShowRosieRehabQuote(false), 4000); // hides it after 4 seconds

          });

        } else if (goodCount === 200) {
          setShowRosiesMood(true);

        } else {
          setZeroResult(`Total coffees bought: ${lousyCount + goodCount}`);
          setShowRosieDrinks(false);
          setShowRuffieLousyCoffee(false);
          setShowRosie(false);
        }
      }
    };


    fetchData(); // ✅ Don't forget to call the async function!
  }, []); // <-- closes useEffect properly
  useEffect(() => {
    if (goodCoffeeCount === 200) {
      const mugs: Animated.Value[] = [];
      const positions: { left: number; bottom: number }[] = [];

      for (let i = 0; i < 100; i++) {
        mugs.push(new Animated.Value(0)); // horizontal sweep value

        const left = Math.floor(Math.random() * (screenWidth - 30));
        const bottom = Math.floor(Math.random() * 120) + 30; // 👈 varies from 30 to 150 pixels

        positions.push({ left, bottom });
      }

      mugSweepRef.current = mugs;
      mugPositions.current = positions;

      setShowRosiesMood(true);
      moveRosieToMug(0);

    }
  }, [goodCoffeeCount]);


  const getRosieSweepImage = () => {
    switch (rosieMood) {
      case 'annoyed':
        return rosieAnnoyed;
      case 'grumbling':
        return rosieGrumbling;
      case 'furious':
        return rosieFurious;
      case 'relieved':
        return rosieRelieved;
      default:
        return rosieNeutral;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.text}>{result}</Text>
        <Text style={styles.text}>{zeroResult}</Text>
        <Text style={styles.text}>Lousy Coffee costs ${showLousyCost ?? '--'}</Text>
        <Text style={styles.text}>Good Coffee costs ${showGoodCost ?? '--'}</Text>

        {showRosie && <Image source={noCoffee} style={styles.image} />}
        {showRosieDrinks && <Image source={rosieDrinks} style={styles.image} />}
        {showRuffieLousyCoffee && <Image source={ruffieLousyCoffee} style={styles.image} />}
      </View>

      {showRosieQuote && (
        <View style={styles.quoteBubble}>
          <Text style={styles.quoteText}>"It's raining mugs, hallelujah!"</Text>
        </View>
      )}

      {mugsRef.current.map((mug) => {
        const spin = mug.spin.interpolate({
          inputRange: [0, 1],
          outputRange: [`${mug.staticRotation}deg`, `${360 + mug.staticRotation}deg`],
        });

        return (
          <Animated.Image
            key={mug.id}
            source={caffeineMug}
            style={{
              width: 40,
              height: 40,
              position: 'absolute',
              left: mug.x,
              transform: [{ translateY: mug.y }, { rotate: spin }],
            }}
            accessibilityLabel="Caffeinated mug falling and spinning"
          />
        );
      })}

      {showRosieSlide && (
        <Animated.Image
          source={rosieSlide}
          style={{
            width: 100,
            height: 100,
            position: 'absolute',
            top: screenHeight / 2,
            transform: [{ translateX: rosieX }],
          }}
          accessibilityLabel="Rosie sliding dramatically across the screen"
        />
      )}

      {showRuffieSlide && (
        <Animated.Image
          source={ruffieSchoolDay}
          style={{
            width: 100,
            height: 100,
            position: 'absolute',
            bottom: 50,
            transform: [{ translateX: ruffieX }, { scaleX: -1 }],
          }}
          accessibilityLabel="Ruffie dragging herself toward school"
        />
      )}

      {showRuffieSlides && (
        <Animated.Image
          source={ruffieAPlus}
          style={{
            width: 100,
            height: 100,
            position: 'absolute',
            bottom: 50,
            transform: [{ translateX: ruffieX }, { scaleX: -1 }],
          }}
          accessibilityLabel="Ruffie walking home proudly with A+"
        />
      )}

      {showSchoolSign && (
        <Image
          source={schoolSign}
          style={{
            position: 'absolute',
            bottom: 50,
            right: 10,
            width: 100,
            height: 100,
          }}
          accessibilityLabel="Cartoon school sign at the end of the screen"
        />
      )}

      {showHome && (
        <Image
          source={home}
          style={{
            position: 'absolute',
            bottom: 50,
            left: 10,
            width: 100,
            height: 100,
          }}
          accessibilityLabel="Ruffie's cozy home"
        />
      )}

      {showCompie && (
        <>
          <Animated.Image
            source={compie}
            style={{
              width: 100,
              height: 100,
              position: 'absolute',
              bottom: compieBottom,
              left: screenWidth / 2 - 50,
              opacity: compieOpacity,
            }}
            accessibilityLabel="Compie the laptop"
          />
          {/* Eye dots */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#000',
              bottom: compieBottom + 55,
              left: screenWidth / 2 - 15,
              transform: [{ translateX: leftEyeX }, { translateY: leftEyeY }],
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#000',
              bottom: compieBottom + 55,
              left: screenWidth / 2 + 15,
              transform: [{ translateX: rightEyeX }, { translateY: rightEyeY }],
            }}
          />
        </>
      )}

      {showCompieQuote && (
        <View
          style={{
            position: 'absolute',
            bottom: screenHeight / 2 + 180,
            left: screenWidth / 2 - 70,
            backgroundColor: '#eef',
            borderRadius: 10,
            padding: 8,
            maxWidth: 140,
            elevation: 3,
          }}
        >
          <Text style={styles.quoteText}>“Not again...”</Text>
        </View>

      )}
      {showRehabSign && (
        <Image
          source={rehab}
          style={{
            position: 'absolute',
            bottom: 50,
            right: 10,
            width: 100,
            height: 100,
          }}
          accessibilityLabel="Caffeine rehab sign"
        />
      )}
      {showDragToRehab && (
        <Animated.Image
          source={draggedToRehab}
          style={{
            width: 120,
            height: 100,
            position: 'absolute',
            bottom: 50,
            transform: [{ translateX: rehabX }],
          }}
          accessibilityLabel="Skip dragging Rosie to rehab"
        />
      )}
      {showRosieRehabQuote && (
        <View style={styles.quoteBubble}>
          <Text style={styles.quoteText}>“I can quit whenever I want.”</Text>
        </View>
      )}
      {showRosiesMood && (
        <View style={styles.quoteBubble}>
          {rosieMood === 'neutral' && <Text style={styles.quoteText}>Just doing my job...</Text>}
          {rosieMood === 'annoyed' && <Text style={styles.quoteText}>Ugh. Really?</Text>}
          {rosieMood === 'grumbling' && <Text style={styles.quoteText}>...this is so dumb.</Text>}
          {rosieMood === 'furious' && <Text style={styles.quoteText}>WHY do I live here?!</Text>}
          {rosieMood === 'relieved' && <Text style={styles.quoteText}>Finally. Peace.</Text>}
          <Text style={styles.quoteText}>{remainingMugs} mugs left.</Text>
        </View>
      )}

      {mugSweepRef.current?.length > 0 &&
        mugSweepRef.current.map((xValue, index) =>
          visibleMugs[index] ? (
            <Animated.Image
              key={`sweep-${index}`}
              source={caffeineMug}
              style={{
                width: 30,
                height: 30,
                position: 'absolute',
                left: mugPositions.current[index].left,
                bottom: mugPositions.current[index].bottom,
                transform: [{ translateX: xValue }],
              }}
            />
          ) : null
        )}
      {showRosiesMood && (
        <Animated.Image
          source={getRosieSweepImage()}
          style={{
            width: 100,
            height: 100,
            position: 'absolute',
            left: 0, // required base for translateX
            bottom: 50, // 👈 this makes her start near the mugs!
            transform: [
              { translateX: rosieX },
              { translateY: rosieY },
              { translateY: Animated.subtract(rosieSweepY, 70) },

              { scaleX: rosieFacingLeft ? -1 : 1 },
            ],
          }}
          accessibilityLabel="Rosie sweeping a mug"
        />
      )}



    </View>
  );
} // ✅ closes TestPage component


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    padding: 20,
    textAlign: 'center',
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 20,
  },
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
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#333',
  },
});
