import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  // จัดการการตอบสนองเมื่อผู้ใช้แตะ Notification (ทั้ง Cold Start และ Foreground/Background)
  useEffect(() => {
    function openEventFromResponse(
      response: Notifications.NotificationResponse | null
    ) {
      if (
        response &&
        response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
      ) {
        return;
      }

      const eventId = response?.notification.request.content.data?.eventId;
      if (typeof eventId !== 'string') return;

      // นำทางไปหน้า Dynamic Route /events/[id]
      router.push({
        pathname: '/events/[id]',
        params: { id: eventId },
      });
    }

    // 1. รองรับ Cold Start: อ่าน notification ที่ใช้เปิดแอปขึ้นมา
    Notifications.getLastNotificationResponseAsync().then((initialResponse) => {
      if (initialResponse) {
        openEventFromResponse(initialResponse);
      }
    });

    // 2. รองรับตอนแอปเปิดทำงานอยู่ หรืออยู่ Background
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => openEventFromResponse(response)
    );

    return () => subscription.remove();
  }, [router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="events/[id]"
          options={{
            title: 'รายละเอียดกิจกรรม',
            headerShown: true,
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
