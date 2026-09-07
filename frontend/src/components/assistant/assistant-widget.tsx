"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { api } from "@/lib/api";
import { ai, brand } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
};

const STORAGE_KEY = "noks.assistant.session";

export const AssistantWidget = () => {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [config, setConfig] = React.useState<{
    greeting: string;
    suggestions: string[];
    name: string;
  } | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSessionId(window.sessionStorage.getItem(STORAGE_KEY));
  }, []);

  React.useEffect(() => {
    if (!open || config) return;
    api.assistantConfig().then((data) => {
      setConfig({ greeting: data.greeting, suggestions: data.suggestions, name: data.name });
      setMessages((current) =>
        current.length ? current : [{ role: "assistant", content: data.greeting }],
      );
    });
  }, [open, config]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;

    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setSending(true);

    try {
      const response = await api.assistantChat({
        message,
        session_id: sessionId,
        path: pathname,
      });
      window.sessionStorage.setItem(STORAGE_KEY, response.session_id);
      setSessionId(response.session_id);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: response.reply, products: response.products },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I couldn't reach our systems just then. Please try again, or use the Request Quote form and our team will respond directly.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (!ai.enabled) return null;

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.7, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            aria-label={`Open ${ai.name}`}
            className="group fixed left-6 bottom-6 z-40 flex h-13 items-center gap-2.5
                       rounded-full bg-navy-900 border border-white/20 pr-5 pl-4 text-white
                       shadow-[0_10px_30px_-8px_rgba(7,18,51,0.6)]
                       transition-transform hover:scale-[1.03]"
          >
            <span className="relative grid size-7 place-items-center rounded-full bg-white/18">
              <Sparkles className="size-3.5 text-blue-400" />
            </span>
            <span className="text-xs font-semibold">Ask {ai.name}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label={ai.name}
            className="fixed inset-x-4 bottom-4 z-50 flex max-h-[min(640px,88vh)] flex-col
                       overflow-hidden rounded-2xl border border-line bg-white
                       shadow-[0_30px_80px_-24px_rgba(7,18,51,0.5)]
                       sm:inset-x-auto sm:left-6 sm:bottom-6 sm:w-[400px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 bg-navy-900 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-[var(--brand-primary)]">
                  <Bot className="size-4.5" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">{config?.name ?? ai.name}</p>
                  <p className="flex items-center gap-1.5 text-[11.5px] text-white/55">
                    <span className="size-1.5 rounded-full bg-[var(--brand-emerald-light)]" />
                    {brand.name} technical sales
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="grid size-8 place-items-center rounded-full text-white/60
                           transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Transcript */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-surface-muted p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div className={cn("max-w-[86%]", message.role === "user" && "text-right")}>
                    <div
                      className={cn(
                        "inline-block rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
                        message.role === "user"
                          ? "rounded-br-md bg-[var(--brand-primary)] text-white"
                          : "rounded-bl-md border border-line bg-white text-slate-700",
                      )}
                    >
                      {message.content.split("\n").map((line, i) =>
                        line.trim() ? (
                          <p key={i} className={i > 0 ? "mt-2" : undefined}>
                            {line}
                          </p>
                        ) : null,
                      )}
                    </div>

                    {message.products && message.products.length > 0 && (
                      <div className="mt-2 space-y-1.5 text-left">
                        {message.products.map((product) => (
                          <Link
                            key={product.slug}
                            href={`/products/${product.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between gap-3 rounded-xl border
                                       border-line bg-white px-3.5 py-2.5 transition-colors
                                       hover:border-brand-300 hover:bg-brand-50"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-semibold text-navy-900">
                                {product.name}
                              </span>
                              <span className="block truncate text-[11.5px] text-slate-500">
                                {product.category_name}
                              </span>
                            </span>
                            <span className="shrink-0 text-[11px] font-semibold text-[var(--brand-primary)]">
                              View →
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md
                                  border border-line bg-white px-4 py-3 text-[13px] text-slate-500">
                    <Loader2 className="size-3.5 animate-spin" />
                    Checking the catalog…
                  </div>
                </div>
              )}

              {messages.length <= 1 && config?.suggestions?.length ? (
                <div className="space-y-1.5 pt-1">
                  {config.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="flex w-full items-center gap-2 rounded-xl border border-line
                                 bg-white px-3.5 py-2.5 text-left text-[13px] text-slate-600
                                 transition-colors hover:border-brand-300 hover:bg-brand-50
                                 hover:text-navy-900"
                    >
                      <MessageSquare className="size-3.5 shrink-0 text-[var(--brand-primary)]" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Composer */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-line bg-white p-3"
            >
              <label htmlFor="assistant-input" className="sr-only">
                Message the assistant
              </label>
              <input
                id="assistant-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about a product or application…"
                disabled={sending}
                className="h-11 flex-1 rounded-full border border-line bg-surface-muted px-4
                           text-sm outline-none transition-all placeholder:text-slate-400
                           focus:border-brand-400 focus:bg-white disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send message"
                className="grid size-11 shrink-0 place-items-center rounded-full
                           bg-[var(--brand-primary)] text-white transition-all
                           hover:bg-[var(--brand-primary-dark)] disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
