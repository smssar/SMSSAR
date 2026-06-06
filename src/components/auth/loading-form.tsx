/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef, useState, useEffect } from "react";

type Props = React.FormHTMLAttributes<HTMLFormElement> & {
  action: (formData: FormData) => Promise<any> | void;
};

export default function LoadingForm({ action, children, ...rest }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const submitEls = Array.from(
      form.querySelectorAll<HTMLButtonElement | HTMLInputElement>(
        'button[type="submit"], input[type="submit"]',
      ),
    );

    if (loading) {
      submitEls.forEach((el) => el.setAttribute("disabled", "true"));
    } else {
      submitEls.forEach((el) => el.removeAttribute("disabled"));
    }
  }, [loading]);

  function handleSubmit() {
    // Let the native form submission to the server action proceed;
    // we only flip the loading state so the UI can reflect submission.
    setLoading(true);
  }

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={handleSubmit}
      {...rest}
      aria-busy={loading}
      data-loading={loading ? "true" : "false"}
      className={`${rest.className ?? ""} relative`}
    >
      {children}

      {loading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/40">
          <div className="flex items-center space-x-2 rounded-md bg-white/80 px-3 py-2 text-sm shadow">
            <svg
              className="h-4 w-4 animate-spin text-violet-600"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                strokeOpacity="0.25"
              />
              <path
                d="M22 12a10 10 0 00-10-10"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <span>Loading…</span>
          </div>
        </div>
      ) : null}
    </form>
  );
}
