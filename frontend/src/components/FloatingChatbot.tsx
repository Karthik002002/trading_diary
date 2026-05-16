import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { MessageCircle, X } from "lucide-react";

type ImageAttachment = {
  id: string;
  name: string;
  url: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: ImageAttachment[];
};

import API_BASE from "../api/config";
const BASE_URL = API_BASE;

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const pendingImagesRef = useRef<ImageAttachment[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      for (const message of messagesRef.current) {
        for (const image of message.images ?? []) {
          URL.revokeObjectURL(image.url);
        }
      }
      for (const image of pendingImagesRef.current) {
        URL.revokeObjectURL(image.url);
      }
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if ((!text && pendingImages.length === 0) || isLoading) return;

    const messageText = text || "Shared image(s)";
    const uploadedImages = pendingImages.map((image) => ({ ...image }));
    const imageContext =
      uploadedImages.length > 0
        ? `\n\nAttached image file(s): ${uploadedImages
            .map((image) => image.name)
            .join(", ")}`
        : "";

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: messageText,
      images: uploadedImages,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setPendingImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a helpful trading assistant." },
            ...messages.map((m) => ({
              role: m.role,
              content:
                m.role === "user" && m.images?.length
                  ? `${m.content}\n\nAttached image file(s): ${m.images
                      .map((image) => image.name)
                      .join(", ")}`
                  : m.content,
            })),
            {
              role: "user",
              content: `${messageText}${imageContext}`,
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      const data = (await res.json()) as { reply?: string };
      const replyText =
        data.reply?.trim() || "Sorry, I could not generate a reply.";

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: replyText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant-error`,
        role: "assistant",
        content: "There was an error talking to the local AI server.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadConversation = () => {
    if (messages.length === 0) return;
    const markdown = messages
      .map((m) => {
        const speaker = m.role === "user" ? "You" : "Assistant";
        const images =
          m.images && m.images.length > 0
            ? `\n\n_Attachments:_ ${m.images.map((image) => image.name).join(", ")}`
            : "";
        return `**${speaker}:** ${m.content}${images}`;
      })
      .join("\n\n");

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "conversation.md";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const nextImages = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setPendingImages((prev) => [...prev, ...nextImages]);
    e.target.value = "";
  };

  const removePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const image = prev.find((item) => item.id === id);
      if (image) {
        URL.revokeObjectURL(image.url);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        type="button"
        className="fixed bottom-34 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-500 focus:outline-none"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[460px] w-80 flex-col rounded-xl bg-gray-950 text-white shadow-2xl border border-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-300">
                Chat
              </span>
              <span className="text-sm text-gray-400">
                Ask anything about your trading
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-700 px-2 py-1 text-[10px] text-gray-300 hover:bg-gray-800"
                onClick={handleDownloadConversation}
                disabled={messages.length === 0}
              >
                Download
              </button>
              <button
                type="button"
                className="rounded-full p-1 hover:bg-gray-800"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conversation + prompt input */}
          <div className="flex h-full flex-col px-3 py-2">
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-md bg-gray-900/70 p-2">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                  <MessageCircle className="mb-2 size-8" />
                  <p className="text-sm font-medium">Start a conversation</p>
                  <p className="text-xs">
                    Type a message below to begin chatting
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "ml-auto bg-purple-600 text-white"
                        : "mr-auto bg-gray-800 text-gray-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.images && m.images.length > 0 ? (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {m.images.map((image) => (
                          <img
                            key={image.id}
                            src={image.url}
                            alt={image.name}
                            className="h-20 w-full rounded-md object-cover"
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            {pendingImages.length > 0 ? (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {pendingImages.map((image) => (
                  <div key={image.id} className="relative h-16 w-16 shrink-0">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="h-full w-full rounded-md object-cover"
                    />
                    <button
                      type="button"
                      className="-top-1 -right-1 absolute rounded-full bg-black/80 px-1 text-xs text-white"
                      onClick={() => removePendingImage(image.id)}
                      aria-label={`Remove ${image.name}`}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-2 flex w-full gap-2">
              <textarea
                value={input}
                placeholder="Say something..."
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setInput(e.currentTarget.value)
                }
                className="min-h-[40px] flex-1 resize-none rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                disabled={isLoading}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />
              <button
                type="button"
                className="rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                Image
              </button>
              <button
                type="submit"
                className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  (!input.trim() && pendingImages.length === 0) || isLoading
                }
              >
                {isLoading ? "..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
