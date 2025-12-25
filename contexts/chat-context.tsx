import Pusher from 'pusher-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useCurrentUser } from '~/contexts/currentuser-context';
import type { Comment } from '~/lib/types';

export interface ChatContextType {
  commentsByDate: Record<string, Comment[]>;
  getCommentsByDate: () => Record<string, Comment[]>;
  pendingComments: Comment[];
  challengeId: number | null;
  cohortId: number | null;
  addComment: (comment: Comment) => void;
  deleteComment: (comment: Comment) => void;
}

const defaultValues: ChatContextType = {
  commentsByDate: {},
  getCommentsByDate: () => ({}),
  pendingComments: [],
  challengeId: null,
  cohortId: null,
  addComment: () => {},
  deleteComment: () => {},
};

const ChatContext = createContext<ChatContextType>(defaultValues);

interface ChatContextProviderProps {
  children: ReactNode;
  challengeId: number | null;
  cohortId: number | null;
  commentsByDate: Record<string, Comment[]>;
  pusherKey?: string;
  pusherCluster?: string;
  onChange?: (commentsByDate: Record<string, Comment[]>) => void;
}

function generateNumericIdFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export const ChatContextProvider = (props: ChatContextProviderProps) => {
  const { children, challengeId, cohortId, pusherKey, pusherCluster = 'us2' } = props;
  const { currentUser } = useCurrentUser();
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);
  const [commentsByDate, setCommentsByDate] = useState<Record<string, Comment[]>>(
    props.commentsByDate
  );
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);

  const mergedCommentsByDate = useMemo(() => {
    const mergedComments = JSON.parse(JSON.stringify(commentsByDate));
    const key = new Date().toLocaleDateString('en-CA');
    const addedComments: number[] = [];
    pendingComments.forEach((comment) => {
      if (!addedComments.includes(comment.id as number)) {
        if (!mergedComments[key]) {
          mergedComments[key] = [];
        }
        mergedComments[key].push(comment);
        addedComments.push(comment.id as number);
      }
    });
    return mergedComments;
  }, [commentsByDate, pendingComments]);

  useEffect(() => {
    if (pendingComments.length > 0) {
      props.onChange?.(mergedCommentsByDate);
    }
  }, [pendingComments, mergedCommentsByDate]);

  useEffect(() => {
    if (!challengeId || !cohortId) return;

    if (!pusherKey) {
      // Silently fail if Pusher is not configured
      return;
    }

    let pusherInstance: Pusher | null = null;
    let channelInstance: any = null;

    try {
      pusherInstance = new Pusher(pusherKey, {
        cluster: pusherCluster,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
      });

      pusherRef.current = pusherInstance;

      const channelName = `chat-${challengeId}-${cohortId}`;

      channelInstance = pusherInstance.subscribe(channelName);
      channelRef.current = channelInstance;

      channelInstance.bind('new-message', (comment: Comment) => {
        if (comment.userId !== currentUser?.id) {
          addIncomingMessage(comment);
        } else {
          confirmOptimisticMessage(comment);
        }
      });

      // Silently handle connection errors to avoid console spam
      pusherInstance.connection.bind('error', () => {
        // Connection errors handled silently
      });
    } catch {
      // Silently catch initialization errors
      if (pusherInstance) {
        try {
          pusherInstance.disconnect();
        } catch {
          // Ignore cleanup errors
        }
      }
    }

    return () => {
      if (channelInstance) {
        try {
          channelInstance.unbind_all();
        } catch {
          // Ignore cleanup errors
        }
      }
      if (pusherInstance) {
        try {
          const channelName = `chat-${challengeId}-${cohortId}`;
          pusherInstance.unsubscribe(channelName);
          pusherInstance.disconnect();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [challengeId, cohortId, currentUser?.id, pusherKey, pusherCluster]);

  const addIncomingMessage = (comment: Comment) => {
    const key = new Date(comment.createdAt as unknown as string).toLocaleDateString('en-CA');
    setCommentsByDate((prev) => {
      const updated = { ...prev };
      if (!updated[key]) {
        updated[key] = [];
      }
      const exists = updated[key].some((c) => c.id === comment.id);
      if (!exists) {
        updated[key] = [...updated[key], comment].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        props.onChange?.(updated);
      }
      return updated;
    });
  };

  const confirmOptimisticMessage = (comment: Comment) => {
    const hash = generateNumericIdFromString(comment.body);
    setPendingComments((prev) => prev.filter((c) => c.id !== hash));

    const key = new Date(comment.createdAt as unknown as string).toLocaleDateString('en-CA');
    setCommentsByDate((prev) => {
      const updated = { ...prev };
      if (!updated[key]) {
        updated[key] = [];
      }
      const exists = updated[key].some((c) => c.id === comment.id);
      if (!exists) {
        updated[key] = [...updated[key], comment].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        props.onChange?.(updated);
      }
      return updated;
    });
  };

  const getCommentsByDate = (): Record<string, Comment[]> => {
    return mergedCommentsByDate;
  };

  const addComment = (comment: Comment): void => {
    const hash = generateNumericIdFromString(comment.body);
    const key = new Date(comment.createdAt as unknown as string).toLocaleDateString('en-CA');
    if (!comment.id) {
      comment.id = hash;
      const newPendingComments = [...pendingComments, comment];
      setPendingComments(newPendingComments);
    } else {
      const newPendingComments = pendingComments.filter(
        (pendingComment) => pendingComment.id !== hash
      );
      setPendingComments(newPendingComments);
      const newCommentsByDate = { ...commentsByDate };
      if (!newCommentsByDate[key]) {
        newCommentsByDate[key] = [];
      }
      newCommentsByDate[key].push(comment);
      setCommentsByDate(newCommentsByDate);
    }
  };

  const deleteComment = (comment: Comment): void => {
    const key = new Date(comment.createdAt as unknown as string).toLocaleDateString('en-CA');
    const newCommentsByDate = { ...commentsByDate };
    if (newCommentsByDate[key]) {
      newCommentsByDate[key] = newCommentsByDate[key].filter((c) => c.id !== comment.id);
    }
    setCommentsByDate(newCommentsByDate);
  };

  return (
    <ChatContext.Provider
      value={{
        commentsByDate: mergedCommentsByDate,
        getCommentsByDate,
        pendingComments,
        challengeId,
        cohortId,
        addComment,
        deleteComment,
      }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatContextProvider');
  }
  return context;
};
