// ─────────────────────────────────────────────────────────────────────────────
// App.js
//
// PURPOSE:
//   Root component of FasalDost.
//   Sets up navigation, safe area, and gesture handler providers.
//   Defines the full screen stack with transition animations.
//   Wraps everything in an ErrorBoundary to catch unexpected crashes.
//
// SCREEN STACK:
//   Home            → Main screen (camera/gallery buttons, greeting)
//   Scan            → Crop selector + AI analysis trigger
//   Result          → Disease detection result display
//   History         → Past scan records
//   FarmerProfile   → Farmer data collection (onboarding + edit mode)
//
// ERROR BOUNDARY:
//   Catches any unhandled JavaScript error in the component tree.
//   Instead of a white crash screen, shows a friendly Urdu/English message.
//   Logs the error for debugging.
//
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// ── Navigation ────────────────────────────────────────────────────────────────
import { NavigationContainer }         from '@react-navigation/native';
import { createStackNavigator }        from '@react-navigation/stack';

// ── Safe Area ─────────────────────────────────────────────────────────────────
import { SafeAreaProvider }            from 'react-native-safe-area-context';

// ── Gesture Handler ───────────────────────────────────────────────────────────
import { GestureHandlerRootView }      from 'react-native-gesture-handler';

// ── Screens ───────────────────────────────────────────────────────────────────
import HomeScreen          from './src/screens/HomeScreen';
import ScanScreen          from './src/screens/ScanScreen';
import ResultScreen        from './src/screens/ResultScreen';
import HistoryScreen       from './src/screens/HistoryScreen';
import FarmerProfileScreen from './src/screens/FarmerProfileScreen';

// ── Theme ─────────────────────────────────────────────────────────────────────
import { colors } from './src/utils/theme';

// Create the stack navigator instance
const Stack = createStackNavigator();

// ── Custom slide transition animation ─────────────────────────────────────────
const slideFromRight = {
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      transform: [{
        translateX: current.progress.interpolate({
          inputRange:  [0, 1],
          outputRange: [layouts.screen.width, 0],
        }),
      }],
    },
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// ERROR BOUNDARY
//
// React class component that catches JavaScript errors anywhere in the
// component tree below it. Must be a class component — hooks cannot do this.
//
// Without this: any unexpected error = white screen of death.
// With this:    any unexpected error = friendly message + retry button.
// ─────────────────────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,  // True after an error is caught
      error:    null,   // The actual error object for debugging
    };
  }

  // Called when a descendant component throws an error
  // Updates state so the fallback UI renders on next render
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Called after error is caught — good place to log to a crash service
  componentDidCatch(error, info) {
    console.error('[FasalDost ErrorBoundary] Caught error:', error);
    console.error('[FasalDost ErrorBoundary] Component stack:', info.componentStack);
  }

  // Retry: reset error state so the app tries to render again
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // ── Fallback UI — shown instead of crash ──────────────────────────
      return (
        <View style={errStyles.container}>
          <Text style={errStyles.emoji}>🌾</Text>
          <Text style={errStyles.titleUr}>کچھ خرابی آ گئی</Text>
          <Text style={errStyles.titleEn}>Something went wrong</Text>
          <Text style={errStyles.desc}>
            براہ کرم دوبارہ کوشش کریں{'\n'}Please tap retry to continue
          </Text>
          <TouchableOpacity style={errStyles.btn} onPress={this.handleRetry}>
            <Text style={errStyles.btnText}>↩ Retry / دوبارہ کوشش</Text>
          </TouchableOpacity>
          {/* Show error details in development only */}
          {__DEV__ && this.state.error ? (
            <Text style={errStyles.devError}>
              {this.state.error.toString()}
            </Text>
          ) : null}
        </View>
      );
    }

    // No error — render children normally
    return this.props.children;
  }
}

// Styles for the error boundary fallback screen
const errStyles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: '#061206',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         32,
  },
  emoji:    { fontSize: 64, marginBottom: 16 },
  titleUr:  { fontSize: 22, fontWeight: '800', color: '#F4B942', marginBottom: 8, textAlign: 'center' },
  titleEn:  { fontSize: 18, fontWeight: '700', color: '#F5EDD6', marginBottom: 16, textAlign: 'center' },
  desc:     { fontSize: 14, color: 'rgba(245,237,214,0.65)', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  btn: {
    backgroundColor: '#F4B942',
    paddingHorizontal: 32,
    paddingVertical:   14,
    borderRadius:      999,
  },
  btnText:   { fontSize: 15, fontWeight: '800', color: '#061206' },
  devError:  { marginTop: 24, fontSize: 11, color: '#F87171', textAlign: 'center', lineHeight: 18 },
});

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    // ErrorBoundary: outermost wrapper — catches ALL component crashes
    <ErrorBoundary>
      {/* GestureHandlerRootView: enables swipe gestures for navigation */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* SafeAreaProvider: provides notch/status bar insets to all screens */}
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor={colors.forestDeep} />
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerShown: false,
                cardStyle:   { backgroundColor: colors.forestDeep },
                ...slideFromRight,
              }}
            >
              <Stack.Screen name="Home"         component={HomeScreen}          />
              <Stack.Screen name="Scan"         component={ScanScreen}          />
              <Stack.Screen name="Result"       component={ResultScreen}        />
              <Stack.Screen name="History"      component={HistoryScreen}       />
              <Stack.Screen name="FarmerProfile" component={FarmerProfileScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}