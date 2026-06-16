/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TeamMember, Trophy, MonthPrize } from "./types";

export const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: "alex_me",
    name: "Alex Mercer",
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
  title: "Kit Suplementação Pro",
  imageUrl: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=450&auto=format&fit=crop&q=80",
  description: "Complete 20 treinos este mês para concorrer ao kit premium Obsidian.",
  details: "O membro da equipe com o maior número de treinos validados e consistência semanal ganhará este super Kit de Suplementação Pro (linha premium Obsidian) com Creatina, Pré-treino e Coqueteleira térmica de titânio! A entrega ocorre dia 30.",
};

export const DEFAULT_TROPHIES: Trophy[] = [
  {
    id: "7_days",
    title: "7 DIAS",
    description: "Treinou 7 dias seguidos sem furar.",
    icon: "Flame",
    unlocked: false,
  },
  {
    id: "power",
    title: "FORÇA",
    description: "Registrou um recorde de levantamento terra ou supino peso alto.",
    icon: "Dumbbell",
    unlocked: true,
  },
  {
    id: "cardio_challenge",
    title: "CARDIO",
    description: "Totalizou mais de 15km percorridos em esteira ou rua.",
    icon: "TrendingUp",
    unlocked: true,
  },
  {
    id: "elite",
    title: "ELITE",
    description: "Completa mais de 25 treinos registrados com intensidade alta.",
    icon: "Crown",
    unlocked: false,
  },
];

// Seed posts so the app starts with high fidelity, but the user can easily clear them to see the empty state.
export const SEED_POSTS = [
  {
    id: "post_1",
    userName: "Marcus Thorne",
    userEmail: "marcus.thorne@4scale.com.br",
    dateTime: "2026-06-16T13:30:00.000Z", // Today, 06:30 AM (converting to UTC local timezone check)
    text: "Novo PR no levantamento terra! 180kg subiram fáceis hoje. O treino focado em força nas últimas semanas finalmente está dando resultado. Próxima meta: 200kg. 🏋️‍♂️🔥",
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=650&auto=format&fit=crop&q=80",
    likes: 42,
    comments: 5,
    isLiked: false,
    duration: 60,
    intensity: "High" as const,
  },
  {
    id: "post_2",
    userName: "Elena Silva",
    userEmail: "elena.silva@4scale.com.br",
    dateTime: "2026-06-15T22:15:00.000Z", // Yesterday, 19:15 PM (UTC representation)
    text: "Cardio concluído. 10km na esteira em um ritmo constante. A disciplina é o que nos leva longe. 🏃‍♀️✨",
    imageUrl: undefined, // no image for Elena Silva card
    likes: 128,
    comments: 12,
    isLiked: true,
    duration: 45,
    intensity: "Medium" as const,
  },
];
