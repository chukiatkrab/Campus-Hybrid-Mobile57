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
  isRecommended?: boolean;
}
