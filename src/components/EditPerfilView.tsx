/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, Upload, Trash2, Check, User, Mail, VideoOff } from "lucide-react";
import { UserProfile } from "../types";

interface EditPerfilViewProps {
  userProfile: UserProfile;
  onBack: () => void;
  onUpdateProfile: (name: string, email: string, avatar?: string) => void;
}

export default function EditPerfilView({
  userProfile,
  onBack,
  onUpdateProfile,
}: EditPerfilViewProps) {
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [avatar, setAvatar] = useState(userProfile.avatar || "");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 300, height: 300, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access failed", err);
      setCameraError("Não foi possível acessar a câmera do dispositivo.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw centered square crop from video
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setAvatar(dataUrl);
        stopCamera();
      }
    } catch (err) {
      console.error("Failed to take picture on canvas", err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeAvatar = () => {
    setAvatar("");
    stopCamera();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onUpdateProfile(name.trim(), email.trim(), avatar);
    onBack();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0A0A0A] text-slate-100 font-sans" id="edit-perfil-screen">
      {/* Header bar */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-[#141414]">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              stopCamera();
              onBack();
            }}
            className="p-1.5 hover:bg-[#161616] rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Voltar ao Perfil"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-extrabold tracking-tight text-white">
            Editar Perfil
          </h1>
        </div>
        <div className="text-[10px] bg-[#161616] text-violet-400 px-3 py-1 rounded-full font-mono font-bold border border-violet-500/15">
          CONFIGURAÇÃO
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-26 scrollbar-none">
        
        {/* Profile photo circle selector */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-32 h-32 rounded-full border-4 border-violet-500/25 bg-[#111111] overflow-hidden group shadow-2xl flex items-center justify-center">
            {isCameraActive ? (
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover scale-x-[-1]" 
                playsInline 
                muted 
              />
            ) : avatar ? (
              <img 
                src={avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-4xl font-extrabold text-violet-400 font-sans">
                {name ? name.charAt(0).toUpperCase() : "A"}
              </div>
            )}

            {/* Overlays */}
            {isCameraActive && (
              <button
                type="button"
                onClick={takeSnapshot}
                className="absolute inset-0 bg-black/40 hover:bg-black/60 flex flex-col items-center justify-center text-xs text-white font-bold transition-colors cursor-pointer"
              >
                <Camera className="w-6 h-6 text-violet-400 mb-1 animate-pulse" />
                <span>Tirar Foto</span>
              </button>
            )}
          </div>

          {/* Picture Actions Buttons */}
          <div className="flex flex-wrap gap-2.5 justify-center">
            {!isCameraActive ? (
              <>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-2 bg-[#141414] hover:bg-zinc-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Camera className="w-4 h-4 text-violet-400" />
                  <span>Câmera</span>
                </button>

                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="px-3 py-2 bg-[#141414] hover:bg-zinc-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Upload className="w-4 h-4 text-violet-400" />
                  <span>Upload</span>
                </button>

                {avatar && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/10 rounded-xl text-xs font-bold text-rose-450 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remover</span>
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <VideoOff className="w-4 h-4" />
                <span>Desligar Câmera</span>
              </button>
            )}

            {/* Ghost input selector */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {cameraError && (
            <p className="text-[10px] text-rose-450 font-bold max-w-xs text-center leading-normal">
              {cameraError}
            </p>
          )}
        </div>

        {/* Profile Information Inputs form */}
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Label Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-violet-400" />
              <span>Nome completo</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full bg-[#111111] border border-[#202020] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none transition-colors"
            />
          </div>

          {/* Label E-mail */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-violet-400" />
              <span>Endereço de E-mail</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu endereço de e-mail"
              className="w-full bg-[#111111] border border-[#202020] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none transition-colors"
            />
          </div>

          {/* Submit Action Block */}
          <div className="pt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onBack();
              }}
              className="flex-1 py-3 text-sm font-bold text-slate-400 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-all cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-sm font-extrabold text-black bg-violet-400 hover:bg-violet-500 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-lg shadow-violet-500/10 active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
