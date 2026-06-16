/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GymPost, UserProfile, WeightRecord } from "./types";
import { SEED_POSTS } from "./data";
import TimelineView from "./components/TimelineView";
import DesafiosView from "./components/DesafiosView";
import PerfilView from "./components/PerfilView";
import PostModal from "./components/PostModal";
import AuthView from "./components/AuthView";
import { Dumbbell, Trophy, User, RotateCcw, HelpCircle, Flame, Dumbbell as DumbbellIcon, ShieldCheck, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  updateDoc 
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "./firebase";
import { handleFirestoreError, OperationType } from "./firebaseUtils";

const LOCAL_STORAGE_POSTS_KEY = "team_gym_posts_v1";
const LOCAL_STORAGE_PROFILE_KEY = "team_gym_profile_v1";

const INITIAL_PROFILE: UserProfile = {
  name: "Alex Mercer",
  email: "lucas_deangeli@4scale.com.br",
  weightRecords: [
    { id: "rec_1", weight: 78.5, height: 1.82, date: "2026-06-16T08:00:00.000Z" },
    { id: "rec_2", weight: 79.2, height: 1.82, date: "2026-06-01T08:00:00.000Z" },
    { id: "rec_3", weight: 80.5, height: 1.82, date: "2026-05-15T08:00:00.000Z" }
  ],
  inviteCode: "461011"
};

export default function App() {
  // State for active view tab: 'timeline' | 'desafios' | 'perfil'
  const [activeTab, setActiveTab] = useState<"timeline" | "desafios" | "perfil">("timeline");

  // Auth states
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // State for loaded posts
  const [posts, setPosts] = useState<GymPost[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return SEED_POSTS; }
    }
    return SEED_POSTS;
  });

  // State for loaded user profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_PROFILE; }
    }
    return INITIAL_PROFILE;
  });

  // Authenticate track
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        setCurrentUserEmail(firebaseUser.email);
        setUserProfile((prev) => ({
          ...prev,
          email: firebaseUser.email || prev.email,
          name: firebaseUser.displayName || prev.name || "Atleta"
        }));
      } else {
        setCurrentUserEmail(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUserEmail(null);
    } catch (e) {
      console.error("Erro ao deslogar:", e);
    }
  };

  // Modal open states
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);

  // Fallback states for Firestore permissions block
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  // Real-time listen to all posts in Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "posts"),
      (snapshot) => {
        const list: GymPost[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            userName: data.userName || "",
            userEmail: data.userEmail || "",
            dateTime: data.dateTime || "",
            text: data.text || "",
            imageUrl: data.imageUrl || undefined,
            likes: data.likes || 0,
            comments: data.commentsCount || 0,
            isLiked: data.likesList?.includes(userProfile.email) || false,
            likesList: data.likesList || [],
            commentsList: data.commentsList || [],
            duration: data.duration || undefined,
            intensity: data.intensity || undefined,
          } as GymPost);
        });

        // Sort descending by date
        list.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

        // Auto-seed SEED_POSTS if the collection is completely empty on first launch
        if (list.length === 0) {
          const checkAndSeed = async () => {
            const querySnap = await getDocs(collection(db, "posts"));
            if (querySnap.empty) {
              for (const post of SEED_POSTS) {
                const docRef = doc(db, "posts", post.id);
                await setDoc(docRef, {
                  userName: post.userName,
                  userEmail: post.userEmail,
                  dateTime: post.dateTime,
                  text: post.text,
                  imageUrl: post.imageUrl || null,
                  likes: post.likes || 0,
                  likesList: post.id === "post_2" ? ["lucas_deangeli@4scale.com.br"] : [],
                  commentsCount: post.comments || 0,
                  commentsList: Array.from({ length: post.comments || 2 }).map((_, i) => ({
                    username: i % 2 === 0 ? "Juliana Lima" : "Marcus Thorne",
                    text: i % 2 === 0 ? "Caraca! Treino monstro demais! 🔥💪" : "Inspiração foda para a semana!",
                    dateTime: new Date(Date.now() - i * 600000).toISOString()
                  })),
                  duration: post.duration || null,
                  intensity: post.intensity || null,
                });

                // Seed associated frequency
                const postDate = new Date(post.dateTime);
                const weekdaysPT = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                const dayOfWeek = weekdaysPT[postDate.getDay()];
                const weekdaysFull = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
                const dayName = weekdaysFull[postDate.getDay()];

                await setDoc(doc(db, "users", post.userEmail, "frequencies", post.id), {
                  postId: post.id,
                  date: post.dateTime,
                  dayOfWeek,
                  dayName,
                  userEmail: post.userEmail,
                  userName: post.userName,
                });
              }

              // Seed initial user profile weight history to Firestore subcollection
              for (const rec of INITIAL_PROFILE.weightRecords || []) {
                await setDoc(doc(db, "users", INITIAL_PROFILE.email, "weightRecords", rec.id), {
                  id: rec.id,
                  weight: rec.weight,
                  height: rec.height,
                  date: rec.date,
                });
              }
            }
          };
          checkAndSeed().catch(err => console.warn("Auto seeding failed:", err));
        }

        setPosts(list);
        setUseLocalFallback(false);
      },
      (error) => {
        console.warn("Firestore subscription failed (permissions error expected in sandbox):", error);
        setPermissionError("Permissão pendente no Firestore. O app ativou o Armazenamento Local temporariamente para você testá-lo perfeitamente.");
        setUseLocalFallback(true);

        // Load fallback posts from LocalStorage
        const savedPosts = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
        if (savedPosts) {
          try {
            setPosts(JSON.parse(savedPosts));
          } catch {
            setPosts(SEED_POSTS);
          }
        } else {
          setPosts(SEED_POSTS);
        }
      }
    );

    return () => unsubscribe();
  }, [userProfile.email]);

  // Synchronize dynamic profile state with the active userEmail document in Firestore in real-time
  useEffect(() => {
    const emailKey = userProfile.email;
    const userDocRef = doc(db, "users", emailKey);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          let codeValue = data.inviteCode;
          if (!codeValue) {
            codeValue = Math.floor(100000 + Math.random() * 900000).toString();
            updateDoc(userDocRef, { inviteCode: codeValue })
              .catch((err) => console.warn("Failed to update user invite-code:", err));
          }
          setUserProfile({
            name: data.name || INITIAL_PROFILE.name,
            email: data.email || INITIAL_PROFILE.email,
            avatar: data.avatar || INITIAL_PROFILE.avatar,
            weightRecords: data.weightRecords || [],
            inviteCode: codeValue,
          });
        } else {
          // If profile doc doesn't exist yet, we can create it in Firestore
          const freshCode = Math.floor(100000 + Math.random() * 900000).toString();
          setDoc(userDocRef, { ...INITIAL_PROFILE, inviteCode: freshCode })
            .catch((e) => console.warn("Failed to write users profile on Firestore:", e));
        }
        setUseLocalFallback(false);
      },
      (error) => {
        console.warn("Firestore users sync failed (permissions error expected in sandbox):", error);
        setPermissionError("Permissão pendente no Firestore. O app ativou o Armazenamento Local temporariamente para você testá-lo perfeitamente.");
        setUseLocalFallback(true);

        const savedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
        if (savedProfile) {
          try {
            setUserProfile(JSON.parse(savedProfile));
          } catch {
            setUserProfile(INITIAL_PROFILE);
          }
        } else {
          setUserProfile(INITIAL_PROFILE);
        }
      }
    );

    return () => unsubscribe();
  }, [userProfile.email]);

  // Create a new gym post (Firestore with Local Fallback)
  const handleAddPost = async (
    text: string, 
    imageUrl?: string,
    duration?: number,
    intensity?: "Low" | "Medium" | "High"
  ) => {
    const id = "post_" + Date.now();
    const newPost: GymPost = {
      id,
      userName: userProfile.name,
      userEmail: userProfile.email,
      dateTime: new Date().toISOString(),
      text,
      imageUrl: imageUrl || undefined,
      likes: 0,
      comments: 0,
      isLiked: false,
      likesList: [],
      commentsList: [],
      duration,
      intensity,
    };

    // Failover local write
    const updated = [newPost, ...posts];
    setPosts(updated);
    localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updated));

    if (useLocalFallback) return;

    try {
      await setDoc(doc(db, "posts", id), {
        userName: newPost.userName,
        userEmail: newPost.userEmail,
        dateTime: newPost.dateTime,
        text: newPost.text,
        imageUrl: newPost.imageUrl || null,
        likes: 0,
        likesList: [],
        commentsCount: 0,
        commentsList: [],
        duration: duration || null,
        intensity: intensity || null,
      });

      // Write associated frequency calculation
      const postDate = new Date(newPost.dateTime);
      const weekdaysPT = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
      const dayOfWeek = weekdaysPT[postDate.getDay()];
      const weekdaysFull = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
      const dayName = weekdaysFull[postDate.getDay()];

      await setDoc(doc(db, "users", userProfile.email, "frequencies", id), {
        postId: id,
        date: newPost.dateTime,
        dayOfWeek,
        dayName,
        userEmail: userProfile.email,
        userName: userProfile.name,
      });
    } catch (e) {
      console.warn("Firestore write failed, relying on local simulation", e);
    }
  };

  // Delete an existing post (Firestore with Local Fallback)
  const handleDeletePost = async (id: string, email: string) => {
    if (email.toLowerCase() !== userProfile.email.toLowerCase()) {
      alert("Você só pode excluir suas próprias publicações!");
      return;
    }

    const filtered = posts.filter((p) => p.id !== id);
    setPosts(filtered);
    localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(filtered));

    if (useLocalFallback) return;

    try {
      await deleteDoc(doc(db, "posts", id));
      await deleteDoc(doc(db, "users", userProfile.email, "frequencies", id));
    } catch (e) {
      console.warn("Firestore delete failed, relying on local simulation", e);
    }
  };

  // Update profile data and propagate name switches (Firestore with Local Fallback)
  const handleUpdateProfile = async (name: string, email: string) => {
    const oldEmail = userProfile.email;

    const updatedProfile = {
      ...userProfile,
      name,
      email,
    };
    setUserProfile(updatedProfile);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));

    // Propagate local template
    const updatedPosts = posts.map((post) => {
      if (post.userEmail.toLowerCase() === oldEmail.toLowerCase()) {
        return {
          ...post,
          userName: name,
          userEmail: email,
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updatedPosts));

    if (useLocalFallback) return;

    try {
      const oldDocRef = doc(db, "users", oldEmail);
      const newDocRef = doc(db, "users", email);

      if (oldEmail.toLowerCase() !== email.toLowerCase()) {
        await setDoc(newDocRef, {
          name,
          email,
          avatar: userProfile.avatar || "",
          weightRecords: userProfile.weightRecords,
        });
        await deleteDoc(oldDocRef);
      } else {
        await setDoc(oldDocRef, {
          name,
          email,
          avatar: userProfile.avatar || "",
          weightRecords: userProfile.weightRecords,
        });
      }

      const querySnap = await getDocs(collection(db, "posts"));
      querySnap.forEach(async (postDoc) => {
        const postData = postDoc.data();
        if (postData.userEmail?.toLowerCase() === oldEmail.toLowerCase()) {
          await updateDoc(doc(db, "posts", postDoc.id), {
            userName: name,
            userEmail: email,
          });
        }
      });
    } catch (e) {
      console.warn("Firestore update profile failed, relying on local simulation", e);
    }
  };

  // Add physical weight record (Firestore with Local Fallback)
  const handleAddWeightRecord = async (weight: number, height: number) => {
    const newRecord: WeightRecord = {
      id: "rec_" + Date.now(),
      weight,
      height,
      date: new Date().toISOString(),
    };

    const updatedRecords = [newRecord, ...(userProfile.weightRecords || [])];
    const updatedProfile = {
      ...userProfile,
      weightRecords: updatedRecords,
    };
    setUserProfile(updatedProfile);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));

    if (useLocalFallback) return;

    try {
      await updateDoc(doc(db, "users", userProfile.email), {
        weightRecords: updatedRecords,
      });
      await setDoc(doc(db, "users", userProfile.email, "weightRecords", newRecord.id), {
        id: newRecord.id,
        weight: newRecord.weight,
        height: newRecord.height,
        date: newRecord.date,
      });
    } catch (e) {
      console.warn("Firestore add weight record failed, relying on local simulation", e);
    }
  };

  // Remove physical weight record (Firestore with Local Fallback)
  const handleDeleteWeightRecord = async (id: string) => {
    const filteredRecords = (userProfile.weightRecords || []).filter((r) => r.id !== id);
    const updatedProfile = {
      ...userProfile,
      weightRecords: filteredRecords,
    };
    setUserProfile(updatedProfile);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));

    if (useLocalFallback) return;

    try {
      await updateDoc(doc(db, "users", userProfile.email), {
        weightRecords: filteredRecords,
      });
      await deleteDoc(doc(db, "users", userProfile.email, "weightRecords", id));
    } catch (e) {
      console.warn("Firestore delete weight record failed, relying on local simulation", e);
    }
  };

  // Like or Unlike a post (Firestore with Local Fallback)
  const handleLikePost = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const pData = post as any;
    const currentLikesList: string[] = pData.likesList || [];
    const userIndex = currentLikesList.indexOf(userProfile.email);

    let updatedLikesList: string[];
    if (userIndex > -1) {
      updatedLikesList = currentLikesList.filter((email) => email !== userProfile.email);
    } else {
      updatedLikesList = [...currentLikesList, userProfile.email];
    }

    const updatedPosts = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          likes: updatedLikesList.length,
          isLiked: !p.isLiked,
          likesList: updatedLikesList,
        } as GymPost;
      }
      return p;
    });

    setPosts(updatedPosts);
    localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updatedPosts));

    if (useLocalFallback) return;

    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        likesList: updatedLikesList,
        likes: updatedLikesList.length,
      });
    } catch (e) {
      console.warn("Firestore like update failed, relying on local simulation", e);
    }
  };

  // Add Comment (Firestore with Local Fallback)
  const handleAddComment = async (postId: string, text: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const pData = post as any;
    const currentCommentsList: any[] = pData.commentsList || [];
    const newComment = {
      username: userProfile.name,
      userEmail: userProfile.email,
      text: text,
      dateTime: new Date().toISOString(),
    };

    const updatedCommentsList = [...currentCommentsList, newComment];

    const updatedPosts = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: updatedCommentsList.length,
          commentsList: updatedCommentsList,
        } as GymPost;
      }
      return p;
    });

    setPosts(updatedPosts);
    localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updatedPosts));

    if (useLocalFallback) return;

    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        commentsList: updatedCommentsList,
        commentsCount: updatedCommentsList.length,
      });
    } catch (e) {
      console.warn("Firestore add comment failed, relying on local simulation", e);
    }
  };

  // Sandbox helper: clear all posts (Firestore with Local Fallback)
  const handleClearAllPosts = async () => {
    setPosts([]);
    localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify([]));

    if (useLocalFallback) return;

    try {
      const postsSnapshot = await getDocs(collection(db, "posts"));
      const deletePromises = postsSnapshot.docs.map((postDoc) =>
        deleteDoc(doc(db, "posts", postDoc.id))
      );
      await Promise.all(deletePromises);
    } catch (e) {
      console.warn("Firestore clear posts failed, relying on local simulation", e);
    }
  };

  // Sandbox helper: restore demonstration data (Firestore with Local Fallback)
  const handleLoadDemoData = async () => {
    setPosts(SEED_POSTS);
    localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(SEED_POSTS));

    if (useLocalFallback) return;

    try {
      const postsSnapshot = await getDocs(collection(db, "posts"));
      const deletePromises = postsSnapshot.docs.map((postDoc) =>
        deleteDoc(doc(db, "posts", postDoc.id))
      );
      await Promise.all(deletePromises);

      for (const post of SEED_POSTS) {
        const docRef = doc(db, "posts", post.id);
        await setDoc(docRef, {
          userName: post.userName,
          userEmail: post.userEmail,
          dateTime: post.dateTime,
          text: post.text,
          imageUrl: post.imageUrl || null,
          likes: post.likes || 0,
          likesList: post.id === "post_2" ? ["lucas_deangeli@4scale.com.br"] : [],
          commentsCount: post.comments || 0,
          commentsList: Array.from({ length: post.comments || 2 }).map((_, i) => ({
            username: i % 2 === 0 ? "Juliana Lima" : "Marcus Thorne",
            text: i % 2 === 0 ? "Caraca! Treino monstro demais! 🔥💪" : "Inspiração foda para a semana!",
            dateTime: new Date(Date.now() - i * 600000).toISOString()
          })),
          duration: post.duration || null,
          intensity: post.intensity || null,
        });

        // Seed associated frequency
        const postDate = new Date(post.dateTime);
        const weekdaysPT = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
        const dayOfWeek = weekdaysPT[postDate.getDay()];
        const weekdaysFull = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
        const dayName = weekdaysFull[postDate.getDay()];

        await setDoc(doc(db, "users", post.userEmail, "frequencies", post.id), {
          postId: post.id,
          date: post.dateTime,
          dayOfWeek,
          dayName,
          userEmail: post.userEmail,
          userName: post.userName,
        });
      }

      // Seed initial user profile weight history to Firestore subcollection
      for (const rec of INITIAL_PROFILE.weightRecords || []) {
        await setDoc(doc(db, "users", INITIAL_PROFILE.email, "weightRecords", rec.id), {
          id: rec.id,
          weight: rec.weight,
          height: rec.height,
          date: rec.date,
        });
      }
    } catch (e) {
      console.warn("Firestore restore demo failed, relying on local simulation", e);
    }
  };

  // Calculate percentage toward team wellness meta target of the week (mock metadata)
  const mockTeamGoalPercent = 72;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col md:flex-row items-center justify-center p-0 md:p-6 font-sans selection:bg-violet-500/20 selection:text-violet-300">
      
      {/* SIDEBAR DASHBOARD DETAILS (ONLY VISIBLE ON DESKTOP SCREEN RESOLUTION) */}
      <div className="hidden lg:flex flex-col max-w-sm mr-8 my-auto space-y-6 text-slate-400">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#111111] border border-slate-800 rounded-2xl shadow-sm">
              <DumbbellIcon className="w-8 h-8 text-violet-500 stroke-[1.8]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-display">
                4GYM <span className="text-violet-500 text-sm font-mono ml-2">// V1.0</span>
              </h1>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold font-mono">
                Corporate Tracker
              </p>
            </div>
          </div>
        </div>

        {/* Team Goal Card (from Bento Grid HTML template) */}
        <div className="bg-[#111111] border border-slate-800 rounded-3xl p-5 space-y-3.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-mono">META COLETIVA DA EQUIPE</span>
            <span className="text-xs font-bold text-violet-500">{mockTeamGoalPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#1A1A1A] rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-violet-500 rounded-full transition-all duration-1000" 
              style={{ width: `${mockTeamGoalPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Meta conjunta baseada em frequência regular planejada para a semana.
          </p>
        </div>

        <div className="bg-[#111111] border border-slate-800 rounded-3xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-200 font-display flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-500" /> Ferramentas do Sandbox
          </h2>
          <p className="text-xs leading-relaxed text-slate-400">
            Simule facilmente o estado de "Mural Vazio" ou reabilite a equipe de treinos fictícios para testar o painel interativo.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handleClearAllPosts}
              className="bg-[#1A1A1A] hover:bg-slate-800/80 border border-slate-800 text-rose-400 hover:text-rose-300 py-2.5 px-3 rounded-2xl text-xs font-semibold cursor-pointer transition-all inline-flex items-center justify-center gap-1.5"
              title="Permite testar a tela de Timeline vazia conforme regulação de metas do briefing."
            >
              Excluir Tudo
            </button>
            <button
              onClick={handleLoadDemoData}
              className="bg-[#1A1A1A] hover:bg-slate-800/80 border border-slate-800 text-violet-550 hover:text-violet-400 py-2.5 px-3 rounded-2xl text-xs font-semibold cursor-pointer transition-all inline-flex items-center justify-center gap-1.5"
              title="Carrega treinos fictícios de outros membros da equipe."
            >
              Fazer Seed
            </button>
          </div>
        </div>

        <div className="bg-[#111111] border border-slate-800 p-5 rounded-3xl text-[11px] leading-relaxed space-y-2.5 font-mono text-slate-500">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${useLocalFallback ? "bg-amber-500" : "bg-emerald-500"} animate-pulse`} />
            Status de Conexão
          </p>
          <p>
            • Banco de Dados: <span className={`${useLocalFallback ? "text-amber-400" : "text-emerald-400"} font-bold`}>{useLocalFallback ? "LocalStorage Failover" : "Firebase Firestore (Ativo)"}</span>
          </p>
          <p>
            • Sincronização: <span className="text-violet-400 font-bold">{useLocalFallback ? "Local (Navegador)" : "Tempo Real (Nuvem)"}</span>
          </p>
        </div>
      </div>

      {/* MOBILE SMARTPHONE SIMULATOR CONTAINER WRAPPER */}
      <div 
        className="w-full md:max-w-[412px] md:h-[844px] bg-[#0A0A0A] md:rounded-[40px] md:border-[10px] md:border-[#111111] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden aspect-auto border-slate-850"
        id="smartphone-shell"
      >
        {useLocalFallback && permissionError && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-2.5 flex items-start gap-2.5 z-50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mt-1 flex-shrink-0" />
            <div className="flex-1 text-left">
              <span className="text-[9px] font-bold text-amber-400 block uppercase tracking-wider font-mono">
                Banco de Dados Local Ativo
              </span>
              <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
                Não há permissões ativas em seu banco Firestore. O aplicativo salvou as informações localmente e você pode usá-lo por completo!
              </p>
            </div>
          </div>
        )}

        {authLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0A] space-y-3">
            <div className="p-3.5 bg-[#111111] border border-slate-800 rounded-2xl shadow-sm">
              <DumbbellIcon className="w-8 h-8 text-violet-500 animate-bounce" fill="none" />
            </div>
            <p className="text-[10px] text-slate-400 tracking-widest font-mono animate-pulse uppercase">Iniciando Portal...</p>
          </div>
        ) : !currentUserEmail ? (
          <AuthView onAuthSuccess={(email) => setCurrentUserEmail(email)} />
        ) : (
          <>
            {/* Dynamic Screen View Changer */}
            <div className="flex-1 flex flex-col min-h-0 relative select-none bg-[#0A0A0A]">
              {activeTab === "timeline" && (
                <TimelineView
                  posts={posts}
                  onOpenAddPost={() => setIsAddPostOpen(true)}
                  onDeletePost={handleDeletePost}
                  currentUserEmail={userProfile.email}
                  onLikePost={handleLikePost}
                  onAddComment={handleAddComment}
                />
              )}

              {activeTab === "desafios" && (
                <DesafiosView
                  posts={posts}
                  currentUserEmail={userProfile.email}
                  currentUserName={userProfile.name}
                />
              )}

              {activeTab === "perfil" && (
                <PerfilView
                  userProfile={userProfile}
                  posts={posts}
                  onUpdateProfile={handleUpdateProfile}
                  onAddWeightRecord={handleAddWeightRecord}
                  onDeleteWeightRecord={handleDeleteWeightRecord}
                  onSignOut={handleSignOut}
                />
              )}
            </div>

            {/* BOTTOM SOCIAL APP NAVIGATION BAR */}
            <nav className="absolute bottom-0 inset-x-0 bg-[#0A0A0A] border-t border-slate-900 px-4 py-3 pb-5 flex items-center justify-around z-40">
              
              {/* Tab 1: Timeline Feed */}
              <button
                onClick={() => setActiveTab("timeline")}
                className={`cursor-pointer transition-all ${
                  activeTab === "timeline" 
                    ? "bg-[#161616] border border-slate-800/85 rounded-2xl px-5 py-1.5 text-violet-400 scale-102 flex flex-col items-center justify-center min-w-[95px]" 
                    : "text-slate-500 hover:text-slate-300 px-5 py-1.5 flex flex-col items-center justify-center min-w-[95px]"
                }`}
                title="Ir para o Feed"
                id="nav-tab-timeline"
              >
                <Activity className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[9px] font-bold tracking-tight uppercase font-mono mt-0.5">Timeline</span>
              </button>

              {/* Tab 2: Desafios Progression */}
              <button
                onClick={() => setActiveTab("desafios")}
                className={`cursor-pointer transition-all ${
                  activeTab === "desafios" 
                    ? "bg-[#161616] border border-slate-800/85 rounded-2xl px-5 py-1.5 text-violet-400 scale-102 flex flex-col items-center justify-center min-w-[95px]" 
                    : "text-slate-500 hover:text-slate-300 px-5 py-1.5 flex flex-col items-center justify-center min-w-[95px]"
                }`}
                title="Ir para Desafios"
                id="nav-tab-desafios"
              >
                <Trophy className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[9px] font-bold tracking-tight uppercase font-mono mt-0.5">Desafios</span>
              </button>

              {/* Tab 3: Perfil Settings */}
              <button
                onClick={() => setActiveTab("perfil")}
                className={`cursor-pointer transition-all ${
                  activeTab === "perfil" 
                    ? "bg-[#161616] border border-slate-800/85 rounded-2xl px-5 py-1.5 text-violet-400 scale-102 flex flex-col items-center justify-center min-w-[95px]" 
                    : "text-slate-500 hover:text-slate-300 px-5 py-1.5 flex flex-col items-center justify-center min-w-[95px]"
                }`}
                title="Ir para Perfil"
                id="nav-tab-perfil"
              >
                <User className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[9px] font-bold tracking-tight uppercase font-mono mt-0.5">Perfil</span>
              </button>
            </nav>
          </>
        )}

        {/* ACTIVITY POST MODAL OVERLAY */}
        <PostModal
          isOpen={isAddPostOpen}
          onClose={() => setIsAddPostOpen(false)}
          onSubmitPost={handleAddPost}
        />
      </div>

      {/* QUICK FLOATING CONFIG BAR (ONLY VISIBLE ON MOBILE OR IF SIDEBAR IS COVERED/HIDDEN) */}
      <div className="lg:hidden fixed top-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={handleClearAllPosts}
          className="bg-[#111111] border border-slate-800 text-rose-450 py-2 px-3 rounded-full text-[10px] font-bold shadow-xl flex items-center gap-1.5 cursor-pointer hover:bg-[#1a1a1a]"
          title="Mural vazio"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Limpar
        </button>
        <button
          onClick={handleLoadDemoData}
          className="bg-[#111111] border border-slate-800 text-violet-400 py-2 px-3 rounded-full text-[10px] font-bold shadow-xl flex items-center gap-1.5 cursor-pointer hover:bg-[#1a1a1a]"
          title="Seedar equipe"
        >
          <Flame className="w-3.5 h-3.5" /> Seedar
        </button>
      </div>

    </div>
  );
}
