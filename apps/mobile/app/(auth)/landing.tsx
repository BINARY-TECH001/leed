import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import { Radar2, Flash, ShieldSecurity, ArrowRight2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IntroSlide {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  icon: any;
  accent: string;
}

const SLIDES: IntroSlide[] = [
  {
    id: 'slide-1',
    step: 'LEED RADAR · 01',
    title: 'Autonomous\nOpportunity Radar',
    subtitle:
      'State what you are looking for in plain English. Your background crawlers scan 24/7 across hundreds of public and private sources.',
    icon: Radar2,
    accent: '#FF6600',
  },
  {
    id: 'slide-2',
    step: 'MATCH INTELLIGENCE · 02',
    title: 'Inferred CV\nPrecision Matching',
    subtitle:
      'Deep match scoring calibrated to your demonstrated career history, strengths, and compensation floor. Zero noise.',
    icon: Flash,
    accent: '#0077B6',
  },
  {
    id: 'slide-3',
    step: 'DECISION ENGINE · 03',
    title: 'Autonomous Action,\nHuman Approvals',
    subtitle:
      'AI drafts personalized pitches, proposals, and cover letters in advance. You review and execute with a single tap.',
    icon: ShieldSecurity,
    accent: '#10B981',
  },
];

export default function LandingCarouselScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      router.push('/(auth)/signup');
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/signup');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar with Skip */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandLogo, { color: colors.text }]}>
            LEED<Text style={{ color: colors.accent }}>.</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.7}
          style={styles.skipButton}
        >
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Fullscreen Horizontal Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
      >
        {SLIDES.map((slide) => {
          const Icon = slide.icon;
          return (
            <View key={slide.id} style={[styles.slide, { width: SCREEN_WIDTH }]}>
              {/* Visual Graphic Area */}
              <View style={styles.graphicContainer}>
                <View
                  style={[
                    styles.outerGlowRing,
                    {
                      borderColor: slide.accent + (isDark ? '25' : '18'),
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.innerGlowRing,
                      {
                        backgroundColor: slide.accent + (isDark ? '20' : '12'),
                        borderColor: slide.accent + '35',
                      },
                    ]}
                  >
                    <Icon size={48} color={slide.accent} variant="Bold" />
                  </View>
                </View>
              </View>

              {/* Text Area with Generous Whitespace */}
              <View style={styles.textContainer}>
                <Text style={[styles.stepLabel, { color: slide.accent }]}>
                  {slide.step}
                </Text>

                <Text style={[styles.slideTitle, { color: colors.text }]}>
                  {slide.title}
                </Text>

                <Text style={[styles.slideSubtitle, { color: colors.textMuted }]}>
                  {slide.subtitle}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Pinned Navigation Area */}
      <View style={styles.bottomArea}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  isActive
                    ? [styles.activeDot, { backgroundColor: colors.accent }]
                    : [
                        styles.inactiveDot,
                        {
                          backgroundColor: isDark
                            ? colors.surfaceSecondary
                            : colors.border,
                        },
                      ],
                ]}
              />
            );
          })}
        </View>

        {/* Action Button */}
        {activeIndex === SLIDES.length - 1 ? (
          <View style={styles.finalActions}>
            <Button
              title="Get Started Free"
              variant="accent"
              size="lg"
              rightIcon={<ArrowRight2 size={18} color="#FFF" />}
              onPress={() => router.push('/(auth)/signup')}
              style={styles.fullWidthButton}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={styles.signInLink}
              activeOpacity={0.8}
            >
              <Text style={[styles.signInText, { color: colors.textSecondary }]}>
                Already have an account?{' '}
                <Text style={{ color: colors.accent, fontFamily: FONTS.bold }}>
                  Sign In
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.intermediateActions}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text style={[styles.signInShort, { color: colors.textMuted }]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <Button
              title="Next"
              variant="accent"
              size="md"
              rightIcon={<ArrowRight2 size={16} color="#FFF" />}
              onPress={handleNext}
              style={styles.nextButton}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    height: 48,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    fontSize: 24,
    fontFamily: FONTS.black,
    letterSpacing: -0.5,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  carousel: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphicContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  outerGlowRing: {
    width: 170,
    height: 170,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  innerGlowRing: {
    width: 110,
    height: 110,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: 340,
  },
  stepLabel: {
    fontSize: 11.5,
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
    marginBottom: SPACING.xs,
  },
  slideTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.6,
    marginBottom: SPACING.sm,
  },
  slideSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomArea: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.xl,
  },
  dot: {
    height: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  activeDot: {
    width: 28,
  },
  inactiveDot: {
    width: 8,
  },
  intermediateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signInShort: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  nextButton: {
    minWidth: 120,
  },
  finalActions: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  fullWidthButton: {
    width: '100%',
  },
  signInLink: {
    paddingVertical: 4,
  },
  signInText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
});
