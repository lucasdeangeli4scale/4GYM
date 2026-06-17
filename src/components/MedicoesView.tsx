/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  Scale, 
  Trash2, 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Info,
  ChevronRight,
  TrendingUp as IconTendency
} from "lucide-react";
import { WeightRecord, UserProfile } from "../types";

interface MedicoesViewProps {
  userProfile: UserProfile;
  onBack: () => void;
  onAddWeightRecord: (weight: number, height: number) => void;
  onDeleteWeightRecord?: (id: string) => void;
}

export default function MedicoesView({
  userProfile,
  onBack,
  onAddWeightRecord,
  onDeleteWeightRecord,
}: MedicoesViewProps) {
  const records = [...(userProfile.weightRecords || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  ); // Newest first for list

  const chronologicalRecords = [...records].reverse(); // Oldest first for chart

  // State for registering state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form submit handler
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight < 30 || weight > 300) {
      setErrorMsg("Insira um peso válido entre 30kg e 300kg.");
      return;
    }
    const currentHeight = records.length > 0 ? records[0].height : 1.82;
    onAddWeightRecord(weight, currentHeight);
    setNewWeight("");
    setShowAddForm(false);
  };

  // Date Formatting Helper
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

  // IMC Calculation Helpers
  const formatHeightStr = (h: number) => {
    if (!h) return "---";
    const finalCm = h < 10 ? h * 100 : h;
    return `${Math.round(finalCm)} cm`;
  };

  const getIMC = (w: number, h: number) => {
    const finalH = h < 10 ? h : h / 100;
    if (finalH <= 0) return 0;
    return Number((w / (finalH * finalH)).toFixed(1));
  };

  // Determine IMC Category
  const getIMCCategory = (imcValue: number) => {
    if (imcValue < 18.5) return { label: "Abaixo do peso", color: "text-rose-450 bg-rose-500/10 border-rose-500/15" };
    if (imcValue <= 24.9) return { label: "Saudável", color: "text-violet-400 bg-violet-500/10 border-violet-500/15" };
    if (imcValue <= 29.9) return { label: "Sobrepeso", color: "text-amber-405 bg-amber-500/10 border-amber-500/15" };
    return { label: "Obesidade", color: "text-rose-500 bg-rose-600/10 border-rose-600/15" };
  };

  // Chart coordinate math (SVG coordinates: 0,0 top-left, 450,200 width x height)
  const chartWidth = 350;
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 25;

  const weights = chronologicalRecords.map(r => r.weight);
  const minWeight = weights.length > 0 ? Math.min(...weights) : 70;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 90;
  
  const wDiff = maxWeight - minWeight;
  const paddingWeight = wDiff === 0 ? 4 : wDiff * 0.2;
  const chartMinY = minWeight - paddingWeight;
  const chartMaxY = maxWeight + paddingWeight;

  // Generate SVG points path
  const points = chronologicalRecords.map((rec, idx) => {
    const x = paddingX + (idx / Math.max(chronologicalRecords.length - 1, 1)) * (chartWidth - paddingX * 2);
    // Y maps inverted because SVG 0 is top
    const percentY = (rec.weight - chartMinY) / (chartMaxY - chartMinY);
    const y = chartHeight - paddingY - percentY * (chartHeight - paddingY * 2);
    return { x, y, record: rec };
  });

  // SVG Line path string
  let lineD = "";
  let areaD = "";
  if (points.length > 0) {
    lineD = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    
    // Gradient Area below line helper (closed polygon)
    const bottomY = chartHeight - paddingY + 5;
    if (points.length > 1) {
      areaD = `${lineD} L ${points[points.length - 1].x.toFixed(1)} ${bottomY} L ${points[0].x.toFixed(1)} ${bottomY} Z`;
    }
  }

  // Calculate weight dynamic comparisons
  const latestW = records.length > 0 ? records[0].weight : 78.5;
  const oldestW = chronologicalRecords.length > 0 ? chronologicalRecords[0].weight : 78.5;
  const netWeightDiff = latestW - oldestW;
  const currentIMC = records.length > 0 ? getIMC(records[0].weight, records[0].height) : 23.6;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0A0A0A] text-slate-100 font-sans" id="medicoes-screen">
      {/* Header bar */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-[#141414]">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onBack}
            className="p-1.5 hover:bg-[#161616] rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Voltar ao Perfil"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-extrabold tracking-tight text-white">
            Medições Físicas
          </h1>
        </div>
        <div className="text-[10px] bg-[#161616] text-violet-400 px-3 py-1 rounded-full font-mono font-bold border border-violet-500/15">
          HISTÓRICO
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-26 scrollbar-none">
        
        {/* Dynamic Overview Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Latest weight */}
          <div className="bg-[#111111] border border-[#161616] rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Peso Atual</span>
              <span className="text-2xl font-extrabold text-white mt-1.5 block">{latestW.toFixed(1)} <span className="text-xs font-normal text-slate-400">kg</span></span>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              {netWeightDiff <= 0 ? (
                <div className="flex items-center gap-1 text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                  <TrendingDown className="w-3 h-3" />
                  <span>{netWeightDiff.toFixed(1)} kg</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                  <TrendingUp className="w-3 h-3" />
                  <span>+{netWeightDiff.toFixed(1)} kg</span>
                </div>
              )}
              <span className="text-[9px] text-slate-500 font-medium leading-none">desde o início</span>
            </div>
          </div>

          {/* Current IMC card */}
          <div className="bg-[#111111] border border-[#161616] rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">IMC Atual</span>
              <span className="text-2xl font-extrabold text-violet-400 mt-1.5 block">{currentIMC}</span>
            </div>
            <div className="mt-3">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getIMCCategory(currentIMC).color}`}>
                {getIMCCategory(currentIMC).label}
              </span>
            </div>
          </div>
        </div>

        {/* Purple line chart visualization */}
        <div className="bg-[#111111] border border-[#161616] rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-violet-500" />
              Evolução do Peso (kg)
            </h3>
            {records.length > 0 && (
              <span className="text-[10px] bg-violet-500/10 border border-violet-500/15 text-violet-400 px-2 py-0.5 rounded-md font-mono font-bold">
                {records.length} {records.length === 1 ? "medição" : "medições"}
              </span>
            )}
          </div>

          {/* SVG Vector Line Chart */}
          <div className="w-full bg-black/40 rounded-xl p-2 border border-zinc-900 overflow-hidden relative">
            {chronologicalRecords.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-500 font-mono">
                Sem medições para exibir no gráfico.
              </div>
            ) : (
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-auto"
                style={{ overflow: "visible" }}
              >
                <defs>
                  {/* Premium shading gradient under path */}
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#1c1c1e" strokeWidth="1" strokeDasharray="3,3" />
                <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#1c1c1e" strokeWidth="1" strokeDasharray="3,3" />
                <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#1c1c1e" strokeWidth="1" strokeDasharray="3,3" />

                {/* Y-Axis Value Labels (Left) */}
                <text x={paddingX - 8} y={paddingY + 3} fill="#4b5563" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                  {chartMaxY.toFixed(0)}
                </text>
                <text x={paddingX - 8} y={chartHeight / 2 + 3} fill="#4b5563" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                  {((chartMaxY + chartMinY) / 2).toFixed(0)}
                </text>
                <text x={paddingX - 8} y={chartHeight - paddingY + 3} fill="#4b5563" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                  {chartMinY.toFixed(0)}
                </text>

                {/* Shaded Area */}
                {areaD && (
                  <path d={areaD} fill="url(#purpleGrad)" />
                )}

                {/* Main Purple Line */}
                {lineD && (
                  <path 
                    d={lineD} 
                    fill="none" 
                    stroke="#a78bfa" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* X-Axis labels & point markers */}
                {points.map((pt, i) => (
                  <g key={pt.record.id}>
                    {/* Circle */}
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r="4.5" 
                      fill="#a78bfa" 
                      stroke="#0d0d0d" 
                      strokeWidth="2" 
                    />
                    
                    {/* Value label directly above point */}
                    <text 
                      x={pt.x} 
                      y={pt.y - 8} 
                      fill="#f3f4f6" 
                      fontSize="8" 
                      fontWeight="bold" 
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {pt.record.weight.toFixed(1)}
                    </text>

                    {/* Date label at bottom */}
                    {(points.length < 5 || i === 0 || i === points.length - 1 || (points.length === 3 && i === 1)) && (
                      <text 
                        x={pt.x} 
                        y={chartHeight - 6} 
                        fill="#4b5563" 
                        fontSize="8" 
                        fontWeight="bold" 
                        textAnchor="middle"
                      >
                        {formatDate(pt.record.date)}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>

        {/* Add weight record controller */}
        <div className="bg-[#111111] border border-[#161616] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-100">Registrar Novo Peso</p>
              <p className="text-[10px] text-slate-500 leading-normal">
                Com base na altura de cadastro ({formatHeightStr(records.length > 0 ? records[0].height : 1.82)})
              </p>
            </div>
            {!showAddForm ? (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-[10px] text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Peso</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setErrorMsg(null);
                }}
                className="px-2.5 py-1 text-[10px] bg-zinc-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="space-y-3 pt-1 border-t border-zinc-900">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Novo Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    placeholder="Ex: 78.5"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    required
                    className="w-full bg-[#18181b] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:border-violet-400 focus:outline-none"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors border border-violet-500/20 active:scale-97 h-10 flex items-center justify-center"
                >
                  Registrar
                </button>
              </div>
              {errorMsg && (
                <p className="text-[10px] text-rose-450 font-semibold">{errorMsg}</p>
              )}
            </form>
          )}
        </div>

        {/* Historical Weight table */}
        <div className="bg-[#111111] border border-[#161616] rounded-2xl p-4 space-y-3">
          <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-500" />
            Tabela de Histórico
          </h3>

          <div className="bg-black/20 border border-zinc-900 rounded-xl overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#111111]/80 text-slate-400 font-mono text-[9px] border-b border-zinc-900 uppercase">
                    <th className="py-2.5 px-4">Data</th>
                    <th className="py-2.5 px-4">Peso</th>
                    <th className="py-2.5 px-4">IMC</th>
                    <th className="py-2.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-550 text-xs font-mono">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) => {
                      const rImc = getIMC(rec.weight, rec.height);
                      return (
                        <tr key={rec.id} className="hover:bg-[#161616]/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">{formatDate(rec.date)}</td>
                          <td className="py-3 px-4 text-slate-300 font-mono font-medium">{rec.weight.toFixed(1)} kg</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-bold text-violet-400 px-2 py-0.5 bg-violet-500/10 border border-violet-500/10 rounded-md">
                              {rImc}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {onDeleteWeightRecord && records.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => onDeleteWeightRecord(rec.id)}
                                className="text-slate-500 hover:text-rose-455 p-1.5 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                                title="Remover este registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-mono font-medium pr-1">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
