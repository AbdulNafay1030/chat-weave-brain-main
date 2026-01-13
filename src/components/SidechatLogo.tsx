import { cn } from '@/lib/utils';

interface SidechatLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizeMap = {
  xs: { container: 'w-6 h-6', icon: 'w-3.5 h-3.5', text: 'text-sm' },
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-lg' },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-xl' },
  lg: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-2xl' },
  xl: { container: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-4xl' },
};

const SidechatLogo = ({ 
  size = 'sm', 
  showText = true, 
  className,
  textClassName 
}: SidechatLogoProps) => {
  const { container, icon, text } = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo Icon - Two overlapping speech bubbles representing side conversations */}
      <div className={cn(
        container,
        'rounded-xl bg-accent-gradient flex items-center justify-center relative'
      )}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={icon}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Back bubble (thread/side conversation) */}
          <path
            d="M18 4H10C8.9 4 8 4.9 8 6V12C8 13.1 8.9 14 10 14H14L17 17V14H18C19.1 14 20 13.1 20 12V6C20 4.9 19.1 4 18 4Z"
            fill="currentColor"
            className="text-primary-foreground/60"
          />
          {/* Front bubble (main conversation) */}
          <path
            d="M14 8H6C4.9 8 4 8.9 4 10V16C4 17.1 4.9 18 6 18H7V21L10 18H14C15.1 18 16 17.1 16 16V10C16 8.9 15.1 8 14 8Z"
            fill="currentColor"
            className="text-primary-foreground"
          />
          {/* AI sparkle dot */}
          <circle
            cx="17"
            cy="7"
            r="1.5"
            fill="currentColor"
            className="text-accent"
          />
        </svg>
      </div>
      {showText && (
        <span className={cn(
          'font-display font-bold text-foreground',
          text,
          textClassName
        )}>
          Sidechat
        </span>
      )}
    </div>
  );
};

export default SidechatLogo;
