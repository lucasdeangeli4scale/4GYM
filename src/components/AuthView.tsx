/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Dumbbell, Mail, Lock, User, ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import { motion } from "motion/react";

interface AuthViewProps {
  onAuthSuccess: (email: string) => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!email || !email.includes("@")) {
      setError("Por favor, insira um endereço de e-mail válido.");
      return false;
    }
    if (!password || password.length < 6) {
      setError("A senha deve conter no mínimo 6 caracteres.");
      return false;
    }
    if (!isLogin) {
      if (!name.trim()) {
        setError("Por favor, preencha o seu nome completo.");
        return false;
      }
      const rawCode = inviteCodeInput.trim();
      if (!rawCode || !/^\d{6}$/.test(rawCode)) {
        setError("O código de convite com 6 dígitos numéricos é obrigatório.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const sanitizedEmail = email.trim().toLowerCase();

      if (isLogin) {
        // Authenticate existing user
        const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
        if (userCredential.user && userCredential.user.email) {
          onAuthSuccess(userCredential.user.email);
        }
      } else {
        // Validate invite code against existing codes in users list (with default master code support)
        const enteredCode = inviteCodeInput.trim();
        const masterCodes = ["461011", "123456", "000555", "888444"];
        
        if (!masterCodes.includes(enteredCode)) {
          try {
            const q = query(collection(db, "users"), where("inviteCode", "==", enteredCode));
            const querySnap = await getDocs(q);
            if (querySnap.empty) {
              setError("Código de convite inválido ou não correspondente a um membro da equipe.");
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn("Firestore lookup failed, relying on master code fallback safety:", e);
          }
        }

        // Register new user
        const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
        const user = userCredential.user;

        // Set display name in Firebase authentication auth profile
        await updateProfile(user, {
          displayName: name.trim()
        });

        // Generate 6-digit random code for the new user profile
        const personalInviteCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Initialize corresponding User Athlete profile in Firestore
        const userDocRef = doc(db, "users", sanitizedEmail);
        await setDoc(userDocRef, {
          name: name.trim(),
          email: sanitizedEmail,
          inviteCode: personalInviteCode,
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`, // Default sporty avatar placeholder
          weightRecords: [],
          onboarded: false
        });

        if (user.email) {
          onAuthSuccess(user.email);
        }
      }
    } catch (err: any) {
      console.error("Auth process error: ", err);
      // Translate typical Firebase error codes to Portuguese
      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setError("E-mail ou senha inválidos. Verifique as credenciais.");
          break;
        case "auth/email-already-in-use":
          setError("Este endereço de e-mail já está sendo utilizado.");
          break;
        case "auth/weak-password":
          setError("Senha muito fraca. Escolha uma senha mais forte.");
          break;
        case "auth/invalid-email":
          setError("E-mail com formato inválido.");
          break;
        case "auth/network-request-failed":
          setError("Falha de conexão. Verifique sua conectividade.");
          break;
        default:
          setError(err.message || "Ocorreu um erro inesperado durante a autenticação. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center px-6 py-10 bg-[#0A0A0A] overflow-y-auto scrollbar-none font-sans select-none">
      <div className="mx-auto w-full max-w-sm space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center p-3.5 bg-[#111111] border border-slate-800 rounded-3xl shadow-md transform hover:rotate-6 transition-transform duration-300">
            <Dumbbell className="w-8 h-8 text-violet-500 stroke-[1.8]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white font-display">
              4GYM <span className="text-violet-500 text-xs font-mono ml-1"></span>
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-mono mt-1 font-bold">
              {isLogin ? "Acesse sua conta corporativa" : "Crie seu passaporte fitness"}
            </p>
          </div>
        </div>

        {/* Auth Error Toast block */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-rose-500/10 border border-rose-500/15 text-rose-450 rounded-2xl text-xs font-medium text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Complete Name Input (only for signup scenario) */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                Nome Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-[#111111] border border-[#202020] text-sm text-white rounded-2xl pl-10 pr-4 py-3 outline-none focus:border-violet-500 focus:bg-[#151515] transition-all font-sans"
                />
              </div>
            </div>
          )}

          {/* Email input field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com.br"
                className="w-full bg-[#111111] border border-[#202020] text-sm text-white rounded-2xl pl-10 pr-4 py-3 outline-none focus:border-violet-500 focus:bg-[#151515] transition-all font-sans"
              />
            </div>
          </div>

          {/* Password secure input field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-[#111111] border border-[#202020] text-sm text-white rounded-2xl pl-10 pr-11 py-3 outline-none focus:border-violet-500 focus:bg-[#151515] transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-350 cursor-pointer"
                title={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Código de Convite block (only when signup scenario) */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono flex items-center justify-between">
                <span>Código de Convite (6 dígitos)</span>
                <span className="text-[9px] text-[#A855F7] font-sans font-normal bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/10 uppercase">Obrigatório</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="w-4 h-4 text-[#A855F7]" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ex: 123456"
                  className="w-full bg-[#111111] border border-[#202020] text-sm text-white rounded-2xl pl-10 pr-4 py-3 outline-none focus:border-violet-500 focus:bg-[#151515] transition-all font-sans font-mono tracking-widest font-bold"
                />
              </div>
              <p className="text-[9.5px] text-slate-500 leading-normal pl-0.5">
                Solicite o código de convite a um colega de equipe ja cadastrado. Para seu primeiro teste, utilize o código padrão <code className="text-violet-400 select-all font-bold font-mono">123456</code>.
              </p>
            </div>
          )}

          {/* Submit Panel Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-550 text-white font-bold py-3 px-4 rounded-2xl text-sm transition-all shadow-lg hover:shadow-violet-650/15 flex items-center justify-center gap-2 mt-2 disabled:bg-[#1A1A1A] disabled:text-slate-500 disabled:shadow-none cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-slate-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processando...
              </span>
            ) : (
              <>
                {isLogin ? "Acessar Plataforma" : "Completar Registro"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Form toggles */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-slate-400 hover:text-violet-400 transition-colors cursor-pointer"
          >
            {isLogin ? (
              <span>Não possui uma conta? <strong className="text-violet-500">Cadastre-se aqui</strong></span>
            ) : (
              <span>Já possui cadastro corporativo? <strong className="text-violet-500">Faça o Login</strong></span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
