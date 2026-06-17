/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TeamMember, Trophy, MonthPrize, GymPost } from "./types";

export const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: "lucas_de",
    name: "Lucas de Angeli",
    email: "lucas_deangeli@4scale.com.br",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "marcus_t",
    name: "Marcus Thorne",
    email: "marcus.thorne@4scale.com.br",
    avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "elena_s",
    name: "Elena Silva",
    email: "elena.silva@4scale.com.br",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "juliana_l",
    name: "Juliana Lima",
    email: "juliana.lima@4scale.com.br",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  }
];

export const PRESET_WORKOUTS = [
  {
    id: "chest",
    name: "Supino & Peito",
    url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "legs",
    name: "Agachamento & Pernas",
    url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "cardio",
    name: "Corrida & Cardio",
    url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "yoga",
    name: "Alongamento & Yoga",
    url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "back",
    name: "Costas & Barra",
    url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
  },
];

export const MONTH_PRIZE: MonthPrize = {
  title: "WheyProtein",
  imageUrl: "https://www.drogasil.com.br/_next/image?url=https%3A%2F%2Fproduct-data.raiadrogasil.io%2Fimages%2F3446808.webp&w=3840&q=40",
  description: "Complete a maior quantidade de treinos este mês para concorrer ao Prêmio",
  details: "O membro da equipe com o maior número de treinos validados e consistência semanal ganhará este super WheyProtein.",
};

export const DEFAULT_TROPHIES: Trophy[] = [
  {
    id: "first_workout",
    title: "1º de muitos",
    description: "Registre seu primeiro treino",
    icon: "CheckCircle",
    unlocked: false,
  },
  {
    id: "7_days",
    title: "7 dias",
    description: "1 semana consecutiva",
    icon: "Flame",
    unlocked: false,
  },
  {
    id: "14_days",
    title: "14 dias",
    description: "Uau! Metade da meta, foco e força",
    icon: "TrendingUp",
    unlocked: false,
  },
  {
    id: "30_days",
    title: "O(A) brabo(a)",
    description: "30 dias de foco. Parabéns!",
    icon: "Crown",
    unlocked: false,
  },
];

export const SEED_POSTS: GymPost[] = [];

