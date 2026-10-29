import { useEffect, useRef, useState } from "react";
import { useChatMessages, useChatSessions, useCreateChatSession, useStreamChat } from "../../hooks/use-chat";
import { useIndexStatus, useRepository } from "../../hooks/use-repo";
import { AppShell } from "../layouts/app-shell";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ChatSidebar } from "./ChatSidebar";
import { IndexingState } from "./IndexingState";
import { ChatComposer } from "./ChatComposer";
import { ChatMessages } from "./ChatMessages";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query-keys";

export function ChatView({ repoId }: { repoId: string }) {
  const queryClient = useQueryClient();
  const repoQuery = useRepository(repoId);
  const repoStatus = repoQuery.data?.indexStatus;
  const repoIsTerminal = repoStatus === "READY" || repoStatus === "FAILED";

  // keep polling until a terminal state is known
  const statusQuery = useIndexStatus(repoId, Boolean(repoQuery.data) && !repoIsTerminal);

  const polledStatus = statusQuery.data?.indexStatus;
  const indexStatus = repoIsTerminal ? repoStatus : polledStatus ?? repoStatus;
  const ready = indexStatus === "READY";

  useEffect(() => {
    if (polledStatus === "READY") {
      queryClient.invalidateQueries({ queryKey: queryKeys.repos.detail(repoId) });
    }
  }, [polledStatus, queryClient, repoId]);

  const sessionsQuery = useChatSessions(repoId, ready);
  const createSession = useCreateChatSession(repoId);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const autoCreateRef = useRef(false);

  const sessionId =
    selectedSessionId ?? sessionsQuery.data?.[0]?.id ?? null;

  const messagesQuery = useChatMessages(sessionId);
  const { send, stop, streaming, streamText } = useStreamChat(sessionId);

  const { mutate: createSessionMutate } = createSession;

useEffect(() => {
  if (!ready || !sessionsQuery.isSuccess) return;
  if ((sessionsQuery.data?.length ?? 0) > 0) return;
  if (autoCreateRef.current) return;

  autoCreateRef.current = true;
  createSessionMutate(undefined, {
    onSuccess: (session) => setSelectedSessionId(session.id),
    // no reset on error; show a "Retry" button instead
  });
}, [ready, sessionsQuery.isSuccess, sessionsQuery.data, createSessionMutate]);

  if (repoQuery.isLoading) {
    return (
      <AppShell title="Loading chat…">
        <div className="grid flex-1 gap-4 p-4 md:grid-cols-[18rem_1fr]">
          <Skeleton className="min-h-80 rounded-2xl" />
          <Skeleton className="min-h-80 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (repoQuery.isError || !repoQuery.data) {
    return (
      <AppShell title="Repository unavailable">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
          <p className="text-sm text-muted-foreground">
            {(repoQuery.error as Error)?.message ?? "Repository not found"}
          </p>
          <Button render={<Link to="/dashboard" />}>Back to dashboard</Button>
        </div>
      </AppShell>
    );
  }

  const repo = repoQuery.data;

  return (
    <AppShell
      title={repo.fullName}
      description={
        ready
          ? undefined
          : "Waiting for indexing to finish"
      }
      actions={
        <Button variant="outline" size="sm" render={<Link to="/dashboard" />}>
          <ArrowLeft data-icon="inline-start" />
          Repos
        </Button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ChatSidebar
          repo={{
            ...repo,
            indexStatus: indexStatus ?? repo.indexStatus,
            filesProcessed:
              statusQuery.data?.filesProcessed ?? repo.filesProcessed,
            filesTotal: statusQuery.data?.filesTotal ?? repo.filesTotal,
            chunkCount: statusQuery.data?.chunkCount ?? repo.chunkCount,
            errorMessage: statusQuery.data?.errorMessage ?? repo.errorMessage,
          }}
          sessionId={sessionId}
          onSelectSession={setSelectedSessionId}
        />

        <section className="flex min-h-[70vh] min-w-0 flex-1 flex-col">
          {!ready ? (
            <IndexingState repo={repo} status={statusQuery.data} />
          ) : (
            <>
              <ChatMessages
                repo={repo}
                messages={messagesQuery.data ?? []}
                streamText={streamText}
                isLoading={messagesQuery.isLoading}
              />
              <ChatComposer
                disabled={!ready || !sessionId || createSession.isPending}
                streaming={streaming}
                onSend={send}
                onStop={stop}
              />
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}