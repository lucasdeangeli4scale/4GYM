import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw } from "lucide-react";

export const UpdateNotification: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = () => setShow(true);
    window.addEventListener('sw-update-available', handleUpdateAvailable as EventListener);
    
    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable as EventListener);
    };
  }, []);

  const handleUpdate = () => {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 bg-[#111111] border border-violet-500/50 p-4 rounded-xl flex items-center justify-between z-50 text-white shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="bg-violet-500 p-2 rounded-lg">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Nova versão disponível</h3>
            <p className="text-xs text-zinc-400">Clique para atualizar o app.</p>
          </div>
        </div>
        <button
          onClick={handleUpdate}
          className="bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold py-2 px-4 rounded-lg"
        >
          Atualizar
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
