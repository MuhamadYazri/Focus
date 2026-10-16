import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RollText({ text, className = "" }) {
  return (
    <div className={`flex overflow-hidden relative items-center justify-center ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        {text.split("").map((char, index) => (
          <motion.span
            key={`${char}-${index}`}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8,
            }}
            className="inline-block whitespace-pre"
          >
            {char}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
