import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { WaitlistTierSelector } from './WaitlistTierSelector';

interface WaitlistFormProps {
    variant?: 'hero' | 'cta';
    className?: string;
}

export const WaitlistForm = ({ variant = 'hero', className = '' }: WaitlistFormProps) => {
    const [email, setEmail] = useState('');
    const [selectedTier, setSelectedTier] = useState<'free' | 'priority'>('free');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [waitlistCount, setWaitlistCount] = useState(0);
    const [userPosition, setUserPosition] = useState<number | null>(null);

    // Load waitlist count on mount
    useEffect(() => {
        const fetchCount = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/waitlist/count');
                const data = await response.json();
                setWaitlistCount(data.free);
            } catch (error) {
                console.error('Failed to fetch waitlist count:', error);
            }
        };
        fetchCount();
    }, [status]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setStatus('error');
            setErrorMessage('Please enter a valid email address');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            if (selectedTier === 'free') {
                // Join free waitlist
                const response = await fetch('http://localhost:8000/api/waitlist/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, tier: 'free' })
                });

                const data = await response.json();

                if (data.status === 'already_exists') {
                    setStatus('error');
                    setErrorMessage('This email is already on the waitlist!');
                    return;
                }

                if (data.status === 'success') {
                    setStatus('success');
                    setUserPosition(data.position);
                    setEmail('');
                }
            } else {
                // Create Stripe checkout session for priority access
                const response = await fetch('http://localhost:8000/api/waitlist/create-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (data.status === 'already_exists') {
                    setStatus('error');
                    setErrorMessage('This email is already on the waitlist!');
                    return;
                }

                if (data.checkout_url) {
                    // Redirect to Stripe checkout
                    window.location.href = data.checkout_url;
                }
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage('Something went wrong. Please try again.');
        }
    };

    if (status === 'success') {
        return (
            <motion.div
                className={`flex flex-col items-center gap-3 ${className}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 px-6 py-3 rounded-full">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">
                        {selectedTier === 'free' ? "You're on the waitlist! 🎉" : "Priority Access Confirmed! 🎉"}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">
                    {selectedTier === 'free' && userPosition
                        ? <>You're <span className="font-semibold text-foreground">#{userPosition}</span> on the waitlist</>
                        : "Check your email for details"
                    }
                </p>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={`w-full ${className}`}>
            {/* Tier Selector */}
            <div className="mb-6">
                <WaitlistTierSelector
                    selectedTier={selectedTier}
                    onTierChange={setSelectedTier}
                    waitlistPosition={waitlistCount}
                />
            </div>

            <div className={`flex flex-col sm:flex-row gap-3 ${variant === 'hero' ? 'max-w-md mx-auto' : ''}`}>
                <div className="flex-1">
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={status === 'loading'}
                        className={`h-12 px-6 rounded-full text-base ${variant === 'cta' ? 'bg-white/10 border-white/20 text-white placeholder:text-white/60' : ''
                            }`}
                        required
                    />
                </div>
                <Button
                    type="submit"
                    size="lg"
                    disabled={status === 'loading'}
                    className={`h-12 px-8 rounded-full magnetic-hover text-base font-medium ${variant === 'cta' ? 'bg-white text-foreground hover:bg-white/90' : ''
                        }`}
                >
                    {status === 'loading' ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {selectedTier === 'priority' ? 'Processing...' : 'Joining...'}
                        </>
                    ) : (
                        <>
                            {selectedTier === 'priority' ? 'Continue to Payment' : 'Join Waitlist'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
            {status === 'error' && errorMessage && (
                <motion.p
                    className="text-sm text-red-500 mt-2 text-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {errorMessage}
                </motion.p>
            )}
            {variant === 'hero' && (
                <motion.p
                    className="text-sm text-muted-foreground mt-3 text-center"
                    key={waitlistCount} // Re-animate when count changes
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {waitlistCount === 0 ? (
                        'Be the first to join the waitlist!'
                    ) : (
                        <>
                            <span className="font-semibold text-foreground">#{waitlistCount}</span> {waitlistCount === 1 ? 'person has' : 'people have'} already joined
                        </>
                    )}
                </motion.p>
            )}
        </form>
    );
};

export default WaitlistForm;
