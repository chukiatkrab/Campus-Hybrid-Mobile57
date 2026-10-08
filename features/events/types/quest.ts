export type QuestCategory = 'exploration' | 'photo' | 'landmark' | 'secret' | 'event';

export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';

export interface GameItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'badge' | 'potion' | 'artifact' | 'relic';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  acquiredAt?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  rewardXp: number;
  rewardCoins: number;
  rewardItem?: GameItem;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  targetRadiusMeters: number;
  hintText: string;
  requiredProofPhoto: boolean;
  status: 'available' | 'in_progress' | 'completed';
  completedAt?: string;
  proofPhotoUri?: string;
  eventId?: string;
  imageUrl?: string;
}

export interface CampusEventItem {
  id: string;
  title: string;
  category: string;
  startsAt: string; // ISO date string
  endsAt?: string;   // ISO date string (สิ้นสุดกี่โมง)
  timeRangeText?: string; // เช่น "09:00 - 12:00 น."
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  description: string;
  rewardXp: number;
  rewardCoins: number;
  imageUrl?: string;
  isCustomCreated?: boolean;
}

export interface PlayerStats {
  id: string;
  name: string;
  title: string;
  studentId: string;
  department: string;
  level: number;
  currentXp: number;
  requiredXp: number;
  hp: number;
  maxHp: number;
  coins: number;
  questsCompletedCount: number;
  explorationRank: string;
}
