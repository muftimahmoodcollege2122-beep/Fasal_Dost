// Play-Store style launch splash — same layout/copy as the web SplashScreen, native animations.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text } from 'react-native';
import { Sprout } from '../ui/icons';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, durationMs = 3000 }) => {
  const enter = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 700, delay: 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const fadeTimer = setTimeout(
      () => Animated.timing(fade, { toValue: 0, duration: 450, useNativeDriver: true }).start(),
      Math.max(0, durationMs - 450)
    );
    const endTimer = setTimeout(onFinish, durationMs);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [durationMs]);

  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const rise = enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const tilt = enter.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '0deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32, opacity: fade }}
    >
      <View style={{ alignItems: 'center' }}>
        <View style={{ marginBottom: 20 }}>
          <Animated.View style={{ position: 'absolute', top: -12, left: -12, right: -12, bottom: -12, borderRadius: 24, backgroundColor: 'rgba(241,245,249,0.7)', opacity: enter, transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.1] }) }] }} />
          <Animated.View
            style={{ width: 96, height: 96, borderRadius: 24, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', opacity: enter, transform: [{ translateY: rise }, { scale }, { rotate: tilt }], shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}
          >
            <Sprout size={48} color="#fff" strokeWidth={2.2} />
          </Animated.View>
        </View>
        <Animated.Text style={{ fontSize: 30, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, opacity: enter, transform: [{ translateY: rise }] }}>
          FasalDost
        </Animated.Text>
        <Animated.Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', marginTop: 6, letterSpacing: 1, opacity: enter }}>
          Guardian of Your Harvest
        </Animated.Text>
      </View>
    </Animated.View>
  );
};
