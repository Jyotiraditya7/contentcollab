// Document view (D28): the document's versions (list, upload, download) and one version's comments, live.
import CommentsPanel from "../comments/CommentsPanel.jsx";
import VersionsPanel from "../versions/VersionsPanel.jsx";
import { useCallback, useState } from "react";

export default function DocumentPage({ token, user, documentId, versionId, connect }) {
  const [versionsRefreshKey, setVersionsRefreshKey] = useState(0);

  const handleVersionCreated = useCallback(() => {
    setVersionsRefreshKey((key) => key + 1);
  }, []);
  return (
    <>
      <section className="card wide">
        <p>
          <a href="#/">Back to documents</a>
        </p>
        <h2>Document</h2>
        <VersionsPanel token={token} documentId={documentId} versionId={versionId} refreshKey={versionsRefreshKey} />
      </section>
      <CommentsPanel
        token={token}
        user={user}
        documentId={documentId}
        versionId={versionId}
        connect={connect}
        onVersionCreated={handleVersionCreated}
      />
    </>
  );
}
