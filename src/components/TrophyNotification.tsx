import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import { Trophy } from "lucide-react";

interface Props {
  trophy: { title: string; description: string } | null;
  onClose: () => void;
}

export const TrophyNotification: React.FC<Props> = ({ trophy, onClose }) => {
  useEffect(() => {
    if (trophy) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [trophy]);

  if (!trophy) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          className="bg-[#111111] border border-violet-500/50 p-6 rounded-2xl text-center max-w-sm w-full relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            animate={{ rotateY: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 bg-violet-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-xl font-bold text-white mb-2">{trophy.title}</h2>
          <p className="text-zinc-400">{trophy.description}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
