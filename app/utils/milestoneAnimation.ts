import { Animated, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export const slideCharacter = (
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

export const mugFall = (
  mugsRef: React.MutableRefObject<any[]>,
  setShowRosieQuote: (v: boolean) => void
) => {
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

export const moveRosieToMug = (
  index: number,
  mugPositions: React.MutableRefObject<{ left: number; bottom: number }[]>,
  rosieX: Animated.Value,
  rosieY: Animated.Value,
  rosieLastX: React.MutableRefObject<number>,
  setRosieFacingLeft: (v: boolean) => void,
  setVisibleMugs: (v: (prev: boolean[]) => boolean[]) => void,
  setRemainingMugs: (v: (prev: number) => number) => void,
  setRosieMood: (v: string) => void,
  visibleMugs: boolean[]
) => {
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
    rosieLastX.current = target.left;

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
      setTimeout(() =>
        moveRosieToMug(
          index + 1,
          mugPositions,
          rosieX,
          rosieY,
          rosieLastX,
          setRosieFacingLeft,
          setVisibleMugs,
          setRemainingMugs,
          setRosieMood,
          visibleMugs
        ), 400);
    }
  });
};

export const sendRuffieToSchool = (
  setShowSchoolSign: (v: boolean) => void,
  setShowRuffieSlide: (v: boolean) => void,
  slideCharacter: (
    xValue: Animated.Value,
    duration: number,
    direction: 'right' | 'left',
    onFinish?: () => void
  ) => void,
  ruffieX: Animated.Value
) => {
  setShowSchoolSign(true);
  setShowRuffieSlide(true);

  slideCharacter(ruffieX, 15000, 'right', () => {
    setShowRuffieSlide(false);
    setShowSchoolSign(false);
  });
};
