/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GymPost {
  id: string;
  userName: string;
  userEmail: string;
  dateTime: string; // ISO string representing when they worked out
  text: string;
  imageUrl?: string;
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  likesList?: string[];
  commentsList?: Array<{ username: string; userEmail?: string; text: string; dateTime?: string }>;
  duration?: number;
  intensity?: "Low" | "Medium" | "High";
}

export interface WeightRecord {
  id: string;
  weight: number; // in kg
  height: number; // in meters
  date: string; // ISO string
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  weightRecords: WeightRecord[];
  inviteCode?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface MonthPrize {
  title: string;
  imageUrl: string;
  description: string;
  details: string;
}

export interface Trophy {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  unlocked: boolean;
}
