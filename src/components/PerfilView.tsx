/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserProfile, GymPost, Trophy, WeightRecord, MonthPrize, TeamMember } from "../types";
import { DEFAULT_TROPHIES, MONTH_PRIZE } from "../data";
import {
  Trophy as TrophyIcon,
  Flame,
  TrendingUp,
  Sun,
  Crown,
  Heart,
  Scale,
  PlusCircle,
  HelpCircle,
  Dumbbell,
  CheckCircle,
  X,
  Mail,
  User,
  Info,
  ChevronRight,
  Eye,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PerfilViewProps {
  userProfile: UserProfile;
  posts: GymPost[];
  onAddWeightRecord: (weight: number, height: number) => void;
  onDeleteWeightRecord?: (id: string) => void;
  onSignOut?: () => void;
  monthPrize?: MonthPrize;
  teamMembers?: TeamMember[];
  onViewHistory?: () => void;
  onEditProfile?: () => void;
}

export default function PerfilView({
  userProfile,
  posts,
  onAddWeightRecord,
  onDeleteWeightRecord,
  onSignOut,
  monthPrize,
  teamMembers,
  onViewHistory,
  onEditProfile,
}: PerfilViewProps) {
  const activePrize = monthPrize || MONTH_PRIZE;

  // State for registering new weight/height
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [recordError, setRecordError] = useState<string | null>(null);

  // State for prize details modal
  const [isViewingPrizeDetails, setIsViewingPrizeDetails] = useState(false);

  // State for registering/viewing invite copy code
  const [isInviteCodeScreenOpen, setIsInviteCodeScreenOpen] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Active weight/height records
  const records = userProfile.weightRecords || [];
  const latestRecord = records.length > 0 ? records[0] : { weight: 78.5, height: 1.82, date: new Date().toISOString() };

  // Helpers to normalize and format height/IMC metrics
  const getHeightInMeters = (h: number) => {
    if (!h) return 0;
    return h < 10 ? h : h / 100;
  };

  const formatHeight = (h: number) => {
    if (!h) return "---";
    const cmValue = h < 10 ? h * 105 : h; // Keep ratio safe if legacy conversion is around 100
    // Actually safe conversion ratio is 100
    const finalCm = h < 10 ? h * 100 : h;
    return `${Math.round(finalCm)} cm`;
  };

  // Calculate IMC
  const weight = latestRecord.weight;
  const height = latestRecord.height;
  const heightInMeters = getHeightInMeters(height);
  const imc = heightInMeters > 0 ? Number((weight / (heightInMeters * heightInMeters)).toFixed(1)) : 0;

  // Determine IMC Status and Color (Porting to Violet & Rose themes)
  let imcStatus = "Saudável";
  let imcTextColor = "text-violet-400";
  let imcBgColor = "bg-violet-400";
  if (imc < 18.5) {
    imcStatus = "Subpeso";
    imcTextColor = "text-rose-400";
    imcBgColor = "bg-rose-500";
  } else if (imc >= 18.5 && imc <= 24.9) {
    imcStatus = "Saudável";
    imcTextColor = "text-violet-400";
    imcBgColor = "bg-violet-400";
  } else if (imc >= 25 && imc <= 29.9) {
    imcStatus = "Sobrepeso";
    imcTextColor = "text-amber-450";
    imcBgColor = "bg-amber-500";
  } else {
    imcStatus = "Obesidade";
    imcTextColor = "text-rose-500";
    imcBgColor = "bg-rose-600";
  }

  // Position of IMC circle on slider scale (from IMC 15 to 35)
  const minImc = 15;
  const maxImc = 35;
  const imcPercentage = Math.min(
    Math.max(((imc - minImc) / (maxImc - minImc)) * 100, 0),
    100
  );

  // Dynamically calculate trophy unlocks and active focus streaks
  const myPosts = posts.filter(
    (p) => p.userEmail.toLowerCase() === userProfile.email.toLowerCase()
  );

  // 1. Unlocked first training?
  const hasFirstStep = myPosts.length > 0;

  // Compute actual consecutive days streak from user's posts
  const uniqueDates = Array.from(
    new Set(
      myPosts.map((p) => {
        const d = new Date(p.dateTime);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })
    )
  ).sort();

  let maxStreak = 0;
  let currentStreak = 0;
  if (uniqueDates.length > 0) {
    maxStreak = 1;
    currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffTime = curr.getTime() - prev.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }
  }

  // 2. Unlocked weekly consistency? (Posts in last 7 days >= 3)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const postsThisWeek = myPosts.filter(
    (p) => new Date(p.dateTime).getTime() >= oneWeekAgo.getTime()
  );
  const hasWeeklyConsistency = postsThisWeek.length >= 3;

  const trophies: Trophy[] = DEFAULT_TROPHIES.map((trophy) => {
    let unlocked = false;
    if (trophy.id === "first_workout") {
      unlocked = hasFirstStep;
    } else if (trophy.id === "7_days") {
      unlocked = maxStreak >= 7 || myPosts.length >= 7 || hasWeeklyConsistency;
    } else if (trophy.id === "14_days") {
      unlocked = maxStreak >= 14 || myPosts.length >= 14;
    } else if (trophy.id === "30_days") {
      unlocked = maxStreak >= 30 || myPosts.length >= 30;
    }

    return { ...trophy, unlocked };
  });

  // Count unlocked trophies
  const unlockedCount = trophies.filter((t) => t.unlocked).length;

  const getTrophyIcon = (iconName: string, unlocked: boolean) => {
    const size = 24;
    const colorClass = unlocked ? "text-violet-400" : "text-slate-600";
    switch (iconName) {
      case "Flame":
        return <Flame size={size} className={colorClass} />;
      case "TrendingUp":
        return <TrendingUp size={size} className={colorClass} />;
      case "Sun":
        return <Sun size={size} className={colorClass} />;
      case "Crown":
        return <Crown size={size} className={colorClass} />;
      case "CheckCircle":
        return <CheckCircle size={size} className={colorClass} />;
      case "Dumbbell":
        return <Dumbbell size={size} className={colorClass} />;
      default:
        return <TrophyIcon size={size} className={colorClass} />;
    }
  };

  const handleRegisterRecord = (e: React.FormEvent) => {
    e.preventDefault();
    setRecordError(null);
    const w = parseFloat(newWeight);
    if (isNaN(w) || w < 30 || w > 300) {
      setRecordError("Por favor, insira um peso válido entre 30kg e 300kg.");
      return;
    }
    const h = latestRecord.height;
    onAddWeightRecord(w, h);
    setIsAddingRecord(false);
    setNewWeight("");
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0A0A0A] text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-[#141414]">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-violet-400" />
          <h1 className="text-lg font-extrabold tracking-tight text-white font-sans">
            Meu Perfil
          </h1>
        </div>
        <div className="text-[10px] bg-[#161616] text-violet-400 px-3 py-1 rounded-full font-mono font-bold border border-violet-500/15">
          TEAM 4SCALE
        </div>
      </header>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-26 scrollbar-none">
        
        {/* Seção Superior - Dados Básicos */}
        <div className="bg-[#111111] border border-[#161616] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-violet-400/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-full bg-violet-400 p-0.5 flex-shrink-0 border border-[#202020] overflow-hidden flex items-center justify-center animate-fade-in">
                {userProfile.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.name}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="bg-[#111111] h-full w-full rounded-full flex items-center justify-center font-black text-base text-violet-400 font-sans">
                    {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "A"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white truncate tracking-tight">
                  {userProfile.name}
                </h2>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-1 font-sans">
                  <Mail className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  {userProfile.email}
                </p>
              </div>
            </div>

            {/* Editar button below user details inside card */}
            <button
              onClick={onEditProfile}
              className="w-full text-xs font-bold text-violet-400 hover:text-white border border-violet-500/15 hover:border-violet-400/35 py-2.5 bg-[#141414] rounded-xl transition-all cursor-pointer text-center font-sans tracking-wide active:scale-98"
            >
              Editar Perfil
            </button>
          </div>
        </div>

        {/* Access row to Invite Code screen */}
        <div 
          onClick={() => setIsInviteCodeScreenOpen(true)}
          className="bg-gradient-to-r from-violet-900/10 to-transparent border border-violet-500/15 hover:border-violet-500/40 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/15 rounded-xl border border-violet-400/20 text-violet-400">
              <PlusCircle className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono">Código de Convite</h4>
              <p className="text-[10px] text-slate-400 mt-1">Compartilhe o código com seu colega de equipe</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-black text-violet-400 bg-violet-500/20 px-2.5 py-1 rounded-lg border border-violet-500/10 tracking-wider">
              {userProfile.inviteCode || "------"}
            </span>
            <ChevronRight className="w-4 h-4 text-violet-400" />
          </div>
        </div>

        {/* Seção de Prêmio do Mês */}
        <div className="bg-[#111111] border border-[#161616] rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold bg-violet-400/10 border border-violet-400/20 text-violet-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Prêmio do Mês
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Faltam 14 dias</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#202020] bg-zinc-900 flex-shrink-0 relative">
              <img
                src={activePrize.imageUrl}
                alt={activePrize.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white text-sm tracking-tight leading-snug">
                {activePrize.title}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-1 mt-1 leading-normal">
                {activePrize.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsViewingPrizeDetails(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#161616] hover:bg-zinc-800 text-xs font-bold text-slate-300 border border-zinc-800 rounded-xl transition-all cursor-pointer"
          >
            Ver detalhes <ChevronRight className="w-4 h-4 text-violet-400" />
          </button>
        </div>

        {/* Régua de IMC (High Fidelity visual layout mimicking Image 3) */}
        <div className="bg-[#111111] border border-[#161616] rounded-2xl p-5 relative">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wide">
              <Scale className="w-4 h-4 text-violet-400" />
              Índice de Massa Corporal (IMC)
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${imcBgColor} text-slate-950 font-bold`}>
              {imcStatus}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mb-6 block font-sans">
            Peso Ativo: <strong className="text-white">{weight} kg</strong> • Altura: <strong className="text-white">{formatHeight(height)}</strong>
          </p>

          {/* Dynamic IMC ruler container */}
          <div className="relative pt-6 pb-2 px-1">
            
            {/* Visual sliding marker bubble with dynamic calc value above */}
            <div
              className="absolute top-0 transform -translate-x-1/2 transition-all duration-500 ease-out flex flex-col items-center"
              style={{ left: `${imcPercentage}%` }}
            >
              <div className="bg-white text-zinc-950 text-[10px] font-extrabold font-sans px-2 py-0.5 rounded-lg shadow-2xl border border-zinc-300 leading-none">
                {imc}
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-zinc-900 shadow-md translate-y-3.5 z-20" />
            </div>

            {/* Colored horizontal segments representing weight categories */}
            <div className="h-2 rounded-full overflow-hidden flex border border-[#1a1a1a]">
              {/* Underweight (Red-ish) */}
              <div className="flex-[3.5] bg-rose-500" title="Subpeso" />
              {/* Healthy (Premium Violet matching mockups) */}
              <div className="flex-[6.5] bg-violet-400" title="Saudável" />
              {/* Overweight (Amber) */}
              <div className="flex-[5] bg-amber-500" title="Sobrepeso" />
              {/* Obese (Red) */}
              <div className="flex-[5] bg-rose-600" title="Obesidade" />
            </div>

            {/* Labels under the bar */}
            <div className="flex justify-between mt-2.5 text-[9px] font-sans text-slate-500 px-0.5 font-bold">
              <span>Subpeso (15)</span>
              <span>Saudável (22)</span>
              <span>Sobrepeso (27)</span>
              <span>Obesidade (35)</span>
            </div>
          </div>
        </div>

        {/* Últimos registros de Peso/Altura e botão Ver Histórico */}
        <div className="bg-[#111111] border border-[#161616] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3.5">
            <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wide">
              Registros Históricos
            </h4>
            <button
              onClick={() => { setIsAddingRecord(true); setRecordError(null); }}
              className="text-xs text-violet-400 hover:text-white font-bold inline-flex items-center gap-1.5 cursor-pointer bg-violet-500/10 hover:bg-violet-500/15 px-3 py-1.5 rounded-xl border border-violet-500/15 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#202020] bg-[#161616] flex flex-col mb-4">
            {records.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                Sem medições cadastradas ainda.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="bg-[#111111] border-b border-[#202020] text-slate-500 text-[10px] uppercase font-bold">
                    <th className="py-2.5 px-4">Data</th>
                    <th className="py-2.5 px-4 font-sans">Peso (kg)</th>
                    <th className="py-2.5 px-4">Altura</th>
                    <th className="py-2.5 px-4 text-center">IMC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {records.slice(0, 3).map((rec) => {
                    const localHeightM = getHeightInMeters(rec.height);
                    const localImc = localHeightM > 0 ? Number((rec.weight / (localHeightM * localHeightM)).toFixed(1)) : 0;
                    return (
                      <tr key={rec.id} className="hover:bg-zinc-900/40">
                        <td className="py-2.5 px-4">{formatDate(rec.date)}</td>
                        <td className="py-2.5 px-4">{rec.weight} kg</td>
                        <td className="py-2.5 px-4">{formatHeight(rec.height)}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md font-bold bg-[#111111] border border-zinc-800 text-violet-400 text-[10px]">
                            {localImc}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <button
            onClick={onViewHistory}
            className="w-full bg-[#161616] hover:bg-zinc-805 text-xs font-bold text-violet-405 hover:text-white py-2.5 border border-[#202020] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Ver histórico completo</span>
            <ChevronRight className="w-4 h-4 text-violet-450" />
          </button>
        </div>

        {/* Seção de Troféus (Styled precisely inside our layout grid) */}
        <div className="bg-[#111111] border border-[#161616] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wide">
              <TrophyIcon className="w-4 h-4 text-amber-500" />
              Troféus Conquistados ({unlockedCount}/4)
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {trophies.map((trophy) => (
              <div
                key={trophy.id}
                className={`border rounded-xl p-3 flex flex-col gap-1.5 relative transition-all duration-300 ${
                  trophy.unlocked
                    ? "bg-[#161616] border-violet-500/20 shadow-lg shadow-violet-500/5"
                    : "bg-[#161616]/40 border-zinc-900/80 grayscale opacity-40 select-none"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1 rounded-lg ${
                      trophy.unlocked ? "bg-violet-500/10 border border-violet-500/10" : "bg-zinc-800"
                    }`}
                  >
                    {getTrophyIcon(trophy.icon, trophy.unlocked)}
                  </div>
                  <span
                    className={`text-xs font-bold truncate ${
                      trophy.unlocked ? "text-slate-100" : "text-slate-550"
                    }`}
                  >
                    {trophy.title}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {trophy.description}
                </p>
                {trophy.unlocked && (
                  <div className="absolute right-2 top-2">
                    <CheckCircle className="w-3.5 h-3.5 text-violet-400 fill-[#111111] stroke-[2.5]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botão de Sair no final da tela de perfil */}
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-3 bg-[#111111] hover:bg-rose-500/5 text-xs font-bold text-rose-500/80 border border-rose-500/10 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer text-center"
          >
            Sair da Conta
          </button>
        )}

        {/* Versão do App */}
        <div className="text-center pt-2 pb-1">
          <span className="text-[10px] text-zinc-600 font-mono font-bold tracking-wider">
            VERSÃO v1.8
          </span>
        </div>

      </div>

      {/* MODAL: VER DETALHES DO PRÊMIO */}
      <AnimatePresence>
        {isViewingPrizeDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0A0A0A]/90 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              className="bg-[#111111] border border-[#202020] rounded-2xl p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setIsViewingPrizeDetails(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer p-1.5 bg-[#1A1A1A] rounded-full border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2">
                <span className="text-[10px] bg-violet-400/10 border border-violet-400/20 text-violet-400 font-sans font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Premiação Mensal
                </span>
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  {activePrize.title}
                </h3>
              </div>

              <div className="rounded-xl overflow-hidden aspect-square border border-[#202020] bg-zinc-900">
                <img
                  src={activePrize.imageUrl}
                  alt={activePrize.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-3 pt-2">
                <p className="font-bold text-violet-400 text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" /> Como conquistar o Prêmio:
                </p>
                <div className="text-xs text-slate-400 bg-black p-3.5 rounded-xl border border-zinc-900 leading-relaxed">
                  {activePrize.details}
                </div>
              </div>

              <button
                onClick={() => setIsViewingPrizeDetails(false)}
                className="w-full bg-violet-400 hover:bg-violet-500 text-black font-extrabold py-3 rounded-xl text-xs cursor-pointer transition-all mt-4"
              >
                Foco no Objetivo!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: NOVO REGISTRO PESO / ALTURA */}
      <AnimatePresence>
        {isAddingRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0A0A0A]/90 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              className="bg-[#111111] border border-[#202020] rounded-2xl p-6 w-full max-w-sm space-y-5 shadow-2xl relative"
            >
              <button
                onClick={() => setIsAddingRecord(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer p-1.5 bg-[#1A1A1A] rounded-full border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-violet-400" />
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  Nova Medição Física
                </h3>
              </div>

              {recordError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/15 text-rose-450 rounded-xl text-[10.5px] text-center font-medium">
                  {recordError}
                </div>
              )}

              <form onSubmit={handleRegisterRecord} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Último Peso (em kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 78.5"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:border-violet-400 outline-none"
                    required
                  />
                </div>

                <div className="text-[10px] text-slate-500 flex items-start gap-2 bg-black p-3.5 rounded-xl border border-zinc-900 leading-normal">
                  <Info className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>
                    O seu IMC será atualizado de imediato, aplicando a régua visual de saúde na aba de Perfil do applet.
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingRecord(false)}
                    className="flex-1 py-3 text-xs font-bold bg-[#111111] border border-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs font-bold bg-violet-400 hover:bg-violet-500 text-black rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-500/10"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* TELA DE CÓDIGO - Siga exatamente os requerimentos */}
      <AnimatePresence>
        {isInviteCodeScreenOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 bg-[#0A0A0A] z-50 flex flex-col font-sans"
          >
            {/* Header / Barra superior */}
            <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-[#111111]">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold text-white text-sm font-sans tracking-tight">Código do Membro</h3>
              </div>
              <button
                onClick={() => setIsInviteCodeScreenOpen(false)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 select-none">
              
              {/* Informative Icon Accent */}
              <div className="relative">
                <div className="p-5 bg-violet-500/10 rounded-full border border-violet-500/15 text-violet-400 animate-pulse">
                  <div className="w-12 h-12 bg-violet-500/20 rounded-full flex items-center justify-center border border-violet-500/30">
                    <PlusCircle className="w-6 h-6 text-violet-400" />
                  </div>
                </div>
              </div>

              {/* Informative Label */}
              <div className="space-y-2 max-w-xs">
                <h2 className="text-base font-bold text-slate-400 uppercase tracking-wider font-mono">Convite de Membro</h2>
                <p className="text-xs text-slate-300">
                  Compartilhe o código com seu colega de equipe
                </p>
              </div>

              {/* Code Display inside a div with border-rounded-24px dashed in main color */}
              <div className="p-5 border-2 border-dashed border-violet-500 rounded-[24px] bg-[#111111] shadow-2xl relative overflow-hidden group hover:border-violet-400 transition-all min-w-[200px]">
                <span className="text-3xl font-black font-mono tracking-[0.25em] text-white select-all">
                  {userProfile.inviteCode || "461011"}
                </span>
              </div>

              {/* Copy Code button */}
              <div className="w-full max-w-xs">
                <button
                  onClick={() => {
                    if (userProfile.inviteCode) {
                      navigator.clipboard.writeText(userProfile.inviteCode);
                      // Show a transient success notification
                      setCopiedFeedback(true);
                      setTimeout(() => setCopiedFeedback(false), 2000);
                    }
                  }}
                  className="w-full bg-violet-600 hover:bg-violet-550 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-violet-500/5 hover:shadow-violet-650/15 flex items-center justify-center gap-2 cursor-pointer animate-fadeIn"
                >
                  {copiedFeedback ? "Código Copiado! 👍" : "Copiar código"}
                </button>
              </div>

              {/* Extra instructions */}
              <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                Este código é de uso exclusivo para novos atletas da sua equipe. Ele será exigido no momento do cadastro para liberação de acesso.
              </p>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
