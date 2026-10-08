import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  scheduleEventReminder,
  cancelEventReminder,
  getAllScheduledReminders,
} from '@/services/notifications';
import { useGameStore } from '@/storage/useGameStore';
import { CampusEventItem, Quest } from '@/features/events/types/quest';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const events = useGameStore((s) => s.events);
  const quests = useGameStore((s) => s.quests);
  const deleteCampusEvent = useGameStore((s) => s.deleteCampusEvent);

  const [event, setEvent] = useState<CampusEventItem | null>(null);
  const [scheduledNotificationId, setScheduledNotificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ค้นหาเควสต์ที่ผูกกับ Event นี้
  const linkedQuest = quests.find((q) => q.eventId === id || q.title.includes(event?.title || ''));

  useEffect(() => {
    const found = events.find((e) => e.id === id);
    setEvent(found || null);
    checkScheduledStatus(id);
  }, [id, events]);

  const checkScheduledStatus = async (eventId?: string) => {
    if (!eventId) return;
    try {
      const scheduled = await getAllScheduledReminders();
      const match = scheduled.find(
        (n) => n.content.data?.eventId === eventId
      );
      if (match) {
        setScheduledNotificationId(match.identifier);
      } else {
        setScheduledNotificationId(null);
      }
    } catch (e) {
      console.log('Error checking scheduled reminders:', e);
    }
  };

  const handleScheduleReminderWithOptions = () => {
    if (!event) return;

    if (scheduledNotificationId) {
      Alert.alert(
        'การแจ้งเตือนกิจกรรม',
        'กิจกรรมนี้มีการตั้งเตือนไว้แล้ว คุณต้องการยกเลิกใช่หรือไม่?',
        [
          { text: 'คงไว้', style: 'cancel' },
          {
            text: 'ยกเลิกการแจ้งเตือน',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                await cancelEventReminder(scheduledNotificationId);
                setScheduledNotificationId(null);
                Alert.alert('ยกเลิกแล้ว', 'ยกเลิกการแจ้งเตือนเรียบร้อย');
              } catch (e) {
                Alert.alert('ผิดพลาด', 'ไม่สามารถยกเลิกการแจ้งเตือนได้');
              } finally {
                setLoading(false);
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
              setLoading(true);
              const notifId = await scheduleEventReminder(event, { customNotifyAt: event.startsAt });
              setScheduledNotificationId(notifId);
              Alert.alert('ตั้งเตือนสำเร็จ', `ระบบจะแจ้งเตือนเมื่อถึงเวลาเริ่ม (${event.timeRangeText || 'ตามเวลาเริ่ม'})`);
            } catch (err) {
              Alert.alert('ผิดพลาด', 'กรุณาอนุญาตสิทธิ์แจ้งเตือนในเครื่อง');
            } finally {
              setLoading(false);
            }
          },
        },
        {
          text: '⏱️ เตือนล่วงหน้า 15 นาที',
          onPress: async () => {
            try {
              setLoading(true);
              const notifId = await scheduleEventReminder(event, { notifyMinutesBefore: 15 });
              setScheduledNotificationId(notifId);
              Alert.alert('ตั้งเตือนสำเร็จ', 'ระบบจะแจ้งเตือนล่วงหน้า 15 นาทีก่อนเริ่มกิจกรรม');
            } catch (err) {
              Alert.alert('ผิดพลาด', 'กรุณาอนุญาตสิทธิ์แจ้งเตือนในเครื่อง');
            } finally {
              setLoading(false);
            }
          },
        },
        {
          text: '⏳ เตือนล่วงหน้า 1 ชั่วโมง',
          onPress: async () => {
            try {
              setLoading(true);
              const notifId = await scheduleEventReminder(event, { notifyMinutesBefore: 60 });
              setScheduledNotificationId(notifId);
              Alert.alert('ตั้งเตือนสำเร็จ', 'ระบบจะแจ้งเตือนล่วงหน้า 1 ชั่วโมงก่อนเริ่มกิจกรรม');
            } catch (err) {
              Alert.alert('ผิดพลาด', 'กรุณาอนุญาตสิทธิ์แจ้งเตือนในเครื่อง');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteEvent = () => {
    if (!event) return;

    Alert.alert(
      'ลบกิจกรรมนี้',
      `คุณต้องการลบกิจกรรม "${event.title}" ออกจากระบบใช่หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบกิจกรรม',
          style: 'destructive',
          onPress: async () => {
            await deleteCampusEvent(event.id);
            Alert.alert('สำเร็จ', 'ลบกิจกรรมเรียบร้อยแล้ว', [
              {
                text: 'ตกลง',
                onPress: () => router.back(),
              },
            ]);
          },
        },
      ]
    );
  };

  const handleGoCheckInQuest = () => {
    if (!event) return;
    router.push('/(tabs)');
  };

  if (!event) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'ไม่พบกิจกรรม', headerShown: true }} />
        <Ionicons name="alert-circle-outline" size={64} color="#dc2626" />
        <Text style={styles.notFoundTitle}>ไม่พบข้อมูลกิจกรรมนี้</Text>
        <Text style={styles.notFoundSub}>
          กิจกรรมรหัส "{id}" อาจถูกยกเลิกหรือไม่มีอยู่ในระบบ
        </Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.backBtnText}>กลับไปหน้ารวมกิจกรรม</Text>
        </Pressable>
      </View>
    );
  }

  const startDate = new Date(event.startsAt);
  const isScheduled = !!scheduledNotificationId;
  const isQuestDone = linkedQuest?.status === 'completed';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'รายละเอียดกิจกรรม & เช็กอิน',
          headerShown: true,
          headerBackTitle: 'ย้อนกลับ',
          headerTintColor: '#38bdf8',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTitleStyle: { color: '#f8fafc' },
          headerRight: () => (
            <TouchableOpacity onPress={handleDeleteEvent} style={{ padding: 4 }}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 30 },
        ]}
      >
        {/* Cover Photo */}
        {event.imageUrl && (
          <View style={styles.coverImageContainer}>
            <Image source={{ uri: event.imageUrl }} style={styles.coverImage} />
          </View>
        )}

        {/* Category Badge */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{event.category}</Text>
          </View>
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardBadgeText}>+{event.rewardXp} XP • 🪙 {event.rewardCoins}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{event.title}</Text>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Ionicons name="time" size={20} color="#38bdf8" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.label}>เวลาเริ่มกิจกรรม</Text>
              <Text style={styles.value}>
                {startDate.toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                • {event.timeRangeText || `${startDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={20} color="#38bdf8" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.label}>สถานที่จัดงาน / พิกัดภารกิจ</Text>
              <Text style={styles.value}>{event.location.name}</Text>
              <Text style={styles.coordSub}>
                พิกัด: {event.location.latitude.toFixed(4)}, {event.location.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>เกี่ยวกับกิจกรรมนี้</Text>
          <Text style={styles.descText}>{event.description}</Text>
        </View>

        {/* Quest Check-in Status Banner */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>ภารกิจและเช็กอิน (Quest Status)</Text>
          {isQuestDone ? (
            <View style={styles.doneStatusBox}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={styles.doneStatusText}>คุณได้เช็กอินและรับรางวัลจากกิจกรรมนี้แล้ว!</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Text style={styles.descText}>
                คุณสามารถเดินทางไปยังพิกัดสถานที่จัดงานเพื่อทำการเช็กอินและถ่ายภาพหลักฐานรับ +{event.rewardXp} XP และ +{event.rewardCoins} Coins ได้บนหน้าแผนที่
              </Text>
              <Pressable style={styles.checkInBtn} onPress={handleGoCheckInQuest}>
                <Ionicons name="navigate" size={18} color="#fff" />
                <Text style={styles.checkInBtnText}>🗺️ เปิดแผนที่เพื่อไปเช็กอินรับภารกิจ</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Action Buttons: Notification Management */}
        <View style={styles.actionBox}>
          <Text style={styles.sectionHeader}>ระบบแจ้งเตือน (Notifications W11)</Text>
          
          <Pressable
            style={[
              styles.reminderBtn,
              isScheduled ? styles.reminderBtnActive : styles.reminderBtnDefault,
            ]}
            onPress={handleScheduleReminderWithOptions}
            disabled={loading}
          >
            <Ionicons
              name={isScheduled ? 'notifications' : 'notifications-outline'}
              size={20}
              color="#fff"
            />
            <Text style={styles.reminderBtnText}>
              {loading
                ? 'กำลังดำเนินการ...'
                : isScheduled
                ? '🔔 มีการตั้งเตือนไว้ (แตะเพื่อแก้ไข/ยกเลิก)'
                : '🔔 กำหนดเวลาแจ้งเตือนกิจกรรม'}
            </Text>
          </Pressable>

          {isScheduled && (
            <View style={styles.statusBox}>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <Text style={styles.statusText}>
                ตั้งเวลาเตือนเรียบร้อย (ระบบจะส่ง Banner & เสียงเตือนเมื่อถึงเวลาที่เลือก)
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    padding: 16,
  },
  coverImageContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#1e293b',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  rewardBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  rewardBadgeText: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    lineHeight: 30,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowText: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  coordSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  descText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  checkInBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  checkInBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  doneStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    padding: 12,
    borderRadius: 12,
  },
  doneStatusText: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBox: {
    marginTop: 4,
    gap: 10,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  reminderBtnDefault: {
    backgroundColor: '#0284c7',
  },
  reminderBtnActive: {
    backgroundColor: '#dc2626',
  },
  reminderBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    gap: 6,
  },
  demoBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  notFoundSub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
