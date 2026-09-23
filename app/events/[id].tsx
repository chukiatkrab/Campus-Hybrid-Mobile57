import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CAMPUS_EVENTS,
  CampusEvent,
  scheduleEventReminder,
  cancelEventReminder,
  getAllScheduledReminders,
} from '@/services/notifications';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<CampusEvent | null>(null);
  const [scheduledNotificationId, setScheduledNotificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // โหลดข้อมูลกิจกรรมตาม id (มี fallback ป้องกัน invalid event ID)
    const found = CAMPUS_EVENTS.find((e) => e.id === id);
    setEvent(found || null);

    // ตรวจสอบว่าเคยตั้งเตือนกิจกรรมนี้ไว้หรือไม่
    checkScheduledStatus(id);
  }, [id]);

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

  const handleToggleReminder = async (isDemo = false) => {
    if (!event) return;

    if (scheduledNotificationId) {
      // ยกเลิกการเตือน
      try {
        setLoading(true);
        await cancelEventReminder(scheduledNotificationId);
        setScheduledNotificationId(null);
        Alert.alert('ยกเลิกแล้ว', 'ยกเลิกการแจ้งเตือนสำหรับกิจกรรมนี้เรียบร้อย');
      } catch (err) {
        Alert.alert('ผิดพลาด', 'ไม่สามารถยกเลิกการแจ้งเตือนได้');
      } finally {
        setLoading(false);
      }
    } else {
      // ตั้งเตือนใหม่
      try {
        setLoading(true);
        const notifId = await scheduleEventReminder(event, { isDemoInstant: isDemo });
        setScheduledNotificationId(notifId);
        if (isDemo) {
          Alert.alert(
            'ตั้งเตือนสำเร็จ (โหมดทดสอบ)',
            'การแจ้งเตือนจะแสดงขึ้นมาภายใน 5 วินาที (กรุณาลองสลับแอปไป background หรือดูที่ Notification Tray)'
          );
        } else {
          Alert.alert(
            'ตั้งเตือนสำเร็จ',
            'ระบบจะแจ้งเตือนล่วงหน้า 30 นาทีก่อนเริ่มกิจกรรม'
          );
        }
      } catch (err: any) {
        if (err.message === 'notification-permission-denied') {
          Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตการแจ้งเตือนในระบบ');
        } else {
          Alert.alert('ผิดพลาด', 'ไม่สามารถตั้งการแจ้งเตือนได้');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // กรณีไม่พบ Event (Not Found State)
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'รายละเอียดกิจกรรม',
          headerShown: true,
          headerBackTitle: 'ย้อนกลับ',
          headerTintColor: '#0a7ea4',
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 30 },
        ]}
      >
        {/* Category Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{event.category}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{event.title}</Text>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Ionicons name="time" size={20} color="#0a7ea4" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.label}>เวลาเริ่มกิจกรรม</Text>
              <Text style={styles.value}>
                {startDate.toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                เวลา {startDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={20} color="#0a7ea4" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.label}>สถานที่จัดงาน</Text>
              <Text style={styles.value}>{event.location.name}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>เกี่ยวกับกิจกรรมนี้</Text>
          <Text style={styles.descText}>{event.description}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionBox}>
          {/* Main 30-min Reminder Button */}
          <Pressable
            style={[
              styles.reminderBtn,
              isScheduled ? styles.reminderBtnActive : styles.reminderBtnDefault,
            ]}
            onPress={() => handleToggleReminder(false)}
            disabled={loading}
          >
            <Ionicons
              name={isScheduled ? 'notifications-off' : 'notifications'}
              size={20}
              color="#fff"
            />
            <Text style={styles.reminderBtnText}>
              {loading
                ? 'กำลังดำเนินการ...'
                : isScheduled
                ? 'ยกเลิกการแจ้งเตือน'
                : '🔔 แจ้งเตือนล่วงหน้า 30 นาที'}
            </Text>
          </Pressable>

          {/* Quick 5s Demo Test Trigger Button */}
          {!isScheduled && (
            <Pressable
              style={styles.demoBtn}
              onPress={() => handleToggleReminder(true)}
              disabled={loading}
            >
              <Ionicons name="flash-outline" size={16} color="#0a7ea4" />
              <Text style={styles.demoBtnText}>
                ⚡ ทดสอบยิง Notification ทันที (5 วินาที)
              </Text>
            </Pressable>
          )}

          {isScheduled && (
            <View style={styles.statusBox}>
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              <Text style={styles.statusText}>
                ตั้งเวลาเตือนเรียบร้อย (ระบบจะส่ง Banner & เสียงเตือน)
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
    backgroundColor: '#F8FAFC',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    padding: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(10,126,164,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: '#0a7ea4',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 30,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowText: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  actionBox: {
    marginTop: 10,
    gap: 12,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    elevation: 3,
  },
  reminderBtnDefault: {
    backgroundColor: '#0a7ea4',
  },
  reminderBtnActive: {
    backgroundColor: '#dc2626',
  },
  reminderBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0a7ea4',
    backgroundColor: '#F0F9FF',
    gap: 6,
  },
  demoBtnText: {
    color: '#0a7ea4',
    fontSize: 13,
    fontWeight: '600',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  notFoundSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
