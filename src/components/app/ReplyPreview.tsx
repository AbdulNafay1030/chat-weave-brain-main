import { X, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/sidechat';

interface ReplyPreviewProps {
  replyTo: {
    id: string;
    content: string;
    userId: string;
  };
  users: User[];
  onCancel: () => void;
}

const ReplyPreview = ({ replyTo, users, onCancel }: ReplyPreviewProps) => {
  const user = users.find((u) => u.id === replyTo.userId);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-l-2 border-primary">
      <Reply className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary">
          Replying to {user?.name || 'Unknown'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {replyTo.content}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onCancel}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default ReplyPreview;
