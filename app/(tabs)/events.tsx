import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '@/storage/useGameStore';
import { useAuthStore } from '@/storage/useAuthStore';
import { Quest, CampusEventItem } from '@/features/events/types/quest';
import {
  getAllScheduledReminders,
  scheduleEventReminder,
  cancelEventReminder,
} from '@/services/notifications';
import CreateEventModal from '@/features/events/components/CreateEventModal';
import AuthModal from '@/features/auth/components/AuthModal';

type TabSection = 'events' | 'quests';

export default function JournalAndEventsScreen() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<TabSection>('events');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Auth State
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Events State from Game Store
  const events = useGameStore((s) => s.events);
  const quests = useGameStore((s) => s.quests);
  const deleteCampusEvent = useGameStore((s) => s.deleteCampusEvent);

  const [scheduledIds, setScheduledIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [questFilter, setQuestFilter] = useState<'all' | 'available' | 'completed'>('all');

  const loadScheduled = async () => {
    try {
      const scheduled = await getAllScheduledReminders();
      const ids = scheduled
        .map((n) => n.content.data?.eventId as string)
        .filter(Boolean);
      setScheduledIds(ids);
    } catch (e) {
      console.log('Error loading scheduled reminders:', e);
    }
  };

  useEffect(() => {
    loadScheduled();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScheduled();
    setRefreshing(false);
  };

  // ตรวจสอบสิทธิ์ก่อนเปิดหน้าต่างสร้าง Event (W8 Auth Gate)
  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      Alert.alert(
        '🔒 ต้องเข้าสู่ระบบก่อน',
        'คุณต้องเข้าสู่ระบบ (Login) เพื่อสร้างกิจกรรมใหม่ในมหาลัย\nเมื่อ Logout จะไม่สามารถสร้าง Event ได้',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          {
            text: 'เข้าสู่ระบบทันที',
            onPress: () => setIsAuthModalOpen(true),
          },
        ]
      );
      return;
    }
    setIsCreateModalOpen(true);
  };

  // ตั้งการแจ้งเตือนกิจกรรมแบบกำหนดเวลาได้จริง
  const handleScheduleReminderCustom = (event: CampusEventItem) => {
    const isScheduled = scheduledIds.includes(event.id);

    if (isScheduled) {
      Alert.alert(
        'การแจ้งเตือนกิจกรรม',
        `กิจกรรม "${event.title}" มีการตั้งเตือนไว้แล้ว ต้องการยกเลิกใช่หรือไม่?`,
        [
          { text: 'คงไว้', style: 'cancel' },
          {
            text: 'ยกเลิกการแจ้งเตือน',
            style: 'destructive',
            onPress: async () => {
              try {
                const scheduled = await getAllScheduledReminders();
                const match = scheduled.find((n) => n.content.data?.eventId === event.id);
                if (match) {
                  await cancelEventReminder(match.identifier);
                }
                await loadScheduled();
                Alert.alert('ยกเลิกแล้ว', `ยกเลิกการแจ้งเตือน "${event.title}" เรียบร้อย`);
              } catch (e) {
                Alert.alert('ผิดพลาด', 'ไม่สามารถยกเลิกการแจ้งเตือนได้');
              }
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      '🔔 กำหนดเวลาแจ้งเตือนกิจกรรม',
      `เลือกเวลาที่ต้องการให้ระบบแจ้งเตือนสำหรับ "${event.title}":`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: '⏰ เมื่อถึงเวลาเริ่มกิจกรรมพอดี',
          onPress: async () => {
            try {
              await scheduleEventReminder(event, { customNotifyAt: event.startsAt });
              await loadScheduled();
              Alert.alert('ตั้งเตือนสำเร็จ', `ระบบจะแจ้งเตือนเมื่อถึงเวลาเริ่มกิจกรรม (${event.timeRangeText || 'ตามกำหนดการ'})`);
            } catch (e) {
              Alert.alert('ผิดพลาด', 'กรุณาอนุญาตสิทธิ์ Notification ในเครื่อง');
            }
          },
        },
        {
          text: '⏱️ เตือนล่วงหน้า 15 นาที',
          onPress: async () => {
            try {
              await scheduleEventReminder(event, { notifyMinutesBefore: 15 });
              await loadScheduled();
              Alert.alert('ตั้งเตือนสำเร็จ', 'ระบบจะแจ้งเตือนล่วงหน้า 15 นาทีก่อนเริ่มกิจกรรม');
            } catch (e) {
              Alert.alert('ผิดพลาด', 'กรุณาอนุญาตสิทธิ์ Notification ในเครื่อง');
            }
          },
        },
        {
          text: '⏳ เตือนล่วงหน้า 1 ชั่วโมง',
          onPress: async () => {
            try {
              await scheduleEventReminder(event, { notifyMinutesBefore: 60 });
              await loadScheduled();
              Alert.alert('ตั้งเตือนสำเร็จ', 'ระบบจะแจ้งเตือนล่วงหน้า 1 ชั่วโมงก่อนเริ่มกิจกรรม');
            } catch (e) {
              Alert.alert('ผิดพลาด', 'กรุณาอนุญาตสิทธิ์ Notification ในเครื่อง');
            }
          },
        },
      ]
    );
  };

  // ลบกิจกรรม (Delete Event)
  const handleDeleteEvent = (event: CampusEventItem) => {
    Alert.alert(
      'ยืนยันการลบกิจกรรม',
      `คุณต้องการลบกิจกรรม "${event.title}" และถอดภารกิจออกจากแผนที่ใช่หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบกิจกรรม',
          style: 'destructive',
          onPress: async () => {
            await deleteCampusEvent(event.id);
            await loadScheduled();
            Alert.alert('สำเร็จ', 'ลบกิจกรรมเรียบร้อยแล้ว');
          },
        },
      ]
    );
  };

  // Render Event Card พร้อมปุ่มเช็กอินโดยตรง
  const renderEventItem = ({ item }: { item: CampusEventItem }) => {
    const isScheduled = scheduledIds.includes(item.id);
    const date = new Date(item.startsAt);
    const linkedQuest = quests.find((q) => q.eventId === item.id || q.title.includes(item.title));
    const isQuestDone = linkedQuest?.status === 'completed';

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/events/[id]',
            params: { id: item.id },
          })
        }
      >
        {/* Event Cover Image */}
        {item.imageUrl && (
          <View style={styles.cardImageContainer}>
            <Image source={{ uri: item.imageUrl }} style={styles.cardCoverImage} />
            <View style={styles.imageOverlayGradient} />
            {item.timeRangeText && (
              <View style={styles.timeRangeBadge}>
                <Ionicons name="time" size={12} color="#fff" />
                <Text style={styles.timeRangeText}>{item.timeRangeText}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.eventBadge}>
              <Text style={styles.eventBadgeText}>{item.category}</Text>
            </View>
            {item.isCustomCreated && (
              <View style={styles.customCreatedBadge}>
                <Ionicons name="person" size={10} color="#38bdf8" />
                <Text style={styles.customCreatedText}>สร้างโดยผู้ใช้</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isScheduled ? (
              <View style={styles.scheduledBadge}>
                <Ionicons name="notifications" size={13} color="#22c55e" />
                <Text style={styles.scheduledText}>ตั้งเตือนแล้ว</Text>
              </View>
            ) : (
              <View style={styles.notScheduledBadge}>
                <Ionicons name="notifications-outline" size={13} color="#94a3b8" />
                <Text style={styles.notScheduledText}>ยังไม่ตั้งเตือน</Text>
              </View>
            )}

            {/* ปุ่มลบ Event (Delete Button) */}
            <TouchableOpacity
              style={styles.deleteEventBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteEvent(item);
              }}
            >
              <Ionicons name="trash-outline" size={15} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={15} color="#38bdf8" />
          <Text style={styles.infoText}>
            {date.toLocaleDateString('th-TH', {
              day: 'numeric',
              month: 'short',
            })}{' '}
            • {item.timeRangeText || `${date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={15} color="#94a3b8" />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.location.name}
          </Text>
        </View>

        {/* Check-in & Rewards Status */}
        <View style={styles.eventRewardRow}>
          <Text style={styles.rewardText}>
            รางวัล: +{item.rewardXp} XP • 🪙 {item.rewardCoins} Coins
          </Text>
          {isQuestDone && (
            <View style={styles.eventDoneBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#22c55e" />
              <Text style={styles.eventDoneBadgeText}>เช็กอินแล้ว</Text>
            </View>
          )}
        </View>

        {/* Footer Actions */}
        <View style={styles.cardFooter}>
          <Pressable
            style={[
              styles.quickReminderBtn,
              isScheduled && styles.quickReminderBtnActive,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleScheduleReminderCustom(item);
            }}
          >
            <Ionicons
              name={isScheduled ? 'notifications' : 'notifications-outline'}
              size={15}
              color={isScheduled ? '#22c55e' : '#fff'}
            />
            <Text
              style={[
                styles.quickReminderBtnText,
                isScheduled && styles.quickReminderBtnTextActive,
              ]}
            >
              {isScheduled ? '🔔 แก้ไข/ยกเลิกเตือน' : '🔔 กำหนดเวลาเตือน'}
            </Text>
          </Pressable>

          {/* ปุ่มไปเช็กอินรับภารกิจโดยตรง */}
          <TouchableOpacity
            style={[styles.checkInActionBtn, isQuestDone && styles.checkInActionBtnDone]}
            onPress={(e) => {
              e.stopPropagation();
              router.push('/(tabs)');
            }}
          >
            <Ionicons
              name={isQuestDone ? "checkmark-circle" : "navigate"}
              size={14}
              color="#fff"
            />
            <Text style={styles.checkInActionBtnText}>
              {isQuestDone ? 'เช็กอินแล้ว' : 'ไปเช็กอิน'}
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  // Render Quest Item
  const renderQuestItem = ({ item }: { item: Quest }) => {
    const isCompleted = item.status === 'completed';

    return (
      <Pressable
        style={[styles.card, isCompleted && styles.cardCompleted]}
        onPress={() => router.push('/(tabs)')}
      >
        {item.imageUrl && (
          <View style={styles.cardImageContainer}>
            <Image source={{ uri: item.imageUrl }} style={styles.cardCoverImage} />
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={[styles.eventBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <Text style={[styles.eventBadgeText, { color: '#38bdf8' }]}>
              {item.category.toUpperCase()} • {item.difficulty}
            </Text>
          </View>

          {isCompleted ? (
            <View style={styles.scheduledBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#22c55e" />
              <Text style={styles.scheduledText}>สำเร็จแล้ว</Text>
            </View>
          ) : (
            <Text style={{ color: '#38bdf8', fontWeight: '800', fontSize: 12 }}>
              +{item.rewardXp} XP
            </Text>
          )}
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={15} color="#94a3b8" />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.location.name}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={{ color: '#fef08a', fontSize: 12, fontWeight: '700' }}>
            รางวัล: 🪙 {item.rewardCoins} Coins {item.rewardItem ? `+ 🎁 ${item.rewardItem.name}` : ''}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#38bdf8" />
        </View>
      </Pressable>
    );
  };

  const filteredQuests = quests.filter((q) => {
    if (questFilter === 'available') return q.status !== 'completed';
    if (questFilter === 'completed') return q.status === 'completed';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>EVENTS & QUESTS</Text>
          <Text style={styles.subtitle}>
            กิจกรรมมหาลัย, จัดการ Event & เช็กอินรับภารกิจ (W11)
          </Text>
        </View>

        {/* Create Event Button (Protected by Auth) */}
        <TouchableOpacity
          style={[styles.createEventBtn, !isAuthenticated && styles.createEventBtnDisabled]}
          onPress={handleOpenCreateModal}
          activeOpacity={0.8}
        >
          <Ionicons name={isAuthenticated ? "add" : "lock-closed"} size={16} color="#fff" />
          <Text style={styles.createEventBtnText}>
            {isAuthenticated ? 'สร้าง Event' : 'เข้าสู่ระบบก่อนสร้าง'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Switcher */}
      <View style={styles.mainTabSwitcher}>
        <Pressable
          style={[styles.switcherBtn, activeSection === 'events' && styles.switcherBtnActive]}
          onPress={() => setActiveSection('events')}
        >
          <Ionicons
            name="calendar"
            size={16}
            color={activeSection === 'events' ? '#fff' : '#94a3b8'}
          />
          <Text style={[styles.switcherBtnText, activeSection === 'events' && styles.switcherBtnTextActive]}>
            กิจกรรม & ตั้งเตือน ({events.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.switcherBtn, activeSection === 'quests' && styles.switcherBtnActive]}
          onPress={() => setActiveSection('quests')}
        >
          <Ionicons
            name="map"
            size={16}
            color={activeSection === 'quests' ? '#fff' : '#94a3b8'}
          />
          <Text style={[styles.switcherBtnText, activeSection === 'quests' && styles.switcherBtnTextActive]}>
            เควสต์สำรวจ ({quests.length})
          </Text>
        </Pressable>
      </View>

      {/* Content Section */}
      {activeSection === 'events' ? (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.subFilterRow}>
            {(['all', 'available', 'completed'] as const).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.subFilterTab, questFilter === tab && styles.subFilterTabActive]}
                onPress={() => setQuestFilter(tab)}
              >
                <Text
                  style={[
                    styles.subFilterTabText,
                    questFilter === tab && styles.subFilterTabTextActive,
                  ]}
                >
                  {tab === 'all' ? 'ทั้งหมด' : tab === 'available' ? 'ยังไม่เสร็จ' : 'สำเร็จแล้ว'}
                </Text>
              </Pressable>
            ))}
          </View>

          <FlatList
            data={filteredQuests}
            keyExtractor={(item) => item.id}
            renderItem={renderQuestItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        visible={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  createEventBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 3,
  },
  createEventBtnDisabled: {
    backgroundColor: '#334155',
  },
  createEventBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  mainTabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  switcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  switcherBtnActive: {
    backgroundColor: '#0284c7',
  },
  switcherBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  switcherBtnTextActive: {
    color: '#fff',
  },
  subFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  subFilterTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#1e293b',
  },
  subFilterTabActive: {
    backgroundColor: '#0284c7',
  },
  subFilterTabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  subFilterTabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardImageContainer: {
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 12,
    height: 140,
    position: 'relative',
    backgroundColor: '#1e293b',
  },
  cardCoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  timeRangeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  timeRangeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  cardCompleted: {
    opacity: 0.65,
    borderColor: '#166534',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  eventBadgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  customCreatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customCreatedText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '600',
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scheduledText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '700',
  },
  notScheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  notScheduledText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  deleteEventBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  quickReminderBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  quickReminderBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  quickReminderBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  quickReminderBtnTextActive: {
    color: '#ef4444',
  },
  detailLinkText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  eventRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 6,
  },
  rewardText: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: '700',
  },
  eventDoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  eventDoneBadgeText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '700',
  },
  checkInActionBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  checkInActionBtnDone: {
    backgroundColor: '#166534',
  },
  checkInActionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
