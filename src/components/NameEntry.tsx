"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { MAX_NAME_LENGTH, validateName } from "@/lib/rhythm/name";

interface NameEntryProps {
  onSubmit: (name: string) => void;
  initialValue?: string;
}

export function NameEntry({ onSubmit, initialValue = "" }: NameEntryProps) {
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = validateName(name);
    if (!result.valid) {
      setError(result.message);
      return;
    }
    setError(null);
    onSubmit(result.cleaned);
  }

  function tryExample() {
    setName("Talal");
    setError(null);
    onSubmit("Talal");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col items-center gap-4">
      <div className="w-full">
        <label htmlFor="name-input" className="sr-only">
          Your name
        </label>
        <input
          id="name-input"
          name="name"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={MAX_NAME_LENGTH + 5}
          placeholder="Type your name…"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "name-error" : undefined}
          className="font-display glass-panel w-full rounded-2xl px-6 py-5 text-center text-3xl font-semibold text-warm-white placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:text-4xl"
        />
        {error && (
          <motion.p
            id="name-error"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-center text-sm font-medium text-salsa"
          >
            {error}
          </motion.p>
        )}
      </div>

      <motion.button
        type="submit"
        whileTap={{ scale: 0.96 }}
        className="w-full rounded-full bg-gradient-to-r from-salsa to-bachata px-8 py-4 text-lg font-bold text-warm-white shadow-lg shadow-salsa/20 transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        Dance My Name
      </motion.button>

      <button
        type="button"
        onClick={tryExample}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <Sparkles size={14} aria-hidden="true" />
        Try &ldquo;Talal&rdquo;
      </button>
    </form>
  );
}
