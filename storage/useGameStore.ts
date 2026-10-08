import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Quest, GameItem, PlayerStats, CampusEventItem } from '../features/events/types/quest';
import { INITIAL_QUESTS, INITIAL_ITEMS, INITIAL_EVENTS } from '../features/events/types/questData';
import { getRequiredXpForLevel } from '../features/events/types/gameMath';
import { triggerNotificationNow, scheduleEventReminder, cancelEventReminder, getAllScheduledReminders } from '../services/notifications';

interface GameState {
  player: PlayerStats;
  quests: Quest[];
  events: CampusEventItem[];
  inventory: GameItem[];
  simulationLocation: { latitude: number; longitude: number } | null;
  isSimulatorActive: boolean;

  // Actions
  completeQuest: (questId: string, proofPhotoUri?: string) => Promise<{ xpGained: number; leveledUp: boolean; newLevel: number }>;
  resetQuests: () => void;
  setSimulatedLocation: (coords: { latitude: number; longitude: number } | null) => void;
  toggleSimulator: (enabled: boolean) => void;
  useItem: (itemId: string) => void;

  // Event creation, deletion & sync action
  createCampusEvent: (eventData: {
    title: string;
    description: string;
    category: string;
    locationName: string;
    latitude: number;
    longitude: number;
    startsAt: string;
    endsAt?: string;
    timeRangeText?: string;
    rewardXp: number;
    rewardCoins: number;
    imageUrl?: string;
    autoScheduleNotification?: boolean;
  }) => Promise<CampusEventItem>;

  deleteCampusEvent: (eventId: string) => Promise<void>;
}

