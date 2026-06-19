/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { GymPost, TeamMember, Trophy } from "../types";
import { DEFAULT_MEMBERS } from "../data";
import { TrophyNotification } from "./TrophyNotification";
import { 
  Dumbbell, 
  Award, 
  Flame, 
  CalendarCheck, 
  TrendingUp, 
  Sparkles, 
  Trophy as TrophyIcon, 
  X, 
  CheckCircle, 
  Crown, 
  CalendarDays,
  CheckSquare,
  User, 
  Mail, 
  Calendar 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DesafiosViewProps {
  posts: GymPost[];
  currentUserEmail: string;
  currentUserName: string;
  currentUserAvatar?: string;
  teamMembers?: TeamMember[];
}

// Days of the week in PT-BR, matching standard index pattern (1 = Monday, ..., 0 = Sunday)
const WEEKDAYS = [
  { label: "Seg", key: "seg", index: 1 },
  { label: "Ter", key: "ter", index: 2 },
  { label: "Qua", key: "qua", index: 3 },
  { label: "Qui", key: "qui", index: 4 },
  { label: "Sex", key: "sex", index: 5 },
  { label: "Sáb", key: "sab", index: 6 },
  { label: "Dom", key: "dom", index: 0 },
];

export default function DesafiosView({
  posts,
  currentUserEmail,
  currentUserName,
  currentUserAvatar,
  teamMembers,
}: DesafiosViewProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [unlockedLastRender, setUnlockedLastRender] = useState<Record<string, boolean>>({});
  const [activeTrophy, setActiveTrophy] = useState<any>(null);

  // Merge current user with preset roster members
  const list = teamMembers && teamMembers.length > 0 ? teamMembers : DEFAULT_MEMBERS;
  const allMembers = list.map((member) => {
    if (member.email.toLowerCase() === currentUserEmail.toLowerCase()) {
      return {
        ...member,
        name: currentUserName,
        avatar: currentUserAvatar || member.avatar,
      };
    }
    return member;
  });

  // Sort members by registered frequencies descending
  const sortedMembers = [...allMembers].sort((a, b) => {
    const aPosts = posts.filter((p) => p.userEmail.toLowerCase() === a.email.toLowerCase()).length;
    const bPosts = posts.filter((p) => p.userEmail.toLowerCase() === b.email.toLowerCase()).length;
    return bPosts - aPosts;
  });

  // Calculate dynamic checkmarks for each member based on ALL logged posts
  const checkMemberHasWorkoutOnDay = (memberEmail: string, dayIndex: number) => {
    const memberPosts = posts.filter(
      (p) => p.userEmail.toLowerCase() === memberEmail.toLowerCase()
    );
    return memberPosts.some((post) => {
      try {
        const postDate = new Date(post.dateTime);
        return postDate.getDay() === dayIndex;
      } catch {
        return false;
      }
    });
  };

  // Helper to dynamically calculate streak and achievements for any given user
  const getMemberStats = (memberEmail: string) => {
    const memberPosts = posts.filter(
      (p) => p.userEmail.toLowerCase() === memberEmail.toLowerCase()
    );

    const hasFirstStep = memberPosts.length > 0;

    // Compute actual consecutive days streak from user's posts
    const uniqueDates = Array.from(
      new Set(
        memberPosts.map((p) => {
          try {
            const d = new Date(p.dateTime);
            if (isNaN(d.getTime())) return "";
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          } catch {
            return "";
          }
        }).filter((dateStr) => dateStr !== "")
      )
    ).sort();

    let maxStreak = 0;
    let currentStreak = 0;

    if (uniqueDates.length > 0) {
      maxStreak = 1;
      currentStreak = 1;
      
      // Calculate current streak backward from today
      const todayStr = new Date().toISOString().split("T")[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Standard consecutive days search
      let tempStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diffTime = curr.getTime() - prev.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
          if (tempStreak > maxStreak) {
            maxStreak = tempStreak;
          }
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }

      // Re-verify if streak is active today or yesterday
      const lastRecordedDateStr = uniqueDates[uniqueDates.length - 1];
      if (lastRecordedDateStr === todayStr || lastRecordedDateStr === yesterdayStr) {
        // Find how long the active trailing streak is
        let activeStreak = 1;
        let walkDate = new Date(lastRecordedDateStr);
        let activeIdx = uniqueDates.length - 2;
        while (activeIdx >= 0) {
          const expectedPrevStr = new Date(walkDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          if (uniqueDates[activeIdx] === expectedPrevStr) {
            activeStreak++;
            walkDate = new Date(uniqueDates[activeIdx]);
            activeIdx--;
          } else {
            break;
          }
        }
        currentStreak = activeStreak;
      } else {
        currentStreak = 0;
      }
    }

    // Unlocked weekly consistency? (Posts in last 7 days >= 3)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const postsThisWeek = memberPosts.filter(
      (p) => new Date(p.dateTime) >= oneWeekAgo
    );
    const hasWeeklyConsistency = postsThisWeek.length >= 3;

    // Check achievements
    const firstWorkoutUnlocked = hasFirstStep;
    const sevenDaysUnlocked = maxStreak >= 7 || memberPosts.length >= 7 || hasWeeklyConsistency;
    const fourteenDaysUnlocked = maxStreak >= 14 || memberPosts.length >= 14;
    const thirtyDaysUnlocked = maxStreak >= 30 || memberPosts.length >= 30;
    const ninetyDaysUnlocked = maxStreak >= 90 || memberPosts.length >= 90;
    const fiftyCheckinsUnlocked = memberPosts.length >= 50;
    const oneHundredCheckinsUnlocked = memberPosts.length >= 100;

    const trophies = [
      {
        id: "first_workout",
        title: "1º de muitos",
        description: "Registre seu primeiro treino",
        icon: "CheckCircle",
        unlocked: firstWorkoutUnlocked,
      },
      {
        id: "7_days",
        title: "7 dias",
        description: "1 semana consecutiva",
        icon: "Flame",
        unlocked: sevenDaysUnlocked,
      },
      {
        id: "14_days",
        title: "14 dias",
        description: "Uau! Metade da meta, foco e força",
        icon: "TrendingUp",
        unlocked: fourteenDaysUnlocked,
      },
      {
        id: "30_days",
        title: "O(A) brabo(a)",
        description: "30 dias de foco. Parabéns!",
        icon: "Crown",
        unlocked: thirtyDaysUnlocked,
      },
      {
        id: "90_days",
        title: "90 dias",
        description: "3 meses de muita atividade",
        icon: "CalendarDays",
        unlocked: ninetyDaysUnlocked,
      },
      {
        id: "50_checkins",
        title: "50 checkins",
        description: "Metade do caminho. Bora!!!",
        icon: "CheckSquare",
        unlocked: fiftyCheckinsUnlocked,
      },
      {
        id: "100_checkins",
        title: "100 checkins",
        description: "Atleta de verdade. Parabéns pela conquista!",
        icon: "Trophy",
        unlocked: oneHundredCheckinsUnlocked,
      },
    ];

    return {
      totalFrequencies: memberPosts.length,
      currentStreak,
      maxStreak,
      trophies,
      unlockedCount: trophies.filter((t) => t.unlocked).length,
    };
  };

  const renderTrophyIcon = (iconName: string, unlocked: boolean) => {
    const size = 18;
    const colorClass = unlocked ? "text-violet-400 fill-violet-400/10" : "text-zinc-600";
    switch (iconName) {
      case "Flame":
        return <Flame size={size} className={colorClass} />;
      case "TrendingUp":
        return <TrendingUp size={size} className={colorClass} />;
      case "Crown":
        return <Crown size={size} className={colorClass} />;
      case "CheckCircle":
        return <CheckCircle size={size} className={colorClass} />;
      case "CalendarDays":
        return <CalendarDays size={size} className={colorClass} />;
      case "CheckSquare":
        return <CheckSquare size={size} className={colorClass} />;
      default:
        return <TrophyIcon size={size} className={colorClass} />;
    }
  };

  // Safe calculated details when modal is active
  const selectedStats = useMemo(() => selectedMember ? getMemberStats(selectedMember.email) : null, [selectedMember, posts]);

  useEffect(() => {
    if (selectedStats && selectedStats.trophies) {
      selectedStats.trophies.forEach(t => {
        if (t.unlocked && !unlockedLastRender[t.id]) {
          setActiveTrophy(t);
        }
      });
      setUnlockedLastRender(prev => {
        const next = {...prev};
        selectedStats.trophies.forEach(t => next[t.id] = t.unlocked);
        return next;
      });
    }
  }, [selectedStats]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0A0A0A] text-slate-100 font-sans" id="desafios-screen">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-[#141414]">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-violet-400 stroke-[2.2]" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white font-sans">
              Desafios Semanais
            </h1>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Frequência e Consistência Coletiva
            </p>
          </div>
        </div>

        <div className="bg-violet-400/10 border border-violet-400/20 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          <span className="text-[10px] font-bold font-mono text-violet-400">
            SEMANA 3
          </span>
        </div>
      </header>

      {/* Roster List */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-26 scrollbar-none">
        
        {/* Members List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" /> Frequência dos Atletas
          </h2>

          <div className="space-y-3.5" id="athletes-frequency-cards">
            {sortedMembers.map((member, mIdx) => {
              const memberPosts = posts.filter(
                (p) => p.userEmail.toLowerCase() === member.email.toLowerCase()
              );

              const lastPost = memberPosts.length > 0 
                ? [...memberPosts].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())[0]
                : null;

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(mIdx * 0.05, 0.45) }}
                  onClick={() => setSelectedMember(member)}
                  className="bg-[#111111] border border-[#161616] hover:border-violet-500/20 active:border-violet-400/40 rounded-2xl p-4 shadow-sm relative overflow-hidden cursor-pointer transition-all hover:bg-[#131118]/45 active:scale-99/100"
                >
                  {/* Glowing background hint */}
                  {memberPosts.length > 0 && (
                    <div className="absolute right-0 top-0 w-24 h-24 bg-violet-400/[0.015] rounded-full blur-2xl pointer-events-none" />
                  )}

                  {/* Top user row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full border border-[#202020] object-cover bg-zinc-900"
                        referrerPolicy="no-referrer"
                      />
                      {mIdx === 0 && (
                        <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1 border-2 border-[#111111]">
                          <TrophyIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        {member.name}
                        {member.email.toLowerCase() === currentUserEmail.toLowerCase() && (
                          <span className="text-[9px] bg-violet-500/10 border border-violet-500/10 text-violet-400 font-sans font-bold px-1.5 py-0.5 rounded">
                            Você
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {memberPosts.length}{" "}
                        {memberPosts.length === 1 ? "frequência registrada" : "frequências registradas"}
                      </p>
                    </div>

                    {memberPosts.length >= 3 && (
                      <div className="ml-auto bg-violet-400/10 border border-violet-400/20 text-[9px] text-violet-400 font-sans font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-violet-450" /> CONSISTENTE
                      </div>
                    )}
                  </div>

                  {/* Meta Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-zinc-500 font-bold mb-1">
                      <span>Meta</span>
                      <span>{Math.min(Math.round((memberPosts.length / 20) * 100), 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#161616] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-violet-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((memberPosts.length / 20) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Horizontal Weekly tracker */}
                  <div className="pt-3.5 border-t border-slate-900/60">
                    <div className="grid grid-cols-7 gap-1.5">
                      {WEEKDAYS.map((day) => {
                        const hasWorkout = checkMemberHasWorkoutOnDay(member.email, day.index);

                        return (
                          <div
                            key={day.key}
                            className="flex flex-col items-center gap-2"
                          >
                            <span className="text-[10px] font-bold text-slate-500 font-sans">
                              {day.label}
                            </span>
                            
                            {/* Visual bubble */}
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 relative ${
                                hasWorkout
                                  ? "bg-violet-400/10 border-violet-400/40 text-violet-400 shadow-md shadow-violet-500/5 font-extrabold"
                                  : "bg-[#161616] border-[#202020] text-slate-705"
                              }`}
                            >
                              <Dumbbell className={`w-4 h-4 ${hasWorkout ? "text-violet-400 fill-violet-400/20" : "text-slate-800"}`} />

                              {hasWorkout && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-400 ring-1 ring-[#0A0A0A]" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subtext describing the last active post summary */}
                  {lastPost && (
                    <div className="mt-3.5 bg-[#161616] rounded-xl p-2.5 border border-[#1e1e1e] flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <p className="text-[11px] text-slate-450 truncate">
                        Última: <span className="text-slate-300">"{lastPost.text}"</span>
                      </p>
                    </div>
                  )}

                  {/* Aesthetic info button hint */}
                  <div className="mt-3 text-[10px] text-violet-400/40 hover:text-violet-400/70 font-sans font-bold flex items-center gap-1">
                    <span>• Clique para ver detalhes e troféus</span>
                  </div>

                </motion.div>
              );
            })}
          </div>
        </div>

      </div>

      {/* PopUp Modal with Athlete Info & Real achievements */}
      <AnimatePresence>
        {selectedMember && selectedStats && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            id="athlete-details-overlay"
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0E0E0E]/85 backdrop-blur-xl border border-[#1C1C1C] rounded-3xl w-full max-w-sm overflow-hidden relative shadow-2xl flex flex-col h-[90vh]"
              id="athlete-popup-modal"
            >
              {/* Header inside popup */}
              <div className="absolute right-4 top-4 z-10">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="p-1.5 hover:bg-[#1A1A1A]/60 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-4.5 h-4.5 stroke-[2.2]" />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-6 flex-1 scrollbar-none">
                
                {/* Hero profile user info block */}
                <div className="flex flex-col items-center text-center space-y-3 pt-4">
                  <div className="relative w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-md">
                    <img
                      src={selectedMember.avatar}
                      alt={selectedMember.name}
                      className="w-full h-full rounded-full object-cover border-2 border-[#0E0E0E]"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
                      {selectedMember.name}
                      {selectedMember.email.toLowerCase() === currentUserEmail.toLowerCase() && (
                        <span className="text-[9px] bg-violet-500/15 text-violet-400 font-sans font-bold px-1.5 py-0.5 rounded">
                          Você
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 justify-center">
                      <Mail className="w-3.5 h-3.5 text-slate-600" />
                      <span>{selectedMember.email}</span>
                    </p>
                  </div>
                </div>

                {/* Grid items of frequencies + consecutive day stats */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Total Frequencias */}
                  <div className="bg-[#141414] border border-[#202020] rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="bg-violet-400/10 p-2 rounded-xl mb-2">
                      <Dumbbell className="w-5 h-5 text-violet-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                      Total Treinos
                    </span>
                    <span className="text-xl font-black text-white mt-1">
                      {selectedStats.totalFrequencies}
                    </span>
                  </div>

                  {/* Dias corridos streak */}
                  <div className="bg-[#141414] border border-[#202020] rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="bg-orange-500/10 p-2 rounded-xl mb-2">
                      <Flame className="w-5 h-5 text-orange-450 fill-orange-450/10" />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                      Foco Ativo
                    </span>
                    <span className="text-xl font-black text-white mt-1">
                      {selectedStats.currentStreak} {selectedStats.currentStreak === 1 ? "dia" : "dias"}
                    </span>
                  </div>

                </div>

                {/* Sub info of streak details */}
                <div className="bg-[#151515] border border-zinc-900 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 shadow-inner">
                  <span className="flex items-center gap-1.5 text-zinc-500 font-sans font-medium">
                    <Calendar className="w-4 h-4 text-zinc-500" /> Recorde pessoal:
                  </span>
                  <span className="font-bold text-slate-100">
                    {selectedStats.maxStreak} {selectedStats.maxStreak === 1 ? "dia" : "dias"} seguidos
                  </span>
                </div>

                {/* Unlocked Trophies block list */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      <TrophyIcon className="w-3.5 h-3.5 text-violet-400" /> Troféus Conquistados
                    </h4>
                    <span className="text-[10px] bg-violet-400/10 border border-violet-400/15 text-violet-400 px-2 py-0.5 rounded-full font-mono font-bold">
                      {selectedStats.unlockedCount} / {selectedStats.trophies.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedStats.trophies.map((trophy) => (
                      <div
                        key={trophy.id}
                        className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-colors ${
                          trophy.unlocked
                            ? "bg-violet-400/[0.02] border-violet-500/15"
                            : "bg-[#111111]/45 border-zinc-900 opacity-55"
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl border ${
                          trophy.unlocked
                            ? "bg-violet-400/10 border-violet-405/20"
                            : "bg-[#181818] border-zinc-800"
                        }`}>
                          {renderTrophyIcon(trophy.icon, trophy.unlocked)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h5 className={`text-xs font-extrabold tracking-tight ${
                            trophy.unlocked ? "text-white" : "text-zinc-500"
                          }`}>
                            {trophy.title}
                          </h5>
                          <p className={`text-[11px] mt-0.5 line-clamp-1 ${
                            trophy.unlocked ? "text-slate-400" : "text-zinc-600"
                          }`}>
                            {trophy.description}
                          </p>
                        </div>

                        {trophy.unlocked ? (
                          <div className="bg-violet-400/10 p-1 rounded-full border border-violet-400/20">
                            <CheckCircle className="w-3.5 h-3.5 text-violet-400 fill-violet-400/10" />
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-600 font-mono font-bold pr-1">Falta</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Friendly button to close */}
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="w-full mt-2 py-3 bg-zinc-900 hover:bg-[#1a1a1a] text-xs font-extrabold tracking-wide text-slate-300 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
                >
                  Fechar Visualização
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trophy Notification */}
      <TrophyNotification trophy={activeTrophy} onClose={() => setActiveTrophy(null)} />
    </div>
  );
}
