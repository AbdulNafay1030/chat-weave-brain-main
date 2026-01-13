import { motion } from 'framer-motion';
import { MessageSquarePlus, X, UserPlus, UserMinus } from 'lucide-react';

export type NotificationType = 'thread_created' | 'member_joined' | 'member_left';

interface GroupNotificationProps {
  type: NotificationType;
  userName: string;
  threadName?: string;
  onDismiss: () => void;
  onClick?: () => void;
}

const GroupNotification = ({
  type,
  userName,
  threadName,
  onDismiss,
  onClick,
}: GroupNotificationProps) => {
  const getIcon = () => {
    switch (type) {
      case 'thread_created':
        return <MessageSquarePlus className="w-4 h-4 text-primary" />;
      case 'member_joined':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'member_left':
        return <UserMinus className="w-4 h-4 text-orange-500" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'thread_created':
        return 'bg-primary/20';
      case 'member_joined':
        return 'bg-green-500/20';
      case 'member_left':
        return 'bg-orange-500/20';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'thread_created':
        return 'border-primary/20 bg-primary/10';
      case 'member_joined':
        return 'border-green-500/20 bg-green-500/10';
      case 'member_left':
        return 'border-orange-500/20 bg-orange-500/10';
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'thread_created':
        return (
          <>
            <span className="font-medium text-foreground">{userName}</span>
            <span className="text-muted-foreground"> created a new thread: </span>
            <span className="font-medium text-primary">"{threadName}"</span>
          </>
        );
      case 'member_joined':
        return (
          <>
            <span className="font-medium text-foreground">{userName}</span>
            <span className="text-muted-foreground"> joined the group</span>
          </>
        );
      case 'member_left':
        return (
          <>
            <span className="font-medium text-foreground">{userName}</span>
            <span className="text-muted-foreground"> left the group</span>
          </>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="mx-4 mb-2"
    >
      <div
        className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${getBorderColor()} ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getIconBg()} flex items-center justify-center`}>
            {getIcon()}
          </div>
          <div className="text-sm">{getMessage()}</div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="flex-shrink-0 p-1 rounded-full hover:bg-foreground/10 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
};

export default GroupNotification;
