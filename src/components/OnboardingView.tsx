/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Dumbbell, Scale, Ruler, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface OnboardingViewProps {
  userName: string;
  onComplete: (weight: number, height: number) => void;
  onSignOut: () => void;
}

export default function OnboardingView({ userName, onComplete, onSignOut }: OnboardingViewProps) {
  const [weightInput, setWeightInput] = useState<string>("");
  const [heightInput, setHeightInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Parse values safely
  const weightVal = parseFloat(weightInput.replace(",", "."));
  const heightVal = parseFloat(heightInput.replace(",", "."));

  // Dynamic IMC calculation to make the form feel fully alive and interactive
  const heightInMeters = heightVal / 100;
  const calculatedIMC =
    weightVal > 0 && heightVal > 0 ? (weightVal / (heightInMeters * heightInMeters)).toFixed(1) : null;

  const getIMCCategory = (imc: number) => {
    if (imc < 18.5) return { label: "Abaixo do peso", color: "text-blue-400" };
    if (imc < 25) return { label: "Peso ideal", color: "text-emerald-400" };
    if (imc < 30) return { label: "Sobrepeso", color: "text-amber-400" };
    return { label: "Obesidade", color: "text-rose-450" };
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(weightVal) || weightVal < 30 || weightVal > 300) {
      setError("Por favor, insira um peso válido entre 30kg e 300kg.");
      return;
    }

    if (isNaN(heightVal) || heightVal < 100 || heightVal > 250 || heightInput.trim().replace(/[^0-9]/g, "").length !== 3) {
      setError("Por favor, insira uma altura válida em centímetros com exatamente 3 dígitos (Ex: 182).");
      return;
    }

    onComplete(weightVal, heightVal / 100);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 bg-[#0A0A0A] overflow-y-auto scrollbar-none font-sans select-none">
      
      {/* Upper Area */}
      <div className="space-y-6 my-auto">
        
        {/* Step Indicator Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-violet-500/10 border border-violet-500/15 rounded-2xl shadow-sm animate-pulse">
            <Scale className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight uppercase font-mono">
              Bem-vindo, {userName.split(" ")[0]}!
            </h1>
            <p className="text-[10.5px] text-slate-400 leading-relaxed max-w-xs mx-auto">
              Para personalizar seu acompanhamento de saúde corporativo, precisamos registrar suas medidas físicas iniciais.
            </p>
          </div>
        </div>

        {/* Error Callout */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-rose-500/10 border border-rose-500/15 text-rose-450 rounded-2xl text-[11px] text-center font-medium"
          >
            {error}
          </motion.div>
        )}

        {/* Setup Inputs Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          
          {/* Weight Field */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              Peso Atual (kg)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Scale className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="text"
                required
                inputMode="decimal"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder="Ex: 78.5"
                className="w-full bg-[#111111] border border-[#202020] text-sm text-white rounded-2xl pl-10 pr-12 py-3 outline-none focus:border-violet-500 focus:bg-[#151515] transition-all font-sans font-bold"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 text-xs font-mono select-none">
                kg
              </div>
            </div>
          </div>

          {/* Height Field */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              Altura Atual (cm)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Ruler className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="text"
                required
                maxLength={3}
                inputMode="numeric"
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Ex: 182"
                className="w-full bg-[#111111] border border-[#202020] text-sm text-white rounded-2xl pl-10 pr-12 py-3 outline-none focus:border-violet-500 focus:bg-[#151515] transition-all font-sans font-bold"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 text-xs font-mono select-none">
                cm
              </div>
            </div>
          </div>

          {/* Interactive UI Feedback (Live BMI Estimator) */}
          {calculatedIMC && !isNaN(parseFloat(calculatedIMC)) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111111] border border-slate-900 rounded-2xl p-3.5 text-center flex items-center justify-between"
            >
              <div className="text-left">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">IMC Estimado</span>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  Classificação: <strong className={getIMCCategory(parseFloat(calculatedIMC)).color}>
                    {getIMCCategory(parseFloat(calculatedIMC)).label}
                  </strong>
                </p>
              </div>
              <div>
                <span className="text-lg font-black font-mono text-violet-400">{calculatedIMC}</span>
              </div>
            </motion.div>
          )}

          {/* Action button */}
          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-550 text-white font-bold py-3.5 px-4 rounded-2xl text-xs tracking-wide transition-all shadow-lg hover:shadow-violet-650/15 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            Concluir e Acessar
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Sign Out Option */}
      <div className="text-center pt-4 border-t border-slate-900 flex flex-col gap-1.5">
        <p className="text-[9.5px] text-slate-500 leading-normal">
          Para garantir total privacidade, seus dados de bioimpedância serão criptografados e salvos em segurança em sua conta.
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="text-[10px] text-slate-400 hover:text-rose-450 transition-colors font-mono uppercase font-bold tracking-wider pt-1 hover:underline cursor-pointer"
        >
          Sair da Conta
        </button>
      </div>

    </div>
  );
}
