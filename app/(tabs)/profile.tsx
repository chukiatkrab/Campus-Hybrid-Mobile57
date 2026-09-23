import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View, TouchableOpacity, Linking, Alert, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/hooks/use-color-scheme';

const c = {
  light: {
    bg: '#FFFFFF',
    surface: 'rgba(255,255,255,0.75)',
    surfaceBorder: 'rgba(0,0,0,0.05)',
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    textTertiary: '#C7C7CC',
    accent: '#0a7ea4',
    divider: '#F2F2F7',
    shadow: '#000',
    glassBg: 'rgba(255,255,255,0.7)',
    glassBorder: 'rgba(255,255,255,0.5)',
    quoteBg: 'rgba(10,126,164,0.05)',
    quoteBorder: 'rgba(10,126,164,0.15)',
    quoteText: '#0a7ea4',
  },
  dark: {
    bg: '#000000',
    surface: 'rgba(30,30,30,0.75)',
    surfaceBorder: 'rgba(255,255,255,0.07)',
    text: '#FFFFFF',
    textSecondary: '#98989E',
    textTertiary: '#48484A',
    accent: '#0a7ea4',
    divider: '#1C1C1E',
    shadow: '#000',
    glassBg: 'rgba(30,30,30,0.7)',
    glassBorder: 'rgba(255,255,255,0.07)',
    quoteBg: 'rgba(10,126,164,0.08)',
    quoteBorder: 'rgba(10,126,164,0.2)',
    quoteText: '#5ac8fa',
  },
};

const PROFILE = {
  name: 'นายชูเกียรติ คำมณีจันทร์',
  studentId: '663450174-1',
  program: 'วิทยาการคอมพิวเตอร์และสารสนเทศ',
  major: 'สาขาวิทยาการคอมพิวเตอร์และสารสนเทศ',
  email: 'chukiat.ka@kkumail.com',
  phone: '0968607772',
};

const QUOTE =
  'มีงานให้ทำ แต่ถ้ามีอย่างอื่นทำ อย่างอื่นก่อนทำงานเสมอ';

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const t = c[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const handleEmail = () => {
    Linking.openURL(`mailto:${PROFILE.email}`).catch(() =>
      Alert.alert('Error', 'ไม่สามารถเปิดแอปอีเมลได้')
    );
  };

  const handlePhone = () => {
    Linking.openURL(`tel:${PROFILE.phone.replace(/[^0-9]/g, '')}`).catch(() =>
      Alert.alert('Error', 'ไม่สามารถโทรออกได้')
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative top accent */}
        <View style={[styles.topAccent, { backgroundColor: t.accent }]} />

        {/* Profile Image */}
        <View style={styles.imageSection}>
          <LinearGradient
            colors={[t.accent + '30', 'transparent']}
            style={styles.imageGlowBorder}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={[styles.imageGlow, { shadowColor: t.accent }]}>
            <Image
              source={require('../../assets/images/ME2.jpg')}
              style={styles.profileImage}
              contentFit="cover"
              transition={600}
            />
          </View>
        </View>

        {/* Name & Student ID */}
        <View style={styles.nameSection}>
          <Text style={[styles.name, { color: t.text }]}>{PROFILE.name}</Text>
          <View
            style={[
              styles.idBadge,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
            ]}
          >
            <Ionicons name="id-card-outline" size={14} color={t.textSecondary} />
            <Text style={[styles.idText, { color: t.textSecondary }]}>{PROFILE.studentId}</Text>
          </View>
        </View>

        {/* Glassmorphism Education Card */}
        <View
          style={[
            styles.glassCard,
            { backgroundColor: t.glassBg, borderColor: t.glassBorder, shadowColor: t.shadow },
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(10,126,164,0.08)', 'transparent']
                : ['rgba(10,126,164,0.04)', 'transparent']
            }
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: t.accent + '18' }]}>
              <Ionicons name="school" size={20} color={t.accent} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: t.text }]}>การศึกษา</Text>
              <Text style={[styles.cardSubtitle, { color: t.textSecondary }]}>Education</Text>
            </View>
          </View>
          <Text style={[styles.cardProgram, { color: t.text }]}>{PROFILE.program}</Text>
          <Text style={[styles.cardMajor, { color: t.textSecondary }]}>{PROFILE.major}</Text>
        </View>

        {/* Quote */}
        <View
          style={[
            styles.quoteCard,
            {
              backgroundColor: t.quoteBg,
              borderColor: t.quoteBorder,
            },
          ]}
        >
          <View style={styles.quoteMark}>
            <Text style={[styles.quoteMarkText, { color: t.quoteText }]}>{'\u201C'}</Text>
          </View>
          <Text style={[styles.quoteText, { color: t.quoteText }]}>{QUOTE}</Text>
        </View>

        {/* Decorative Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: t.divider }]} />
          <View style={[styles.dividerDot, { backgroundColor: t.accent }]} />
          <View style={[styles.dividerLine, { backgroundColor: t.divider }]} />
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>CONTACT</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[
                styles.socialBtn,
                {
                  backgroundColor: t.surface,
                  borderColor: t.surfaceBorder,
                  shadowColor: t.shadow,
                },
              ]}
              onPress={handleEmail}
              activeOpacity={0.7}
            >
              <View style={[styles.socialIconBox, { backgroundColor: t.accent + '15' }]}>
                <Ionicons name="mail" size={22} color={t.accent} />
              </View>
              <Text style={[styles.socialLabel, { color: t.textSecondary }]}>Email</Text>
              <Text style={[styles.socialValue, { color: t.text }]} numberOfLines={1}>
                {PROFILE.email}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.socialBtn,
                {
                  backgroundColor: t.surface,
                  borderColor: t.surfaceBorder,
                  shadowColor: t.shadow,
                },
              ]}
              onPress={handlePhone}
              activeOpacity={0.7}
            >
              <View style={[styles.socialIconBox, { backgroundColor: t.accent + '15' }]}>
                <Ionicons name="call" size={22} color={t.accent} />
              </View>
              <Text style={[styles.socialLabel, { color: t.textSecondary }]}>Phone</Text>
              <Text style={[styles.socialValue, { color: t.text }]}>{PROFILE.phone}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary Button */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: t.accent, shadowColor: t.accent }]}
          onPress={handleEmail}
          activeOpacity={0.85}
        >
          <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Contact Me</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  /* Top Accent */
  topAccent: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
  },

  /* Image */
  imageSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  imageGlowBorder: {
    position: 'absolute',
    width: 185,
    height: 185,
    borderRadius: 93,
    top: -7,
  },
  imageGlow: {
    width: 170,
    height: 170,
    borderRadius: 85,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  profileImage: {
    width: 170,
    height: 170,
    borderRadius: 85,
  },

  /* Name */
  nameSection: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  idText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  /* Glassmorphism Card */
  glassCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    marginBottom: 28,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    gap: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  cardProgram: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 4,
  },
  cardMajor: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },

  /* Sections */
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 14,
  },

  /* Quote */
  quoteCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
    marginBottom: 28,
    alignItems: 'center',
  },
  quoteMark: {
    marginBottom: 8,
  },
  quoteMarkText: {
    fontSize: 36,
    fontWeight: '300',
    lineHeight: 40,
    opacity: 0.5,
  },
  quoteText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.2,
    fontStyle: 'italic',
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 28,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  /* Social */
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  socialIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  socialValue: {
    fontSize: 11,
    fontWeight: '400',
    opacity: 0.7,
  },

  /* Primary Button */
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
