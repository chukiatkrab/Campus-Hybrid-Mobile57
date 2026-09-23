import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const REMINDER_CHANNEL = 'event-reminders';

export interface CampusEvent {
  id: string;
  title: string;
  category: string;
  startsAt: string; // ISO date string
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  description: string;
}

// Sample Campus Events (สามารถขยายหรือดึงจาก API ได้)
export const CAMPUS_EVENTS: CampusEvent[] = [
  {
    id: 'evt-1',
    title: 'KKU Tech Expo & Hackathon 2026',
    category: 'Technology & Academic',
    startsAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // เริ่มอีก 45 นาที
    location: {
      name: 'อุทยานวิทยาศาสตร์ ภาคตะวันออกเฉียงเหนือ มข.',
      latitude: 16.4730,
      longitude: 102.8206,
    },
    description: 'งานแสดงผลงานนวัตกรรมและเทคโนโลยีของนักศึกษาวิทยาการคอมพิวเตอร์และการแข่งขันพัฒนาโมบายแอปพลิเคชัน',
  },
  {
    id: 'evt-2',
    title: 'ดนตรีริมบึงสีฐาน (Si Than Music Fest)',
    category: 'Cultural & Art',
    startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // เริ่มอีก 2 ชม.
    location: {
      name: 'ริมบึงสีฐาน มหาวิทยาลัยขอนแก่น',
      latitude: 16.4564,
      longitude: 102.8079,
    },
    description: 'กิจกรรมการแสดงดนตรีสดและพื้นที่แสดงความคิดสร้างสรรค์ริมบึงสีฐานยามเย็น',
  },
  {
    id: 'evt-3',
    title: 'บรรยายพิเศษ: Future AI & Autonomous Agents',
    category: 'Lecture & Seminar',
    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // เริ่มพรุ่งนี้
    location: {
      name: 'วิทยาลัยการคอมพิวเตอร์ (CP KKU)',
      latitude: 16.4745,
      longitude: 102.8240,
    },
    description: 'เรียนรู้เทคโนโลยี AI ยุคใหม่ การพัฒนา Agentic Coding และโอกาสทางสายงานในอนาคต',
  },
];

// Configure Foreground Notification Behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * ขอสิทธิ์ Permission และตั้ง Android Notification Channel
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'การเตือนกิจกรรม (Event Reminders)',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0a7ea4',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * ตั้งการแจ้งเตือนกิจกรรมล่วงหน้า 30 นาที (หรือ Demo ใน 5 วินาทีหากกิจกรรมใกล้เริ่ม)
 */
export async function scheduleEventReminder(
  event: CampusEvent,
  options?: { isDemoInstant?: boolean }
): Promise<string> {
  const granted = await ensureNotificationPermission();
  if (!granted) throw new Error('notification-permission-denied');

  // คำนวณเวลาเตือนล่วงหน้า 30 นาที
  let triggerDate = new Date(new Date(event.startsAt).getTime() - 30 * 60 * 1000);

  // ถ้าต้องการทดสอบทันที (Demo Trigger ใน 5 วินาที) หรือถ้าเวลา 30 นาทีผ่านมาแล้ว
  if (options?.isDemoInstant || triggerDate <= new Date()) {
    triggerDate = new Date(Date.now() + 5 * 1000); // แจ้งเตือนใน 5 วินาทีเพื่อการทดสอบ
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: `ใกล้ถึงเวลา: ${event.title}`,
      body: `กิจกรรมจะเริ่มเร็วๆ นี้ที่ ${event.location.name} แตะเพื่อดูรายละเอียด`,
      data: { eventId: event.id }, // ตามเกณฑ์ DoD: มีเฉพาะ eventId ไม่ใส่ข้อมูลอ่อนไหว
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: REMINDER_CHANNEL,
    },
  });
}

/**
 * ยกเลิก Notification
 */
export async function cancelEventReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * ดึงรายการ Scheduled Notifications ทั้งหมดในระบบ
 */
export async function getAllScheduledReminders(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}
