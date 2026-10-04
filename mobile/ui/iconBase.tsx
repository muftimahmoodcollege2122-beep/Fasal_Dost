import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useTextCtx } from './web';
import { resolveColor, sizeFromClass } from './classes';

export function makeIcon(Icon: any) {
  const Wrapped = ({ className = '', size, color, strokeWidth, style, ...rest }: any) => {
    const ctx = useTextCtx();
    const px = size ?? sizeFromClass(className) ?? 24;
    const col = color ?? resolveColor(className, resolveColor(ctx.join(' '), '#0f172a'));
    const spin = className.includes('animate-spin');
    const rot = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      if (!spin) return;
      const loop = Animated.loop(Animated.timing(rot, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }));
      loop.start();
      return () => loop.stop();
    }, [spin]);
    const node = <Icon size={px} color={col} strokeWidth={strokeWidth ?? 2} {...rest} />;
    if (!spin) return style ? <Animated.View style={style}>{node}</Animated.View> : node;
    const deg = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    return <Animated.View style={[{ transform: [{ rotate: deg }] }, style]}>{node}</Animated.View>;
  };
  return Wrapped;
}
