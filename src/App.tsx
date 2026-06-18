/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GymPost, UserProfile, WeightRecord, TeamMember, MonthPrize } from "./types";
import { DEFAULT_MEMBERS, MONTH_PRIZE } from "./data";
import TimelineView from "./components/TimelineView";
import DesafiosView from "./components/DesafiosView";
import PerfilView from "./components/PerfilView";
import MedicoesView from "./components/MedicoesView";
import EditPerfilView from "./components/EditPerfilView";
import PostModal from "./components/PostModal";
import AuthView from "./components/AuthView";
import OnboardingView from "./components/OnboardingView";
import { InstallPWA } from "./components/InstallPWA";
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
  inviteCode: "461011",
  onboarded: true
};

export default function App() {
  // State for active view tab: 'timeline' | 'desafios' | 'perfil' | 'medicoes' | 'editar-perfil'
  const [activeTab, setActiveTab] = useState<"timeline" | "desafios" | "perfil" | "medicoes" | "editar-perfil">("timeline");

  // Auth states
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Dynamic real-time synchronized collections from db
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [monthPrize, setMonthPrize] = useState<MonthPrize>(MONTH_PRIZE);

  // State for loaded posts
  const [posts, setPosts] = useState<GymPost[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
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
        // Do not use INITIAL_PROFILE anymore on login.
        // The user profile should be fetched from Firestore in a separate useEffect.
      } else {
        setCurrentUserEmail(null);
        setUserProfile({
           name: "Atleta",
           email: "",
           weightRecords: [],
           inviteCode: "",
           onboarded: false
        });
        localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Synchronize users/team roster from Firestore in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const membersList: TeamMember[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          membersList.push({
            id: docSnap.id,
            name: data.name || "",
            email: data.email || docSnap.id,
            avatar: data.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
          });
        });

        // Seed default team roster if collection is completely empty
        if (membersList.length === 0) {
          const seedRoster = async () => {
            const defaultRoster = [
              {
                name: "Alex Mercer",
                email: "lucas_deangeli@4scale.com.br",
                avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
                inviteCode: "461011"
              },
              {
                name: "Marcus Thorne",
                email: "marcus.thorne@4scale.com.br",
                avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&auto=format&fit=crop&q=80",
                inviteCode: "123456"
              },
              {
                name: "Elena Silva",
                email: "elena.silva@4scale.com.br",
                avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
                inviteCode: "555000"
              },
              {
                name: "Juliana Lima",
                email: "juliana.lima@4scale.com.br",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
                inviteCode: "888444"
              }
            ];

            for (const m of defaultRoster) {
              const uDocRef = doc(db, "users", m.email);
              await setDoc(uDocRef, {
                name: m.name,
                email: m.email,
                avatar: m.avatar,
                inviteCode: m.inviteCode,
                weightRecords: m.email === "lucas_deangeli@4scale.com.br" ? INITIAL_PROFILE.weightRecords : [],
                onboarded: true
              });
            }
          };
          seedRoster().catch((err) => console.warn("Failed to seed dynamic members:", err));
        } else {
          setTeamMembers(membersList);
        }
      },
      (error) => {
        console.warn("Firestore users sync failed:", error);
      }
    );
    return () => unsubscribe();
  }, [userProfile.email]);

  // Synchronize monthly reward config details from Firestore config document in real-time
  useEffect(() => {
    const prizeDocRef = doc(db, "config", "monthPrize");
    const unsubscribe = onSnapshot(
      prizeDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMonthPrize({
            title: data.title || MONTH_PRIZE.title,
            imageUrl: data.imageUrl || MONTH_PRIZE.imageUrl,
            description: data.description || MONTH_PRIZE.description,
            details: data.details || MONTH_PRIZE.details,
          });
        } else {
          setDoc(prizeDocRef, {
            title: MONTH_PRIZE.title,
            imageUrl: MONTH_PRIZE.imageUrl,
            description: MONTH_PRIZE.description,
            details: MONTH_PRIZE.details,
          }).catch((err) => console.warn("Failed to seed dynamic prize configuration:", err));
        }
      },
      (error) => {
        console.warn("Firestore config sync failed:", error);
      }
    );
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

  const handleCompleteOnboarding = async (weight: number, height: number) => {
    const initialRecord: WeightRecord = {
      id: "rec_initial_" + Date.now(),
      weight,
      height,
      date: new Date().toISOString(),
    };

    const updatedProfile: UserProfile = {
      ...userProfile,
      weightRecords: [initialRecord],
      onboarded: true,
    };

    setUserProfile(updatedProfile);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));

    if (useLocalFallback) return;

    try {
      await updateDoc(doc(db, "users", userProfile.email), {
        weightRecords: [initialRecord],
        onboarded: true,
      });
      await setDoc(doc(db, "users", userProfile.email, "weightRecords", initialRecord.id), {
        id: initialRecord.id,
        weight: initialRecord.weight,
        height: initialRecord.height,
        date: initialRecord.date,
      });
    } catch (e) {
      console.warn("Firestore complete onboarding failed, relying on local simulation", e);
    }
  };

  // Modal open states
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<GymPost | null>(null);

  // Fallback states for Firestore permissions block
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  // Real-time listen to all posts in Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "posts"),
      (snapshot) => {
        const list: GymPost[] = [];
        snapshot.forEach((snapshotDoc) => {
          const data = snapshotDoc.data();
          const authorEmail = data.userEmail || "";
          
          list.push({
            id: snapshotDoc.id,
            userName: data.userName || "",
            userEmail: authorEmail,
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
            modality: data.modality || undefined,
          } as GymPost);
        });

        // Sort descending by date
        list.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

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
            setPosts([]);
          }
        } else {
          setPosts([]);
        }
      }
    );

    return () => unsubscribe();
  }, [userProfile.email]);

  // Synchronize dynamic profile state with the active userEmail document in Firestore in real-time
  useEffect(() => {
    if (!currentUserEmail) return; // Prevent invalid reference if email is not set
    const userDocRef = doc(db, "users", currentUserEmail);

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
            name: data.name || "Atleta",
            email: data.email || currentUserEmail,
            avatar: data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            weightRecords: data.weightRecords || [],
            inviteCode: codeValue,
            onboarded: data.onboarded !== undefined ? data.onboarded : ((data.weightRecords && data.weightRecords.length > 0) ? true : false),
          });
        } else {
          // If profile doc doesn't exist yet, we can create it in Firestore
          const freshCode = Math.floor(100000 + Math.random() * 900000).toString();
          setDoc(userDocRef, { 
            name: "Atleta", 
            email: currentUserEmail,
            inviteCode: freshCode, 
            onboarded: false, 
            weightRecords: [],
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
          })
            .catch((e) => console.warn("Failed to write users profile on Firestore:", e));
        }
        setUseLocalFallback(false);
      },
      (error) => {
        console.warn("Firestore users sync failed (permissions error expected in sandbox):", error);
        setPermissionError("Permissão pendente no Firestore.");
        setUseLocalFallback(true);
      }
    );

    return () => unsubscribe();
  }, [currentUserEmail]);

  // Create a new gym post (Firestore with Local Fallback)
  const handleAddPost = async (
    text: string, 
    imageUrl?: string,
    duration?: number,
    intensity?: "Low" | "Medium" | "High",
    modality?: string
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
      modality,
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
        modality: modality || null,
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

  // Edit an existing post (Firestore with Local Fallback)
  const handleEditPost = async (id: string, text: string, imageUrl?: string, modality?: string) => {
    const updated = posts.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          text,
          imageUrl: imageUrl || undefined,
          modality: modality || p.modality,
        };
      }
      return p;
    });
    setPosts(updated);
    localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updated));

    if (useLocalFallback) return;

    try {
      const postRef = doc(db, "posts", id);
      await updateDoc(postRef, {
        text,
        imageUrl: imageUrl || null,
        modality: modality || null,
      });
    } catch (e) {
      console.warn("Firestore edit failed, relying on local simulation", e);
    }
  };

  // Update profile data and propagate name switches (Firestore with Local Fallback)
  const handleUpdateProfile = async (name: string, email: string, avatar?: string) => {
    const oldEmail = userProfile.email;

    const updatedProfile = {
      ...userProfile,
      name,
      email,
      avatar: avatar !== undefined ? avatar : userProfile.avatar,
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
          avatar: avatar || userProfile.avatar || "",
          weightRecords: userProfile.weightRecords,
        });
        await deleteDoc(oldDocRef);
      } else {
        await setDoc(oldDocRef, {
          name,
          email,
          avatar: avatar || userProfile.avatar || "",
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



  // Calculate percentage toward team wellness meta target of the week (mock metadata)
  const mockTeamGoalPercent = 72;

  return (
    <div className="min-h-screen bg-[#060606] text-slate-100 flex items-center justify-center font-sans selection:bg-violet-500/20 selection:text-violet-300">
      
      {/* FOCUS CONTAINER: FULL SCREEN ON MOBILE & TABLET, CLASSIC CELL PHONE PROPORTIONS IN DESKTOP */}
      <div 
        className="w-full h-[100dvh] lg:h-[92dvh] lg:max-h-[880px] lg:max-w-[420px] bg-[#0A0A0A] lg:rounded-3xl lg:border lg:border-[#1E1E1E] lg:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] relative flex flex-col overflow-hidden"
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
        ) : !userProfile.onboarded ? (
          <OnboardingView
            userName={userProfile.name}
            onComplete={handleCompleteOnboarding}
            onSignOut={handleSignOut}
          />
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
                  currentUserAvatar={userProfile.avatar}
                  onLikePost={handleLikePost}
                  onAddComment={handleAddComment}
                  teamMembers={teamMembers}
                  onEditRequest={(post) => {
                    setPostToEdit(post);
                    setIsAddPostOpen(true);
                  }}
                />
              )}

              {activeTab === "desafios" && (
                <DesafiosView
                  posts={posts}
                  currentUserEmail={userProfile.email}
                  currentUserName={userProfile.name}
                  currentUserAvatar={userProfile.avatar}
                  teamMembers={teamMembers}
                />
              )}

              {activeTab === "perfil" && (
                <PerfilView
                  userProfile={userProfile}
                  posts={posts}
                  onAddWeightRecord={handleAddWeightRecord}
                  onDeleteWeightRecord={handleDeleteWeightRecord}
                  onSignOut={handleSignOut}
                  monthPrize={monthPrize}
                  teamMembers={teamMembers}
                  onViewHistory={() => setActiveTab("medicoes")}
                  onEditProfile={() => setActiveTab("editar-perfil")}
                />
              )}

              {activeTab === "editar-perfil" && (
                <EditPerfilView
                  userProfile={userProfile}
                  onBack={() => setActiveTab("perfil")}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}

              {activeTab === "medicoes" && (
                <MedicoesView
                  userProfile={userProfile}
                  onBack={() => setActiveTab("perfil")}
                  onAddWeightRecord={handleAddWeightRecord}
                  onDeleteWeightRecord={handleDeleteWeightRecord}
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
                  activeTab === "perfil" || activeTab === "medicoes" || activeTab === "editar-perfil"
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
          onClose={() => {
            setIsAddPostOpen(false);
            setPostToEdit(null);
          }}
          onSubmitPost={(text, imageUrl, duration, intensity, modality) => {
            if (postToEdit) {
               handleEditPost(postToEdit.id, text, imageUrl, modality);
            } else {
               handleAddPost(text, imageUrl, duration, intensity, modality);
            }
          }}
          postToEdit={postToEdit || undefined}
          onDeletePost={(id) => handleDeletePost(id, userProfile.email)}
        />
        <InstallPWA />
      </div>

    </div>
  );
}
