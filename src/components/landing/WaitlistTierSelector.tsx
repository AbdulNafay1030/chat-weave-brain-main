import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WaitlistTierSelectorProps {
    selectedTier: 'free' | 'priority';
    onTierChange: (tier: 'free' | 'priority') => void;
    waitlistPosition?: number;
}

export const WaitlistTierSelector = ({
    selectedTier,
    onTierChange,
    waitlistPosition = 0
}: WaitlistTierSelectorProps) => {
    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center mb-4">
                Choose your access:
            </p>

            {/* Free Tier */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTierChange('free')}
                className={cn(
                    'relative p-4 rounded-xl border-2 cursor-pointer transition-all',
                    selectedTier === 'free'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                )}
            >
                <div className="flex items-start gap-3">
                    <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
                        selectedTier === 'free' ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}>
                        {selectedTier === 'free' && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-foreground">Free Waitlist</div>
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                Join #{waitlistPosition + 1} in queue
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                Standard access at launch
                            </li>
                        </ul>
                    </div>
                    <div className="text-lg font-bold text-foreground">Free</div>
                </div>
            </motion.div>

            {/* Priority Tier */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTierChange('priority')}
                className={cn(
                    'relative p-4 rounded-xl border-2 cursor-pointer transition-all overflow-hidden',
                    selectedTier === 'priority'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                )}
            >
                {/* Premium badge */}
                <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold">
                        <Sparkles className="w-3 h-3" />
                        <span>Priority</span>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
                        selectedTier === 'priority' ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}>
                        {selectedTier === 'priority' && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-foreground">Priority Access</div>
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                Skip the queue
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                Guaranteed early access
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                Priority support
                            </li>
                        </ul>
                    </div>
                    <div className="text-lg font-bold text-foreground">$29</div>
                </div>
            </motion.div>
        </div>
    );
};
