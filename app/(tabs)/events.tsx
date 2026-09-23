import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  CAMPUS_EVENTS,
  CampusEvent,
  getAllScheduledReminders,
} from '@/services/notifications';

export default function EventsScreen() {
  const router = useRouter();
  const [scheduledIds, setScheduledIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderEventItem = ({ item }: { item: CampusEvent }) => {
    const isScheduled = scheduledIds.includes(item.id);
    const date = new Date(item.startsAt);

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
        <View style={styles.cardHeader}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.category}</Text>
          </View>
          {isScheduled && (
            <View style={styles.scheduledBadge}>
              <Ionicons name="notifications" size={13} color="#16a34a" />
              <Text style={styles.scheduledText}>ตั้งเตือนแล้ว</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#64748b" />
          <Text style={styles.infoText}>
            {date.toLocaleDateString('th-TH', {
              day: 'numeric',
              month: 'short',
            })}{' '}
            • {date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#64748b" />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.location.name}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailText}>ดูรายละเอียดและตั้งเตือน</Text>
          <Ionicons name="chevron-forward" size={16} color="#0a7ea4" />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>CAMPUS EVENTS</Text>
          <Text style={styles.subtitle}>
            กิจกรรมและสัมมนาน่าสนใจ พร้อมระบบแจ้งเตือน
          </Text>
        </View>
        <View style={styles.bellIconBox}>
          <Ionicons name="notifications" size={22} color="#fff" />
        </View>
      </View>

      <FlatList
        data={CAMPUS_EVENTS}
        keyExtractor={(item) => item.id}
        renderItem={renderEventItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#BFD0E5',
    fontSize: 12,
    marginTop: 4,
  },
  bellIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: 'rgba(10,126,164,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#0a7ea4',
    fontSize: 11,
    fontWeight: '700',
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scheduledText: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    lineHeight: 23,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0a7ea4',
  },
});
