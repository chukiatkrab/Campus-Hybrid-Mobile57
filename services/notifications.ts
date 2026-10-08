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

// Sample Campus Events
export const CAMPUS_EVENTS: CampusEvent[] = [
  {
    id: 'evt-1',
    title: 'KKU Tech Expo & Hackathon 2026',
    category: 'Technology & Academic',
    startsAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
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
    startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
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
    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
      name: 'Campus Quest Notifications',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0a7ea4',
      enableVibrate: true,
      showBadge: true,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return requested.granted;
}

/**
 * แจ้งเตือนด่วนทันทีสำหรับความสำเร็จของเควสต์ หรือการเข้าใกล้จุดหมาย (W11)
 */
export async function triggerNotificationNow(title: string, body: string, data?: Record<string, any>): Promise<string> {
  await ensureNotificationPermission();
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
    },
    trigger: null, // trigger immediately
  });
}

/**
 * ตั้งการแจ้งเตือนกิจกรรมตามเวลาที่กำหนดได้จริง (Custom Date / ISO string)
 */
export async function scheduleEventReminder(
  event: CampusEvent,
  options?: { customNotifyAt?: Date | string; notifyMinutesBefore?: number }
): Promise<string> {
  const granted = await ensureNotificationPermission();
  if (!granted) throw new Error('notification-permission-denied');

  let triggerDate: Date;

  if (options?.customNotifyAt) {
    triggerDate = new Date(options.customNotifyAt);
  } else if (options?.notifyMinutesBefore !== undefined) {
    triggerDate = new Date(new Date(event.startsAt).getTime() - options.notifyMinutesBefore * 60 * 1000);
  } else {
    // กำหนดเวลาแจ้งเตือนตรงตามเวลาเริ่มกิจกรรม
    triggerDate = new Date(event.startsAt);
  }

  // หากเวลาที่ตั้งผ่านไปแล้ว ให้แจ้งเตือนในอีก 10 วินาทีเพื่อไม่ให้เกิดข้อผิดพลาดของ OS
  if (triggerDate.getTime() <= Date.now()) {
    triggerDate = new Date(Date.now() + 10 * 1000);
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔔 ถึงเวลากิจกรรม: ${event.title}`,
      body: `กิจกรรมเริ่มแล้ว ณ ${event.location.name} แตะเพื่อเปิดแอปและเดินทางไปเช็กอิน!`,
      data: { eventId: event.id },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: REMINDER_CHANNEL,
    },
  });
}

export async function cancelEventReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function getAllScheduledReminders(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}
