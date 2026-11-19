export type RealtimeEvent = "comment:created" | "comment:updated" | "comment:deleted";

export function emitToVersion(versionId: string, event: RealtimeEvent, payload: unknown): void {
  // Implemented in #45 using Socket.IO and the Redis adapter.
  void versionId;
  void event;
  void payload;
}

export function emitToUser(userId: string, event: "mention", payload: unknown): void {
  // Implemented in #45 using private Socket.IO delivery.
  void userId;
  void event;
  void payload;
}
