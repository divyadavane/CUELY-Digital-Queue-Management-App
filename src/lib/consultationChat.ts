import { createServiceClient } from "@/lib/supabaseService";

export type ChatSenderRole = "doctor" | "patient";

export interface ChatMessage {
  id: string;
  consultation_id: string;
  sender_role: ChatSenderRole;
  sender_name: string | null;
  message: string | null;
  attachment_url: string | null; // storage path
  created_at: string;
  read_at: string | null;
  url?: string | null; // signed URL for display (enriched server-side)
}

export interface ChatConversation {
  consultation_id: string;
  doctor_name: string | null;
  doctor_department: string | null;
  patient_name: string | null;
  patient_phone: string | null;
  last_message: string | null;
  last_message_sender: ChatSenderRole | null;
  last_message_at: string | null;
  unread_count: number;
}

const CHAT_BUCKET = "consultation-chat";

/** Global broadcast channel used to ping connected clients to refresh unread counts. */
export const UNREAD_CHANNEL = "chat-unread";

let unreadChannel: ReturnType<typeof createServiceClient> extends never
  ? never
  : any = null;

function getUnreadChannel() {
  if (unreadChannel) return unreadChannel;
  try {
    const client = createServiceClient();
    unreadChannel = client.channel(UNREAD_CHANNEL, {
      config: { broadcast: { self: true } },
    });
    unreadChannel.subscribe();
  } catch (e) {
    console.error("unread channel subscribe failed", e);
  }
  return unreadChannel;
}

/**
 * Fire-and-forget ping after a chat message is persisted so every open
 * portal/dashboard client refreshes its unread badge. Clients dedupe the
 * extra fetch; this keeps badges live without per-user channels.
 */
export function broadcastChatUnread() {
  try {
    getUnreadChannel().send({
      type: "broadcast",
      event: "unread",
      payload: { ts: Date.now() },
    });
  } catch {
    /* ignore */
  }
}

function service() {
  return createServiceClient();
}

/** Sign a storage path for display. Returns null for non-attachment messages. */
export async function signAttachmentPath(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await service()
    .storage.from(CHAT_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24); // 24h
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Full history for a consultation (ownership must be validated by the caller). */
export async function listConsultationMessages(consultationId: string): Promise<ChatMessage[]> {
  const { data, error } = await service()
    .from("consultation_chat")
    .select("id, consultation_id, sender_role, sender_name, message, attachment_url, created_at, read_at")
    .eq("consultation_id", consultationId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error || !data) return [];

  const messages = data as unknown as ChatMessage[];
  const signed = await Promise.all(messages.map((m) => signAttachmentPath(m.attachment_url)));
  return messages.map((m, i) => ({ ...m, url: signed[i] }));
}

/**
 * Mark the other party's messages as read when the reader opens a thread.
 * `readerRole` is the person viewing; their own messages are never touched.
 */
export async function markConsultationChatRead(
  consultationId: string,
  readerRole: ChatSenderRole
): Promise<void> {
  await service()
    .from("consultation_chat")
    .update({ read_at: new Date().toISOString() })
    .eq("consultation_id", consultationId)
    .neq("sender_role", readerRole)
    .is("read_at", null);
}

/**
 * Aggregate per-consultation conversations (last message + unread count) for a
 * given reader role. Pass the consultation ids the reader is allowed to see.
 */
export async function getConsultationConversations(
  consultationIds: string[],
  readerRole: ChatSenderRole
): Promise<Record<string, ChatConversation>> {
  if (consultationIds.length === 0) return {};
  const { data, error } = await service()
    .from("consultation_chat")
    .select("consultation_id, sender_role, message, attachment_url, created_at, read_at")
    .in("consultation_id", consultationIds)
    .order("created_at", { ascending: true });
  if (error || !data) return {};

  const result: Record<string, ChatConversation> = {};
  for (const id of consultationIds) result[id] = {
    consultation_id: id,
    doctor_name: null,
    doctor_department: null,
    patient_name: null,
    patient_phone: null,
    last_message: null,
    last_message_sender: null,
    last_message_at: null,
    unread_count: 0,
  };

  for (const row of data as unknown as ChatMessage[]) {
    const conv = result[row.consultation_id];
    if (!conv) continue;
    const preview = row.attachment_url
      ? (row.message ? `${row.message} (attachment)` : "📎 Attachment")
      : row.message || "";
    if (preview) {
      conv.last_message = preview;
      conv.last_message_sender = row.sender_role;
      conv.last_message_at = row.created_at;
    }
    if (row.sender_role !== readerRole && !row.read_at) {
      conv.unread_count += 1;
    }
  }
  return result;
}

export interface NewChatMessage {
  message?: string;
  attachmentPath?: string | null;
}

/**
 * Persist a chat message. Returns the stored row with a signed URL when it has
 * an attachment. Sender identity/ownership is validated by the calling route.
 */
export async function insertConsultationMessage(
  consultationId: string,
  senderRole: ChatSenderRole,
  senderName: string | null,
  input: NewChatMessage
): Promise<ChatMessage | null> {
  const text = input.message?.trim() || "";
  const attachmentPath = input.attachmentPath?.trim() || null;
  if (!text && !attachmentPath) return null;

  const { data, error } = await service()
    .from("consultation_chat")
    .insert({
      consultation_id: consultationId,
      sender_role: senderRole,
      sender_name: senderName,
      message: text || null,
      attachment_url: attachmentPath,
    })
    .select("id, consultation_id, sender_role, sender_name, message, attachment_url, created_at, read_at")
    .single();
  if (error || !data) return null;

  const row = data as unknown as ChatMessage;
  row.url = await signAttachmentPath(row.attachment_url);
  return row;
}

/** Upload a chat attachment and return the storage path. Caller must validate ownership. */
export async function uploadChatAttachment(
  consultationId: string,
  file: { name: string; contentType: string; buffer: ArrayBuffer }
): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const path = `${consultationId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;

  const { error } = await service()
    .storage.from(CHAT_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.contentType || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });
  if (error) return null;
  return path;
}
