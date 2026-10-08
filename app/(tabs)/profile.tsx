import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Linking, Alert, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useGameStore } from '@/storage/useGameStore';
import { useAuthStore } from '@/storage/useAuthStore';
import AuthModal from '@/features/auth/components/AuthModal';

export default function ProfileAndInventoryScreen() {
  const insets = useSafeAreaInsets();
  const player = useGameStore((s) => s.player);
  const inventory = useGameStore((s) => s.inventory);
  const quests = useGameStore((s) => s.quests);
  const resetQuests = useGameStore((s) => s.resetQuests);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  // ดึงรายการเควสต์/กิจกรรมที่มีการถ่ายรูปส่งหลักฐานในแอป
  const completedProofQuests = quests.filter((q) => q.status === 'completed' && q.proofPhotoUri);

  const handleEmail = () => {
    Linking.openURL('mailto:chukiat.ka@kkumail.com').catch(() =>
      Alert.alert('Error', 'ไม่สามารถเปิดแอปอีเมลได้')
    );
  };

  const handleLogout = () => {
    Alert.alert('ออกจากระบบ', 'เมื่อออกจากระบบ คุณจะไม่สามารถสร้าง Event กิจกรรมใหม่ได้ ต้องการออกจากระบบหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ออกจากระบบ',
        style: 'destructive',
        onPress: async () => {
          await logout();
          Alert.alert('ออกจากระบบแล้ว', 'ขณะนี้คุณอยู่ในสถานะ Guest (จะไม่สามารถสร้าง Event ได้จนกว่าจะ Login อีกครั้ง)');
        },
      },
    ]);
  };

  const handleResetData = () => {
    Alert.alert(
      'รีเซ็ตข้อมูลเกม',
      'คุณต้องการรีเซ็ตความคืบหน้าเควสต์ เลเวล และไอเทมกลับเป็นค่าเริ่มต้นหรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'รีเซ็ตข้อมูล',
          style: 'destructive',
          onPress: () => {
            resetQuests();
            Alert.alert('สำเร็จ', 'รีเซ็ตข้อมูลเกมเรียบร้อยแล้ว');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Auth Session Bar */}
        <View style={styles.authBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <View
              style={[
                styles.authStatusDot,
                { backgroundColor: isAuthenticated ? '#22c55e' : '#ef4444' },
              ]}
            />
            <Text style={styles.authStatusText} numberOfLines={1}>
              {isAuthenticated
                ? `ออนไลน์: ${user?.name || user?.username || 'นักสำรวจ'}`
                : 'ออฟไลน์ (Guest - สร้าง Event ไม่ได้)'}
            </Text>
          </View>

          {isAuthenticated ? (
            <TouchableOpacity style={styles.authActionBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={14} color="#ef4444" />
              <Text style={styles.authActionBtnTextDanger}>Logout</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.authActionBtnPrimary}
              onPress={() => setIsAuthModalVisible(true)}
            >
              <Ionicons name="log-in-outline" size={14} color="#fff" />
              <Text style={styles.authActionBtnTextPrimary}>Login</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Character Card / Avatar */}
        <View style={styles.imageSection}>
          <View style={styles.imageGlow}>
            <Image
              source={require('../../assets/images/ME2.jpg')}
              style={styles.profileImage}
              contentFit="cover"
              transition={400}
            />
          </View>

          <View style={styles.levelTag}>
            <Text style={styles.levelTagText}>Lv. {player.level}</Text>
          </View>
        </View>

        {/* Character Name & Titles */}
        <View style={styles.nameSection}>
          <Text style={styles.name}>{isAuthenticated ? (user?.name || player.name) : 'Guest Explorer'}</Text>
          <Text style={styles.titleSub}>{player.title}</Text>
          <View style={styles.idBadge}>
            <Ionicons name="id-card-outline" size={13} color="#94a3b8" />
            <Text style={styles.idText}>
              {isAuthenticated ? (user?.studentId || player.studentId) : 'ผู้เยี่ยมชม'} • {player.department}
            </Text>
          </View>
        </View>

        {/* RPG Stat Dashboard */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Ionicons name="shield" size={18} color="#38bdf8" />
            <Text style={styles.statVal}>{player.explorationRank}</Text>
            <Text style={styles.statLbl}>Exploration Rank</Text>
          </View>

          <View style={styles.dividerV} />

          <View style={styles.statBox}>
            <Ionicons name="sparkles" size={18} color="#eab308" />
            <Text style={styles.statVal}>{player.coins}</Text>
            <Text style={styles.statLbl}>Gold Coins</Text>
          </View>

          <View style={styles.dividerV} />

          <View style={styles.statBox}>
            <Ionicons name="trophy" size={18} color="#22c55e" />
            <Text style={styles.statVal}>{player.questsCompletedCount}</Text>
            <Text style={styles.statLbl}>Quests Done</Text>
          </View>
        </View>

        {/* XP Progress Bar */}
        <View style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpCardTitle}>ค่าประสบการณ์ (Experience)</Text>
            <Text style={styles.xpCardValue}>
              {player.currentXp} / {player.requiredXp} XP
            </Text>
          </View>
          <View style={styles.xpTrack}>
            <LinearGradient
              colors={['#0284c7', '#38bdf8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.xpFill,
                { width: `${Math.min(100, (player.currentXp / player.requiredXp) * 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* In-App Submitted Photos Gallery (รูปที่ถ่ายส่งแล้วในแอป) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📸 รูปถ่ายหลักฐานที่ส่งแล้วในแอป</Text>
          <Text style={styles.sectionCount}>{completedProofQuests.length} ภาพ</Text>
        </View>

        {completedProofQuests.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.proofPhotoScroll}>
            {completedProofQuests.map((q) => (
              <View key={q.id} style={styles.proofCard}>
                <Image source={{ uri: q.proofPhotoUri }} style={styles.proofImage} />
                <View style={styles.proofBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                  <Text style={styles.proofBadgeText}>ส่งแล้ว</Text>
                </View>
                <Text style={styles.proofQuestTitle} numberOfLines={1}>{q.title}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyProofBox}>
            <Ionicons name="camera-outline" size={26} color="#64748b" />
            <Text style={styles.emptyProofText}>ยังไม่มีรูปถ่ายหลักฐานที่ส่ง</Text>
            <Text style={styles.emptyProofSub}>เมื่อถ่ายรูปส่งเควสต์หรือกิจกรรม รูปจะมาปรากฏที่นี่</Text>
          </View>
        )}

        {/* Inventory Section (W2, W3, W5, W7) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎒 กระเป๋าไอเทม & เหรียญตรา (INVENTORY)</Text>
          <Text style={styles.sectionCount}>{inventory.length} ชิ้น</Text>
        </View>

        <View style={styles.inventoryGrid}>
          {inventory.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemIconBox}>
                <Ionicons name={item.icon as any || 'gift'} size={24} color="#38bdf8" />
              </View>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemRarity}>{item.rarity}</Text>
              <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
            </View>
          ))}
        </View>

        {/* Contact and Reset Buttons */}
        <TouchableOpacity style={styles.contactBtn} onPress={handleEmail} activeOpacity={0.8}>
          <Ionicons name="mail" size={18} color="#fff" />
          <Text style={styles.contactBtnText}>ติดต่อนักพัฒนานักสำรวจ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={handleResetData} activeOpacity={0.8}>
          <Ionicons name="refresh" size={16} color="#ef4444" />
          <Text style={styles.resetBtnText}>รีเซ็ตสถิติและการทดสอบเกม</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Auth Modal */}
      <AuthModal
        visible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  authBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  authStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  authStatusText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  authActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  authActionBtnTextDanger: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  authActionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  authActionBtnTextPrimary: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  imageSection: {
    marginBottom: 14,
    alignItems: 'center',
    position: 'relative',
  },
  imageGlow: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: '#38bdf8',
    elevation: 8,
  },
  profileImage: {
    width: 124,
    height: 124,
    borderRadius: 62,
  },
  levelTag: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#090d16',
  },
  levelTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  titleSub: {
    fontSize: 13,
    color: '#38bdf8',
    fontWeight: '600',
    marginTop: 2,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  idText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  statsCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 14,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  statLbl: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  dividerV: {
    width: 1,
    height: 30,
    backgroundColor: '#1e293b',
  },
  xpCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 18,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpCardTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  xpCardValue: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
  },
  xpTrack: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
  },
  sectionHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionCount: {
    color: '#94a3b8',
    fontSize: 12,
  },
  proofPhotoScroll: {
    width: '100%',
    marginBottom: 18,
  },
  proofCard: {
    width: 140,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginRight: 10,
    paddingBottom: 8,
  },
  proofImage: {
    width: '100%',
    height: 90,
  },
  proofBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proofBadgeText: {
    color: '#4ade80',
    fontSize: 9,
    fontWeight: '700',
  },
  proofQuestTitle: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    marginTop: 6,
  },
  emptyProofBox: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 18,
  },
  emptyProofText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyProofSub: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  inventoryGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  itemRarity: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  itemDesc: {
    color: '#94a3b8',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },
  contactBtn: {
    width: '100%',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contactBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  resetBtn: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resetBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
});
