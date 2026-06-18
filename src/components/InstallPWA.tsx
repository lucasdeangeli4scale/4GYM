import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download } from "lucide-react";

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompted: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 bg-[#111111] border border-violet-500/50 p-4 rounded-xl flex items-center justify-between z-50 text-white"
      >
        <div className="flex items-center gap-3">
          <div className="bg-violet-500 p-2 rounded-lg">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Instalar 4GYM</h3>
            <p className="text-xs text-zinc-400">Instale o app para acesso rápido.</p>
          </div>
        </div>
        <button
          onClick={handleInstall}
          className="bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold py-2 px-4 rounded-lg"
        >
          Instalar
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
