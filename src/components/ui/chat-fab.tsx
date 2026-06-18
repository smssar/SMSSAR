"use client";

import { MessageSquare } from "lucide-react";

export function ChatFab({ prefill }: { prefill?: string }) {
  const open = () => {
    const w = window as Window & { openSmssarChat?: (p?: string) => void };
    w.openSmssarChat?.(prefill);
  };

  return (
    <div className="fixed right-6 bottom-20 z-50">
      <button
        aria-label="Open chat"
        onClick={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 shadow-lg text-white hover:bg-violet-700"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    </div>
  );
}

export default ChatFab;
