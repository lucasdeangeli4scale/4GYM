/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Camera,
  Upload,
  Check,
  RotateCcw,
  Trash2,
  SwitchCamera
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GymPost } from "../types";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPost: (text: string, imageUrl?: string, duration?: number, intensity?: "Low" | "Medium" | "High", modality?: string) => void;
  postToEdit?: GymPost;
  onDeletePost?: (id: string) => void;
}

const MODALITIES = [
  "Academia",
  "Bicicleta",
  "Canoa",
  "Corrida",
  "CrossFit",
  "Fit Dance",
  "Funcional",
  "Futebol",
  "Pilates",
  "Surf",
  "Vôlei",
  "Yoga"
];

export default function PostModal({
  isOpen,
  onClose,
  onSubmitPost,
  postToEdit,
  onDeletePost,
}: PostModalProps) {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modality, setModality] = useState("Academia");
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const isEditMode = !!postToEdit;

  // Webcam states
  const [useWebcam, setUseWebcam] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Clean form state or prefill on modal display triggers
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setText("");
      setSelectedImage(null);
      setUseWebcam(false);
      setFacingMode("user");
      setShowAbandonConfirm(false);
      setShowDeleteConfirm(false);
      setModality("Academia");
    } else if (postToEdit) {
      setText(postToEdit.text);
      setSelectedImage(postToEdit.imageUrl || null);
      setModality(postToEdit.modality || "Academia");
    }
  }, [isOpen, postToEdit]);

  const handleBackRequest = () => {
    setShowAbandonConfirm(true);
  };

  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: mode },
        audio: false,
      });
      setCameraStream(stream);
      setUseWebcam(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error("Camera source start failure:", err);
          });
        }
      }, 100);
    } catch (err: any) {
      console.error("Webcam open failed:", err);
      setCameraError("Acesso à câmera negado ou indisponível.");
      setUseWebcam(false);
    }
  };

  const toggleCameraFacingMode = async () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      await startCamera(newMode);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setUseWebcam(false);
  };

  const takeSnapshot = () => {
    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // If using front camera, mirror horizontally for natural photo preview alignment
          if (facingMode === "user") {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setSelectedImage(dataUrl);
          stopCamera();
        }
      } catch (e) {
        console.error("Snapshot error:", e);
        setCameraError("Falha ao registrar foto instantânea.");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400; // Constrain size
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7); // Compress
          setSelectedImage(dataUrl);
          stopCamera();
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    onSubmitPost(
      text.trim(),
      selectedImage || undefined,
      postToEdit?.duration || 45,
      postToEdit?.intensity || "High",
      modality
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 bg-[#0A0A0A] z-40 flex flex-col justify-end md:justify-center backdrop-blur-md">
        
        <motion.div
          initial={{ y: "15%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="bg-[#0A0A0A] w-full h-full flex flex-col overflow-hidden relative"
        >
          {/* Nova atividade Header with Back Arrow style */}
          <header className="px-5 py-4 flex items-center justify-between bg-[#0A0A0A] border-b border-[#141414] sticky top-0 z-20">
            <button
              type="button"
              onClick={handleBackRequest}
              className="text-slate-350 hover:text-white cursor-pointer p-1.5 hover:bg-[#111111] rounded-full transition-all"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5 text-violet-400 stroke-[2.2]" />
            </button>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              {isEditMode ? "Editar atividade" : "Nova atividade"}
            </h2>
            {isEditMode ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-rose-450 hover:text-rose-400 cursor-pointer p-1.5 hover:bg-[#111111] rounded-full transition-all"
                title="Excluir Atividade"
              >
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </button>
            ) : (
              <div className="w-8" />
            )}
          </header>
 
          {/* Activity Formulation Form */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 pb-26 scrollbar-none">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Activity Description */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 tracking-wider block font-sans">
                  Descrição
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="O que tem em mente, ou o que treinou pesado hoje?"
                  required
                  rows={4}
                  className="w-full bg-[#111111] border border-[#202020] rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none transition-colors resize-none"
                />
              </div>

              {/* Modality Dropdown Select */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 tracking-wider block font-sans">
                  Modalidade
                </label>
                <div className="relative">
                  <select
                    value={modality}
                    onChange={(e) => setModality(e.target.value)}
                    className="w-full bg-[#111111] border border-[#202020] rounded-xl px-4 pr-10 py-3.5 text-sm text-white focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none transition-colors appearance-none cursor-pointer"
                  >
                    {MODALITIES.map((item) => (
                      <option key={item} value={item} className="bg-[#0A0A0A] text-white">
                        {item}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-450" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Proof of Work Capture Area */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 tracking-wider block font-sans flex items-center justify-between">
                  <span>Adicionar Foto</span>
                  {selectedImage && (
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="text-[10px] text-rose-450 hover:text-rose-400 underline font-sans flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Remover foto
                    </button>
                  )}
                </label>

                {/* Interactive Dashed Box */}
                <div 
                  onClick={() => {
                    if (!selectedImage && !useWebcam) {
                      nativeCameraInputRef.current?.click();
                    }
                  }}
                  className={`bg-[#0A0A0A] border-[1px] border-dashed rounded-xl overflow-hidden min-h-[220px] flex flex-col items-center justify-center relative p-5 cursor-pointer hover:border-violet-400/80 transition-all ${
                    selectedImage ? "border-[#202020] p-0" : "border-zinc-800"
                  }`}
                >
                  {/* Camera stream */}
                  {useWebcam && !selectedImage && (
                    <div className="absolute inset-0 flex flex-col bg-[#020202] z-20">
                      <video
                        ref={videoRef}
                        className={`w-full h-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
                        playsInline
                        muted
                      />
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-[#0C0C0E]/95 backdrop-blur-md py-1.5 px-3 rounded-full border border-slate-800 shadow-xl z-30">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            takeSnapshot();
                          }}
                          className="bg-violet-400 hover:bg-violet-500 text-black px-3 py-1.5 text-xs font-extrabold rounded-full flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5 text-black" /> Capturar Foto
                        </button>
                        
                        <span className="w-[1px] h-3 bg-zinc-700" />
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCameraFacingMode();
                          }}
                          className="text-violet-400 hover:text-violet-300 p-1.5 rounded-full cursor-pointer transition-colors flex items-center justify-center bg-zinc-900/65"
                          title="Virar Câmera (Frontal / Traseira)"
                        >
                          <SwitchCamera className="w-4 h-4 text-violet-400" />
                        </button>

                        <span className="w-[1px] h-3 bg-zinc-700" />

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            stopCamera();
                          }}
                          className="text-slate-400 hover:text-white text-xs font-semibold cursor-pointer px-1.5"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
  
                  {/* Selected image preview */}
                  {selectedImage ? (
                    <div className="w-full h-full aspect-[1.35/1] overflow-hidden relative">
                      <img
                        src={selectedImage}
                        alt="Preview upload"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute right-3 top-3 bg-violet-400 text-black p-1.5 rounded-full shadow-lg z-10 border border-[#0A0A0A]">
                        <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                      </div>
                    </div>
                  ) : !useWebcam ? (
                    /* Centered camera trigger & instructions */
                    <div className="flex flex-col items-center text-center p-3 gap-3">
                      <div className="w-13 h-13 rounded-full bg-[#111111] border border-zinc-800 flex items-center justify-center group-hover:border-violet-400 transition-colors">
                        <Camera className="w-6 h-6 text-violet-400 stroke-[2.2]" />
                      </div>
  
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-200">
                          Registre seu momento
                        </p>
                      </div>
  
                      {/* Triggers with Native App option, and Gallery */}
                      <div className="flex flex-col items-center justify-center gap-3 mt-1.5 w-full">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            nativeCameraInputRef.current?.click();
                          }}
                          className="text-xs uppercase font-bold tracking-wider text-violet-400 hover:text-white bg-[#141414] border border-violet-500/30 rounded-lg w-full py-3 transition-colors"
                        >
                          Abrir Câmera
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="text-xs uppercase font-bold tracking-wider text-slate-350 hover:text-white bg-[#141414] border border-zinc-800 rounded-lg w-full py-3 transition-colors"
                        >
                          Galeria
                        </button>
                      </div>

                      {cameraError && (
                        <p className="text-[10px] text-rose-450 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/10 mt-1">
                          {cameraError}
                        </p>
                      )}
                    </div>
                  ) : null}
  
                  {/* Hidden inputs */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={nativeCameraInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                </div>
              </div>
 
              {/* Submit panel */}
              <div className="flex gap-3 pt-6 border-t border-[#141414]">
                <button
                  type="button"
                  onClick={handleBackRequest}
                  className="flex-1 py-3 bg-[#111111] border border-slate-900 text-slate-400 font-bold rounded-xl hover:text-white text-xs transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className={`flex-1 py-3 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    text.trim()
                      ? "bg-violet-400 hover:bg-violet-500 text-black shadow-lg shadow-violet-500/10"
                      : "bg-[#161616] text-slate-600 cursor-not-allowed"
                  }`}
                >
                  {isEditMode ? "Atualizar atividade" : "Publicar Atividade"}
                </button>
              </div>
 
            </form>
          </div>
        </motion.div>

        {/* Abandon confirmation modal */}
        <AnimatePresence>
          {showAbandonConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 flex items-center justify-center p-6 z-50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#111111] border border-slate-800/80 p-6 rounded-2xl max-w-xs w-full text-center space-y-4 shadow-2xl"
              >
                <p className="text-sm font-bold text-white">Deseja abandonar o treino?</p>
                <p className="text-xs text-slate-405 leading-relaxed">Textos ou imagens selecionadas não serão salvos se você sair agora.</p>
                <div className="flex gap-2.5 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAbandonConfirm(false)}
                    className="flex-grow py-2.5 bg-[#1C1C1E] hover:bg-[#2C2C2E] text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Continuar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAbandonConfirm(false);
                      stopCamera();
                      onClose();
                    }}
                    className="flex-grow py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Abandonar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete confirmation modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 flex items-center justify-center p-6 z-55 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#111111] border border-slate-800/80 p-6 rounded-2xl max-w-xs w-full text-center space-y-4 shadow-2xl"
              >
                <p className="text-sm font-bold text-white">Deseja apagar seu treino?</p>
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-grow py-2.5 bg-[#1C1C1E] hover:bg-[#2C2C2E] text-slate-350 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      if (onDeletePost && postToEdit) {
                        onDeletePost(postToEdit.id);
                      }
                      onClose();
                    }}
                    className="flex-grow py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Apagar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AnimatePresence>
  );
}
