import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PendingInvitation } from '@/hooks/usePendingInvitations';
import { formatDistanceToNow } from 'date-fns';

interface PendingInvitationsCardProps {
  invitations: PendingInvitation[];
  onAccept: (token: string) => void;
  onDismiss?: (id: string) => void;
  loading?: boolean;
}

const PendingInvitationsCard = ({ 
  invitations, 
  onAccept, 
  onDismiss,
  loading 
}: PendingInvitationsCardProps) => {
  if (invitations.length === 0) return null;

  return (
    <div className="p-2 space-y-2">
      <div className="flex items-center gap-2 px-2 py-1">
        <Mail className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Pending Invitations
        </span>
        <span className="ml-auto bg-primary/20 text-primary text-xs font-medium px-1.5 py-0.5 rounded-full">
          {invitations.length}
        </span>
      </div>
      
      <AnimatePresence mode="popLayout">
        {invitations.map((invitation) => (
          <motion.div
            key={invitation.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-primary/5 border border-primary/20 rounded-lg p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {invitation.group_name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Invited by {invitation.invited_by_name}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="default"
                className="flex-1 h-7 text-xs"
                onClick={() => onAccept(invitation.token)}
                disabled={loading}
              >
                <Check className="w-3 h-3 mr-1" />
                Accept
              </Button>
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2"
                  onClick={() => onDismiss(invitation.id)}
                  disabled={loading}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default PendingInvitationsCard;
