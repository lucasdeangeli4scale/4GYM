/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { GymPost, TeamMember } from "../types";
import { DEFAULT_MEMBERS } from "../data";
import { Dumbbell, Award, Flame, CalendarCheck, CheckCircle2, TrendingUp, Sparkles, Trophy } from "lucide-react";
import { motion } from "motion/react";

interface DesafiosViewProps {
  posts: GymPost[];
  currentUserEmail: string;
  currentUserName: string;
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
}: DesafiosViewProps) {
  // Merge current user with preset roster members
  const allMembers = DEFAULT_MEMBERS.map((member) => {
    if (member.id === "lucas_me") {
      return {
        ...member,
        name: currentUserName,
        email: currentUserEmail,
      };
    }
    return member;
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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0A0A0A] text-slate-100 font-sans">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-[#141414]">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-violet-400 stroke-[2.2]" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white font-sans">
              Desafios Semanais
            </h1>
            <p className="text-[11px] text-slate-500 font-sans">
              Metas e Progresso Coletivo
            </p>
          </div>
        </div>

        <div className="bg-violet-400/10 border border-violet-400/20 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[10px] font-bold font-mono text-violet-400">
            SEMANA 3
          </span>
        </div>
      </header>

      {/* Roster & Goal List */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-26 scrollbar-none">
        
        {/* Weekly Motivational Banner */}
        <div className="bg-[#111111] border border-[#161616] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="bg-violet-400/10 p-3.5 rounded-xl border border-violet-500/15 flex-shrink-0">
            <Trophy className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest block font-sans">
              Meta Coletiva Ativa
            </span>
            <p className="text-xs font-medium text-slate-300 mt-1 leading-relaxed">
              Mantenha o foco e complete pelo menos 3 sessões esta semana para desbloquear premiações!
            </p>
          </div>
        </div>

        {/* Members List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" /> Frequência dos Atletas
          </h2>

          <div className="space-y-3.5">
            {allMembers.map((member, mIdx) => {
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
                  className="bg-[#111111] border border-[#161616] rounded-2xl p-4 shadow-sm relative overflow-hidden"
                >
                  {/* Glowing background hint */}
                  {memberPosts.length > 0 && (
                    <div className="absolute right-0 top-0 w-20 h-20 bg-violet-400/[0.02] rounded-full blur-2xl pointer-events-none" />
                  )}

                  {/* Top user row */}
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full border border-[#202020] object-cover bg-zinc-805"
                      referrerPolicy="no-referrer"
                    />

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
                      <div className="ml-auto bg-violet-400/10 border border-violet-400/20 text-[9px] text-violet-405 font-sans font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-violet-405" /> CONSISTENTE
                      </div>
                    )}
                  </div>

                  {/* Horizontal Weekly tracker (conforming precisely to user intent rules) */}
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
                            
                            {/* Tap Indicator checkmark bubble */}
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 relative ${
                                hasWorkout
                                  ? "bg-violet-400/10 border-violet-400/40 text-violet-400 shadow-md shadow-violet-500/5 font-extrabold"
                                  : "bg-[#161616] border-[#202020] text-slate-700"
                              }`}
                              title={
                                hasWorkout
                                  ? `Treino registrado na ${day.label}`
                                  : `Nenhum treino registrado na ${day.label}`
                              }
                            >
                              <Dumbbell className={`w-4 h-4 ${hasWorkout ? "text-violet-400 fill-violet-400" : "text-slate-800"}`} />

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
                      <p className="text-[11px] text-slate-400 truncate">
                        Última: <span className="text-slate-300">"{lastPost.text}"</span>
                      </p>
                    </div>
                  )}

                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