const DEFAULT_PLAYER: PlayerStats = {
  id: 'player-663450174-1',
  name: 'นายชูเกียรติ คำมณีจันทร์',
  title: 'นักสำรวจมือใหม่แห่งมอดินแดง',
  studentId: '663450174-1',
  department: 'วิทยาการคอมพิวเตอร์และสารสนเทศ มข.',
  level: 1,
  currentXp: 45,
  requiredXp: 100,
  hp: 100,
  maxHp: 100,
  coins: 150,
  questsCompletedCount: 0,
  explorationRank: 'Novice Explorer',
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      player: DEFAULT_PLAYER,
      quests: INITIAL_QUESTS,
      events: INITIAL_EVENTS,
      inventory: INITIAL_ITEMS,
      simulationLocation: null,
      isSimulatorActive: false,

      setSimulatedLocation: (coords) => set({ simulationLocation: coords }),
      toggleSimulator: (enabled) => set({ isSimulatorActive: enabled }),

      createCampusEvent: async (eventData) => {
        const newEventId = `evt-custom-${Date.now()}`;
        const newQuestId = `q-evt-${Date.now()}`;

        const newEvent: CampusEventItem = {
          id: newEventId,
          title: eventData.title,
          description: eventData.description,
          category: eventData.category,
          startsAt: eventData.startsAt,
          endsAt: eventData.endsAt,
          timeRangeText: eventData.timeRangeText,
          location: {
            name: eventData.locationName,
            latitude: eventData.latitude,
            longitude: eventData.longitude,
          },
          rewardXp: eventData.rewardXp,
          rewardCoins: eventData.rewardCoins,
          imageUrl: eventData.imageUrl,
          isCustomCreated: true,
        };

        // สร้างเควสต์ที่ผูกกับ Event นี้ลงแผนที่ให้ผู้ใช้เดินทางไปเช็กอินได้ทันที
        const newQuest: Quest = {
          id: newQuestId,
          title: `[กิจกรรม] ${eventData.title}`,
          description: `ร่วมกิจกรรม: ${eventData.description}`,
          category: 'event',
          difficulty: 'MEDIUM',
          rewardXp: eventData.rewardXp,
          rewardCoins: eventData.rewardCoins,
          location: {
            name: eventData.locationName,
            latitude: eventData.latitude,
            longitude: eventData.longitude,
          },
          targetRadiusMeters: 60,
          hintText: `เช็กอิน ณ ${eventData.locationName} เมื่อถึงเวลากิจกรรม (${eventData.timeRangeText || ''})`,
          requiredProofPhoto: true,
          status: 'available',
          eventId: newEventId,
          imageUrl: eventData.imageUrl,
        };

        set((state) => ({
          events: [newEvent, ...state.events],
          quests: [newQuest, ...state.quests],
        }));

        if (eventData.autoScheduleNotification) {
          try {
            await scheduleEventReminder({
              id: newEvent.id,
              title: newEvent.title,
              category: newEvent.category,
              startsAt: newEvent.startsAt,
              location: newEvent.location,
              description: newEvent.description,
            });
          } catch (e) {
            console.log('Error scheduling event notif:', e);
          }
        }

        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}

        return newEvent;
      },

      deleteCampusEvent: async (eventId: string) => {
        // ยกเลิก Notification ที่ผูกกับ Event นี้ถ้ามี
        try {
          const scheduled = await getAllScheduledReminders();
          const match = scheduled.find((n) => n.content.data?.eventId === eventId);
          if (match) {
            await cancelEventReminder(match.identifier);
          }
        } catch (e) {}

        // ลบทั้ง Event และเควสต์ที่ผูกกับ Event ออกจาก Store
        set((state) => ({
          events: state.events.filter((e) => e.id !== eventId),
          quests: state.quests.filter((q) => q.eventId !== eventId),
        }));

        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {}
      },

      completeQuest: async (questId: string, proofPhotoUri?: string) => {
        const state = get();
        const quest = state.quests.find((q) => q.id === questId);

        if (!quest || quest.status === 'completed') {
          return { xpGained: 0, leveledUp: false, newLevel: state.player.level };
        }

        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}

        const xpGained = quest.rewardXp;
        const coinsGained = quest.rewardCoins;
        let newXp = state.player.currentXp + xpGained;
        let currentLevel = state.player.level;
        let reqXp = state.player.requiredXp;
        let leveledUp = false;

        while (newXp >= reqXp) {
          newXp -= reqXp;
          currentLevel += 1;
          reqXp = getRequiredXpForLevel(currentLevel);
          leveledUp = true;
        }

        let newRank = state.player.explorationRank;
        let newTitle = state.player.title;
        if (currentLevel >= 5) {
          newRank = 'Grand Pathfinder';
          newTitle = 'ปรมาจารย์ผู้พิชิตดินแดน';
        } else if (currentLevel >= 3) {
          newRank = 'Veteran Scout';
          newTitle = 'พรานนำทางช่ำชอง';
        } else if (currentLevel >= 2) {
          newRank = 'Apprentice Explorer';
          newTitle = 'นักเดินทางก้าวแรก';
        }

        let updatedInventory = [...state.inventory];
        if (quest.rewardItem) {
          const itemWithDate: GameItem = {
            ...quest.rewardItem,
            acquiredAt: new Date().toISOString(),
          };
          updatedInventory.unshift(itemWithDate);
        }

        const updatedQuests = state.quests.map((q) =>
          q.id === questId
            ? {
                ...q,
                status: 'completed' as const,
                completedAt: new Date().toISOString(),
                proofPhotoUri: proofPhotoUri || q.proofPhotoUri,
              }
            : q
        );

        set({
          player: {
            ...state.player,
            level: currentLevel,
            currentXp: newXp,
            requiredXp: reqXp,
            coins: state.player.coins + coinsGained,
            questsCompletedCount: state.player.questsCompletedCount + 1,
            explorationRank: newRank,
            title: newTitle,
          },
          quests: updatedQuests,
          inventory: updatedInventory,
        });

        try {
          await triggerNotificationNow(
            '🎉 เควสต์/กิจกรรมสำเร็จ!',
            `คุณได้รับ +${xpGained} XP และ +${coinsGained} Coins ${leveledUp ? `\n🌟 เลเวลอัปเป็น เลเวล ${currentLevel}!` : ''}`
          );
        } catch (e) {
          console.log('Notif error:', e);
        }

        return { xpGained, leveledUp, newLevel: currentLevel };
      },

      resetQuests: () => {
        set({
          quests: INITIAL_QUESTS,
          events: INITIAL_EVENTS,
          inventory: INITIAL_ITEMS,
          player: DEFAULT_PLAYER,
          simulationLocation: null,
          isSimulatorActive: false,
        });
      },

      useItem: (itemId: string) => {
        const state = get();
        const item = state.inventory.find((i) => i.id === itemId);
        if (!item) return;

        if (item.type === 'potion') {
          set({
            player: {
              ...state.player,
              hp: Math.min(state.player.maxHp, state.player.hp + 50),
            },
            inventory: state.inventory.filter((i) => i.id !== itemId),
          });
        }
      },
    }),
    {
      name: 'campus-quest-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
