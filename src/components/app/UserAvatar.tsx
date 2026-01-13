import { cn } from '@/lib/utils';
import { User } from '@/types/sidechat';
import { Sparkles } from 'lucide-react';

interface UserAvatarProps {
  user?: User;
  isAI?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  isOnline?: boolean;
}

const UserAvatar = ({ user, isAI, size = 'md', showStatus = false, isOnline }: UserAvatarProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const statusSizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  // Use passed isOnline prop, otherwise fall back to user.status
  const statusOnline = isOnline !== undefined ? isOnline : user?.status === 'online';

  if (isAI) {
    return (
      <div className={cn(
        sizeClasses[size],
        "rounded-full bg-sidechat-purple flex items-center justify-center flex-shrink-0"
      )}>
        <Sparkles className={cn(
          size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5',
          "text-primary-foreground"
        )} />
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="relative flex-shrink-0">
      <div className={cn(
        sizeClasses[size],
        "rounded-full bg-primary/20 flex items-center justify-center font-medium text-primary overflow-hidden"
      )}>
        {user?.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      {showStatus && (
        <div 
          className={cn(
            "absolute rounded-full border-2 border-card",
            statusSizeClasses[size],
            statusOnline ? 'bg-green-500' : 'bg-gray-400'
          )}
          style={{
            bottom: size === 'sm' ? '-2px' : '-1px',
            right: size === 'sm' ? '-2px' : '-1px',
          }}
        />
      )}
    </div>
  );
};

export default UserAvatar;
