import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Alert,
  Switch,
} from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGameStore } from "@/storage/useGameStore";
import { calculateDistance, formatDistance } from "@/features/events/types/gameMath";
import { Quest } from "@/features/events/types/quest";

// พิกัดเริ่มต้นใจกลาง มหาวิทยาลัยขอนแก่น
const INITIAL_REGION = {
  latitude: 16.4730,
  longitude: 102.8206,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export default function QuestMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const quests = useGameStore((s) => s.quests);
  const player = useGameStore((s) => s.player);
  const simulationLocation = useGameStore((s) => s.simulationLocation);
  const isSimulatorActive = useGameStore((s) => s.isSimulatorActive);
  const setSimulatedLocation = useGameStore((s) => s.setSimulatedLocation);
  const toggleSimulator = useGameStore((s) => s.toggleSimulator);
  const completeQuest = useGameStore((s) => s.completeQuest);

  const [realLocation, setRealLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest>(quests[0]);
  const [hasNotifiedNear, setHasNotifiedNear] = useState<Record<string, boolean>>({});

  // ตำแหน่งผู้เล่นปัจจุบัน (หากเปิด Simulation Mode จะใช้พิกัดจำลอง)
  const currentLocation = useMemo(() => {
    if (isSimulatorActive && simulationLocation) {
      return simulationLocation;
    }
    return realLocation || { latitude: 16.4730, longitude: 102.8206 };
  }, [isSimulatorActive, simulationLocation, realLocation]);

  // คำนวณระยะห่างของเควสต์ทั้งหมดเทียบกับตำแหน่งปัจจุบัน
  const questsWithDistance = useMemo(() => {
    return quests.map((q) => {
      const dist = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        q.location.latitude,
        q.location.longitude
      );
      const isWithinRadius = dist <= q.targetRadiusMeters;
      return {
        ...q,
        distanceMeters: dist,
        isWithinRadius,
      };
    });
  }, [quests, currentLocation]);

  // ดึง GPS จริงของเครื่อง
  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'เปิดการเข้าถึงตำแหน่ง GPS เพื่อเล่น CampusQuest');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setRealLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10,
        },
        (newLoc) => {
          setRealLocation({
            latitude: newLoc.coords.latitude,
            longitude: newLoc.coords.longitude,
          });
        }
      );
    })();

    return () => {
      subscriber?.remove();
    };
  }, []);

  // ตรวจจับเมื่อผู้เล่นเดินเข้าสู่รัศมีเควสต์ (Proximity Trigger & Haptics W11)
  useEffect(() => {
    questsWithDistance.forEach((q) => {
      if (q.isWithinRadius && q.status !== 'completed' && !hasNotifiedNear[q.id]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setHasNotifiedNear((prev) => ({ ...prev, [q.id]: true }));
      }
    });
  }, [questsWithDistance, hasNotifiedNear]);

  const currentSelectedWithDist = useMemo(() => {
    return questsWithDistance.find((q) => q.id === selectedQuest.id) || questsWithDistance[0];
  }, [questsWithDistance, selectedQuest]);

  const handleSelectQuest = useCallback((quest: Quest) => {
    setSelectedQuest(quest);
    mapRef.current?.animateToRegion(
      {
        latitude: quest.location.latitude,
        longitude: quest.location.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      600
    );
  }, []);

  // ฟังก์ชัน Simulation: วาร์ปผู้เล่นไปยังหน้าเควสต์ที่เลือก (สะดวกมากสำหรับการนำเสนอผลงาน!)
  const handleTeleportToSelected = () => {
    toggleSimulator(true);
    setSimulatedLocation({
      latitude: selectedQuest.location.latitude,
      longitude: selectedQuest.location.longitude,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      '🌀 Teleport สำเร็จ (Simulation)',
      `คุณได้วาร์ปมาถึงพิกัดของเควสต์ "${selectedQuest.title}" แล้ว! ขณะนี้อยู่ในรัศมีทำภารกิจ`
    );
  };

  const handleCheckInOrVerify = () => {
    if (!currentSelectedWithDist.isWithinRadius) {
      Alert.alert(
        '⚠️ อยู่นอกระยะภารกิจ',
        `คุณอยู่ห่างจากจุดเป้าหมาย ${formatDistance(currentSelectedWithDist.distanceMeters)} (ต้องเข้าใกล้ภายในระยะ ${selectedQuest.targetRadiusMeters} ม.)\n\n💡 ทิปสำหรับพรีเซนต์: เปิดสวิตช์ Simulation หรือกดปุ่ม 'Teleport' ด้านบน`
      );
      return;
    }

    if (selectedQuest.requiredProofPhoto) {
      // ไปหน้ากล้องเพื่อถ่ายภาพยืนยัน
      router.push({
        pathname: '/(tabs)/camera',
        params: { questId: selectedQuest.id, questTitle: selectedQuest.title },
      });
    } else {
      // สำเร็จเควสต์ทันที
      completeQuest(selectedQuest.id);
      Alert.alert('🎉 ภารกิจสำเร็จ!', `ยินดีด้วย! คุณได้รับ +${selectedQuest.rewardXp} XP`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* RPG Top HUD Header */}
      <View style={styles.hudHeader}>
        <View style={styles.playerInfoRow}>
          <View style={styles.avatarCircle}>
            <Ionicons name="shield" size={24} color="#38bdf8" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.playerName}>{player.name}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv. {player.level}</Text>
              </View>
            </View>
            {/* XP Bar */}
            <View style={styles.xpBarTrack}>
              <View
                style={[
                  styles.xpBarFill,
                  { width: `${Math.min(100, (player.currentXp / player.requiredXp) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.xpText}>
              XP: {player.currentXp} / {player.requiredXp}
            </Text>
          </View>

          <View style={styles.coinsBadge}>
            <Ionicons name="sparkles" size={14} color="#eab308" />
            <Text style={styles.coinsText}>{player.coins}</Text>
          </View>
        </View>

        {/* Demo Simulator Control Bar */}
        <View style={styles.simulatorBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons
              name={isSimulatorActive ? "flash" : "locate-outline"}
              size={16}
              color={isSimulatorActive ? "#38bdf8" : "#94a3b8"}
            />
            <Text style={styles.simText}>Simulation Mode (Demo)</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {isSimulatorActive && (
              <Pressable style={styles.teleportBtn} onPress={handleTeleportToSelected}>
                <Text style={styles.teleportBtnText}>🌀 วาร์ปมาจุดนี้</Text>
              </Pressable>
            )}
            <Switch
              value={isSimulatorActive}
              onValueChange={toggleSimulator}
              trackColor={{ false: "#334155", true: "#0284c7" }}
              thumbColor={isSimulatorActive ? "#38bdf8" : "#f4f3f4"}
            />
          </View>
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={INITIAL_REGION}
          showsUserLocation={!isSimulatorActive}
        >
          {/* Simulated Player Marker */}
          {isSimulatorActive && (
            <Marker
              coordinate={currentLocation}
              title="ตำแหน่งจำลองผู้เล่น (You)"
              pinColor="#38bdf8"
            >
              <View style={styles.playerMarkerCircle}>
                <Ionicons name="navigate" size={18} color="#fff" />
              </View>
            </Marker>
          )}

          {/* Quest Markers */}
          {questsWithDistance.map((q) => {
            const isCompleted = q.status === 'completed';
            const isTarget = q.id === selectedQuest.id;

            return (
              <React.Fragment key={q.id}>
                {/* Detection Circle Zone */}
                <Circle
                  center={q.location}
                  radius={q.targetRadiusMeters}
                  fillColor={
                    isCompleted
                      ? "rgba(34, 197, 94, 0.15)"
                      : q.isWithinRadius
                      ? "rgba(56, 189, 248, 0.35)"
                      : "rgba(234, 179, 8, 0.18)"
                  }
                  strokeColor={
                    isCompleted
                      ? "#22c55e"
                      : q.isWithinRadius
                      ? "#38bdf8"
                      : "#eab308"
                  }
                  strokeWidth={2}
                />

                <Marker
                  coordinate={q.location}
                  title={q.title}
                  description={formatDistance(q.distanceMeters)}
                  onPress={() => handleSelectQuest(q)}
                >
                  <View
                    style={[
                      styles.questPin,
                      isCompleted && styles.questPinCompleted,
                      isTarget && styles.questPinTarget,
                    ]}
                  >
                    <Ionicons
                      name={
                        isCompleted
                          ? "checkmark"
                          : q.category === 'secret'
                          ? "skull"
                          : "flag"
                      }
                      size={18}
                      color="#fff"
                    />
                  </View>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapView>

        {/* Selected Quest Floating HUD Card */}
        <View style={styles.floatingQuestCard}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Text style={styles.questCategoryBadge}>{currentSelectedWithDist.category.toUpperCase()}</Text>
                <Text style={styles.distanceBadge}>
                  📍 ห่าง {formatDistance(currentSelectedWithDist.distanceMeters)}
                </Text>
              </View>
              <Text style={styles.cardQuestTitle} numberOfLines={1}>
                {currentSelectedWithDist.title}
              </Text>
            </View>

            <View style={styles.rewardBox}>
              <Text style={styles.rewardXpText}>+{currentSelectedWithDist.rewardXp} XP</Text>
              <Text style={styles.rewardCoinText}>+{currentSelectedWithDist.rewardCoins} 🪙</Text>
            </View>
          </View>

          <Text style={styles.cardLocationName}>
            🏛️ {currentSelectedWithDist.location.name}
          </Text>

          {/* Action Trigger Button */}
          {currentSelectedWithDist.status === 'completed' ? (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <Text style={styles.completedBannerText}>ภารกิจนี้ทำสำเร็จแล้ว</Text>
            </View>
          ) : (
            <Pressable
              style={[
                styles.actionBtn,
                currentSelectedWithDist.isWithinRadius
                  ? styles.actionBtnActive
                  : styles.actionBtnInactive,
              ]}
              onPress={handleCheckInOrVerify}
            >
              <Ionicons
                name={
                  currentSelectedWithDist.requiredProofPhoto
                    ? "camera"
                    : "location"
                }
                size={18}
                color="#fff"
              />
              <Text style={styles.actionBtnText}>
                {currentSelectedWithDist.isWithinRadius
                  ? currentSelectedWithDist.requiredProofPhoto
                    ? "📸 ถ่ายภาพยืนยันเควสต์"
                    : "🚩 เช็กอินสำเร็จเควสต์"
                  : `เดินเข้าใกล้จุดเป้าหมาย (< ${currentSelectedWithDist.targetRadiusMeters} ม.)`}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Nearby Quests Bottom List */}
      <View style={styles.listSection}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>ภารกิจและเควสต์รอบตัว (Quests)</Text>
          <Text style={styles.listCount}>
            {questsWithDistance.filter((q) => q.status === 'completed').length}/{questsWithDistance.length} สำเร็จแล้ว
          </Text>
        </View>

        <FlatList
          data={questsWithDistance}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selectedQuest.id === item.id;
            const isCompleted = item.status === 'completed';

            return (
              <Pressable
                onPress={() => handleSelectQuest(item)}
                style={[
                  styles.questCard,
                  isSelected && styles.questCardSelected,
                  isCompleted && styles.questCardCompleted,
                ]}
              >
                <View
                  style={[
                    styles.questIconBox,
                    isCompleted ? { backgroundColor: '#15803d' } : { backgroundColor: '#0284c7' },
                  ]}
                >
                  <Ionicons
                    name={isCompleted ? "checkmark-done" : "map"}
                    size={20}
                    color="#fff"
                  />
                </View>

                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <Text
                    style={[styles.questItemTitle, isSelected && { color: '#38bdf8' }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.questItemSub} numberOfLines={1}>
                    {item.location.name}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.questItemDist,
                      item.isWithinRadius && { color: '#22c55e', fontWeight: '800' },
                    ]}
                  >
                    {formatDistance(item.distanceMeters)}
                  </Text>
                  <Text style={styles.questItemReward}>+{item.rewardXp} XP</Text>
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  hudHeader: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  playerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1e293b",
    borderWidth: 2,
    borderColor: "#38bdf8",
    justifyContent: "center",
    alignItems: "center",
  },
  playerName: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "700",
  },
  levelBadge: {
    backgroundColor: "#0284c7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  levelText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  xpBarTrack: {
    height: 6,
    backgroundColor: "#1e293b",
    borderRadius: 3,
    marginTop: 4,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: "#38bdf8",
  },
  xpText: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 2,
  },
  coinsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1e293b",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eab308",
  },
  coinsText: {
    color: "#fef08a",
    fontWeight: "700",
    fontSize: 13,
  },
  simulatorBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  simText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  teleportBtn: {
    backgroundColor: "#0369a1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  teleportBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  mapContainer: {
    height: 290,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  playerMarkerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0284c7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  questPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 4,
  },
  questPinCompleted: {
    backgroundColor: "#16a34a",
  },
  questPinTarget: {
    borderColor: "#38bdf8",
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },
  floatingQuestCard: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questCategoryBadge: {
    color: "#38bdf8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  distanceBadge: {
    color: "#fbbf24",
    fontSize: 11,
    fontWeight: "700",
  },
  cardQuestTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  rewardBox: {
    alignItems: "flex-end",
  },
  rewardXpText: {
    color: "#38bdf8",
    fontWeight: "800",
    fontSize: 12,
  },
  rewardCoinText: {
    color: "#fef08a",
    fontSize: 11,
    fontWeight: "600",
  },
  cardLocationName: {
    color: "#94a3b8",
    fontSize: 12,
    marginVertical: 4,
  },
  actionBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  actionBtnActive: {
    backgroundColor: "#0284c7",
  },
  actionBtnInactive: {
    backgroundColor: "#334155",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  completedBanner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    marginTop: 6,
  },
  completedBannerText: {
    color: "#4ade80",
    fontWeight: "700",
    fontSize: 13,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  listTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  listCount: {
    color: "#94a3b8",
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  questCard: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  questCardSelected: {
    borderColor: "#0284c7",
    backgroundColor: "#13233b",
  },
  questCardCompleted: {
    opacity: 0.65,
  },
  questIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  questItemTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
  },
  questItemSub: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 2,
  },
  questItemDist: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  questItemReward: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
});