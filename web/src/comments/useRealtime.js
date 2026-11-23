import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { listComments } from "../api/comments.js";
import { connectVersion } from "../realtime.js";
import { applyEvent } from "./thread.js";

const noop = () => {};

const defaultConnect = (options) => connectVersion({ io, ...options });

export default function useRealtime({
  token,
  documentId,
  versionId,
  connect = defaultConnect,
  onVersionCreated = noop,
}) {
  const [comments, setComments] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [liveState, setLiveState] = useState("connecting");
  const [mentioned, setMentioned] = useState(false);

  // Pins are anchored comments, so they always stay in sync with the comment list.
  const pins = useMemo(() => comments.filter((comment) => comment.anchor), [comments]);

  // Only the newest list answer is used, and events arriving during a load are replayed
  // on top of it, so a slow response cannot overwrite a newer live change.
  const newest = useRef(0);
  const loading = useRef(false);
  const pending = useRef([]);

  const apply = useCallback((event, payload) => {
    if (loading.current) pending.current.push([event, payload]);
    setComments((list) => applyEvent(list, event, payload));
  }, []);

  const reload = useCallback(async () => {
    const mine = ++newest.current;
    loading.current = true;
    pending.current = [];

    try {
      const snapshot = await listComments(token, documentId, versionId);
      if (mine !== newest.current) return;

      const replayed = pending.current.reduce(
        (list, [event, payload]) => applyEvent(list, event, payload),
        snapshot,
      );

      setComments(replayed);
      setLoadState("ready");
    } catch {
      if (mine === newest.current) setLoadState("error");
    } finally {
      if (mine === newest.current) loading.current = false;
    }
  }, [token, documentId, versionId]);

  useEffect(() => {
    setMentioned(false);
    reload();

    const live = connect({
      token,
      versionId,
      onEvent: apply,
      onMention: () => setMentioned(true),
      onVersionCreated,
      onJoined: reload,
      onState: setLiveState,
    });

    return () => live.close();
  }, [token, versionId, connect, onVersionCreated, reload, apply]);

  return {
    comments,
    pins,
    setComments,
    loadState,
    liveState,
    mentioned,
    setMentioned,
    apply,
    reload,
  };
}
