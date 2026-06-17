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
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GymPost } from "../types";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPost: (text: string, imageUrl?: string, duration?: number, intensity?: "Low" | "Medium" | "High") => void;
  postToEdit?: GymPost;
  onDeletePost?: (id: string) => void;
}

export default function PostModal({
  isOpen,
  onClose,
  onSubmitPost,
  postToEdit,
  onDeletePost,
}: PostModalProps) {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const isEditMode = !!postToEdit;

  // Webcam states
  const [useWebcam, setUseWebcam] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean form state or prefill on modal display triggers
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setText("");
      setSelectedImage(null);
      setUseWebcam(false);
      setShowAbandonConfirm(false);
      setShowDeleteConfirm(false);
    } else if (postToEdit) {
      setText(postToEdit.text);
      setSelectedImage(postToEdit.imageUrl || null);
    }
  }, [isOpen, postToEdit]);

  const handleBackRequest = () => {
    setShowAbandonConfirm(true);
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
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
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setSelectedImage(reader.result);
          stopCamera();
        }
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
      postToEdit?.intensity || "High"
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
                      fileInputRef.current?.click();
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
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-slate-900/90 py-1.5 px-4 rounded-full border border-slate-800 shadow-xl z-30">
                        <button
                          type="button"
                          onClick={() => {
                            takeSnapshot();
                            stopCamera();
                          }}
                          className="bg-violet-400 hover:bg-violet-500 text-black px-4 py-1 text-xs font-extrabold rounded-full flex items-center gap-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-black" /> Capturar Foto
                        </button>
                        <span className="w-[1px] h-3 bg-zinc-700" />
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
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
 
                      {/* Small triggers to provide alternative Webcam option or select preset */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startCamera();
                          }}
                          className="text-[10px] uppercase font-bold tracking-wider text-violet-450 hover:text-violet-350 bg-[#141414] border border-zinc-800 rounded-lg px-2.5 py-1"
                        >
                          Abrir Câmera
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-white bg-[#141414] border border-zinc-800 rounded-lg px-2.5 py-1"
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
 
                  {/* Hidden input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
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
