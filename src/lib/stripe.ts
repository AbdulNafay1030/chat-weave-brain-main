import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
const stripePromise: Promise<Stripe | null> = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

export { stripePromise };
