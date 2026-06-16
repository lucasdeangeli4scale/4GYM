/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GymPost, TeamMember } from "../types";
import { 
  Dumbbell, 
  Bell, 
  Heart, 
  MessageSquare, 
  MoreVertical, 
  Plus, 
  Trash2, 
  Send 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DEFAULT_MEMBERS } from "../data";

interface TimelineViewProps {
  posts: GymPost[];
  onOpenAddPost: () => void;
  onDeletePost?: (id: string, userEmail: string) => void;
  currentUserEmail: string;
  onLikePost?: (id: string) => void;
  onAddComment?: (id: string, text: string) => void;
  teamMembers?: TeamMember[];
}

export default function TimelineView({
  posts,
  onOpenAddPost,
  onDeletePost,
  currentUserEmail,
  onLikePost,
  onAddComment,
  teamMembers,
}: TimelineViewProps) {
  // Sort posts by date, latest first
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );

  // Maintain local states for interaction so it feels instant and alive
  const [likesState, setLikesState] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [commentsState, setCommentsState] = useState<Record<string, { username: string; text: string }[]>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentInput, setNewCommentInput] = useState<string>("");
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  // Initialize interactive counts for default posts to match the Image 1 exactly
  useEffect(() => {
    const initialLikes: Record<string, { count: number; liked: boolean }> = {};
    const initialComments: Record<string, { username: string; text: string }[]> = {};

    posts.forEach(post => {
      // Seed preset likes and comments if defined, or map placeholders
      let presetLikes = post.likes !== undefined ? post.likes : (post.id === "post_1" ? 42 : (post.id === "post_2" ? 128 : 12));
      let presetLiked = post.isLiked !== undefined ? post.isLiked : (post.id === "post_2" ? true : false);

      const pData = post as any;
      if (pData.likesList && Array.isArray(pData.likesList)) {
        presetLikes = pData.likesList.length;
        presetLiked = pData.likesList.includes(currentUserEmail);
      }

      initialLikes[post.id] = { count: presetLikes, liked: presetLiked };
      
      if (pData.commentsList && Array.isArray(pData.commentsList)) {
        initialComments[post.id] = pData.commentsList;
      } else {
        const presetCommentCount = post.comments !== undefined ? post.comments : (post.id === "post_1" ? 5 : (post.id === "post_2" ? 12 : 2));
        initialComments[post.id] = Array.from({ length: presetCommentCount }).map((_, i) => ({
          username: i % 2 === 0 ? "Juliana Lima" : "Marcus Thorne",
          text: i % 2 === 0 ? "Caraca! Treino monstro demais! 🔥💪" : "Inspiração foda para a semana!",
        }));
      }
    });

    setLikesState(initialLikes);
    setCommentsState(initialComments);
  }, [posts, currentUserEmail]);

  // Helper to format timestamps to match Portuguese mockup exactly: "Hoje, 06:30 AM" or "Ontem, 19:15 PM"
  const formatFriendlyTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      
      // Calculate diff in hours to stay safe
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Extract hours and minutes
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const minutesStr = minutes < 10 ? "0" + minutes : minutes;
      const hoursStr = hours < 10 ? "0" + hours : hours;
      const timeStr = `${hoursStr}:${minutesStr} ${ampm}`;

      // Check if same calendar day
      const isToday = date.toDateString() === now.toDateString();
      
      // Check if yesterday
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();

      if (isToday) {
        return `Hoje, ${timeStr}`;
      } else if (isYesterday) {
        return `Ontem, ${timeStr}`;
      } else {
        const d = date.getDate();
        const m = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        return `${d} de ${m}, ${timeStr}`;
      }
    } catch {
      return "Hoje, 06:30 AM";
    }
  };

  // Find avatar helper
  const getMemberAvatar = (email: string, name: string) => {
    const list = teamMembers && teamMembers.length > 0 ? teamMembers : DEFAULT_MEMBERS;
    const member = list.find(m => m.email.toLowerCase() === email.toLowerCase());
    if (member?.avatar) return member.avatar;
    // Fallback based on name or safe avatar
    if (name.includes("Marcus")) {
      return "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80";
    }
    if (name.includes("Elena")) {
      return "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80";
    }
    return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80";
  };

  // Toggle Like Action
  const handleToggleLike = (postId: string) => {
    if (onLikePost) {
      onLikePost(postId);
    } else {
      setLikesState(prev => {
        const current = prev[postId] || { count: 0, liked: false };
        const nextLiked = !current.liked;
        return {
          ...prev,
          [postId]: {
            count: nextLiked ? current.count + 1 : Math.max(0, current.count - 1),
            liked: nextLiked
          }
        };
      });
    }
  };

  // Add Comment Action
  const handleAddComment = (postId: string) => {
    if (!newCommentInput.trim()) return;
    
    if (onAddComment) {
      onAddComment(postId, newCommentInput.trim());
    } else {
      setCommentsState(prev => {
        const list = prev[postId] || [];
        return {
          ...prev,
          [postId]: [
            ...list,
            {
              username: "Alex Mercer", // Current user name matching Perfil
              text: newCommentInput.trim()
            }
          ]
        };
      });
    }

    setNewCommentInput("");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-[#0A0A0A] text-slate-100">
      
      {/* 4GYM Premium Header with Notification Dot in Bell */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-[#141414]">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-violet-400 transform -rotate-45" />
          <h1 className="text-xl font-extrabold tracking-tight text-violet-400 font-sans">
            4GYM
          </h1>
        </div>


      </header>

      {/* Posts Feed Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-28 scrollbar-none">
        
        {sortedPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center py-24 px-6 gap-6 h-full"
            id="empty-state-container"
          >
            <div className="bg-[#111111] p-5.5 rounded-full border border-slate-900/60 shadow-lg animate-pulse">
              <Dumbbell className="w-12 h-12 text-violet-400 stroke-[1.5]" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-bold text-slate-200">
                Mural Vazio
              </p>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Nenhum treino publicado hoje. Dê o primeiro passo e inspire sua equipe!
              </p>
            </div>
            <button
              onClick={onOpenAddPost}
              className="bg-violet-400 hover:bg-violet-500 text-black font-bold px-6 py-2.5 rounded-full text-xs transition-colors cursor-pointer"
            >
              Começar Treino
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {sortedPosts.map((post, index) => {
                const isMyPost = post.userEmail === currentUserEmail;
                const postLikes = likesState[post.id] || { count: 0, liked: false };
                const postComments = commentsState[post.id] || [];
                const isCommentOpen = activeCommentPostId === post.id;

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="bg-[#111111] border border-[#181818] rounded-2xl p-4.5 transition-all duration-200"
                  >
                    {/* Header: User Profile avatar + Metadata */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getMemberAvatar(post.userEmail, post.userName)}
                          alt={post.userName}
                          className="w-10 h-10 rounded-full object-cover border border-[#202020] bg-zinc-800"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h3 className="font-bold text-white text-sm tracking-tight leading-none">
                            {post.userName}
                          </h3>
                          <span className="text-[11px] text-slate-500 mt-1 block font-sans">
                            {formatFriendlyTime(post.dateTime)}
                          </span>
                        </div>
                      </div>


                    </div>

                    {/* Post Content Text */}
                    <p className="text-slate-100 text-sm leading-relaxed mb-3 whitespace-pre-wrap font-sans">
                      {post.text}
                    </p>

                    {/* Duration + Intensity Pills */}
                    {(post.duration || post.intensity) && (
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {post.duration && (
                          <span className="text-[10px] bg-[#161616] border border-slate-800/80 text-violet-300 px-2.5 py-1 rounded-lg font-mono font-medium flex items-center gap-1">
                            ⏱️ {post.duration} min
                          </span>
                        )}
                        {post.intensity && (
                          <span className={`text-[10px] px-2.5 py-1 rounded-lg font-mono font-medium border flex items-center gap-1 ${
                            post.intensity === "High" 
                              ? "bg-[#161616] border-rose-950 text-rose-400" 
                              : post.intensity === "Medium"
                              ? "bg-[#161616] border-amber-950 text-amber-400"
                              : "bg-[#161616] border-emerald-950 text-emerald-400"
                          }`}>
                            ⚡ {post.intensity === "High" ? "Alta" : post.intensity === "Medium" ? "Média" : "Baixa"}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Image Attachment (As shown in Image 1, styled perfectly) */}
                    {post.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-[#1A1A1A] bg-[#0A0A0A] aspect-[1.45/1] relative mb-4">
                        <img
                          src={post.imageUrl}
                          alt="Treino registrado"
                          className="w-full h-full object-cover object-center"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      </div>
                    )}



                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTON (FAB) - Styled precisely like the mockup */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={onOpenAddPost}
        className="absolute bottom-22 right-5 z-40 bg-violet-400 text-black w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:bg-violet-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#0A0A0A] transition-all"
        id="fab-add-activity"
        title="Registrar treino"
      >
        <Plus className="w-6 h-6 stroke-[3.2] text-black" />
      </motion.button>
    </div>
  );
}
