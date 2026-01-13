import { CheckCheck, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { User } from '@/types/sidechat';
import { ReadReceipt } from '@/hooks/useReadReceipts';

interface ReadReceiptsProps {
  readBy: ReadReceipt[];
  users: User[];
  isOwn: boolean;
  totalMembers: number;
  senderId?: string;
}

const ReadReceipts = ({ readBy, users, isOwn, totalMembers, senderId }: ReadReceiptsProps) => {
  // Filter out the sender from read receipts
  const readByOthers = readBy.filter((receipt) => receipt.user_id !== senderId);
  
  const readByUsers = readByOthers
    .map((receipt) => users.find((u) => u.id === receipt.user_id))
    .filter(Boolean) as User[];

  const readCount = readByUsers.length;
  const allRead = readCount >= totalMembers - 1; // -1 for sender

  if (readCount === 0) {
    // Only show "Sent" indicator for own messages
    if (!isOwn) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center ml-1">
              <Check className="w-3 h-3 text-muted-foreground" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Sent</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center ml-1">
            <CheckCheck className={`w-3 h-3 ${allRead ? 'text-primary' : 'text-muted-foreground'}`} />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {allRead ? (
              'Seen by everyone'
            ) : (
              <>Seen by {readByUsers.map((u) => u.name).join(', ')}</>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ReadReceipts;
