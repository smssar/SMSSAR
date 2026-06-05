"use client";

import { useEffect, useState } from "react";

type AnimatedHeroTextProps = {
  items: readonly string[];
  typingSpeed?: number;
  pauseTime?: number;
  className?: string;
};

export function AnimatedHeroText({
  items,
  typingSpeed = 60,
  pauseTime = 2000,
  className,
}: AnimatedHeroTextProps) {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  const currentText = items[textIndex] ?? "";

  useEffect(() => {
    if (!items.length) return;

    let timer: ReturnType<typeof setTimeout>;

    if (charIndex < currentText.length) {
      timer = setTimeout(() => {
        setCharIndex((prev) => prev + 1);
      }, typingSpeed);
    } else {
      timer = setTimeout(() => {
        setTextIndex((prev) => (prev + 1) % items.length);
        setCharIndex(0);
      }, pauseTime);
    }

    return () => clearTimeout(timer);
  }, [charIndex, currentText, items.length, pauseTime, typingSpeed]);

  return (
    <h1
      className={
        className ?? "text-8xl md:text-5xl font-bold leading-tight max-w-4xl"
      }
    >
      <span className="whitespace-normal break-words">
        {currentText.slice(0, charIndex)}
        <span className="animate-pulse">|</span>
      </span>
    </h1>
  );
}
