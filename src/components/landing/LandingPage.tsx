import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare, Users, Sparkles, Brain, Lock, Zap, Workflow, Layers, ShieldCheck, Building2 } from 'lucide-react';
import HeroMockUI from './HeroMockUI';
import { WaitlistForm } from './WaitlistForm';
import { OrganizeLogo } from '@/components/OrganizeLogo';

const LandingPage = () => {
  const navigate = useNavigate();

  const stats = [
    { value: '57%', label: 'faster team decisions with clear context' },
    { value: '2x', label: 'more focused discussions per project' },
    { value: '40%', label: 'less context switching across tools' },
  ];

  const usage = [
    { title: 'Individual focus', description: 'Draft ideas privately, then move them into the group with clarity.' },
    { title: 'Team alignment', description: 'Keep threads organized so everyone sees the same source of truth.' },
    { title: 'Org scale', description: 'Standardize collaboration with lightweight AI where it helps.' },
  ];

  const platform = [
    { icon: Workflow, title: 'Private brainstorm threads', description: 'Create side discussions without interrupting the main room.' },
    { icon: Layers, title: 'Group chat that stays structured', description: 'Pin, summarize, and keep work moving without chaos.' },
    { icon: ShieldCheck, title: 'AI on demand', description: 'Summaries and answers only when you choose to ask.' },
  ];

  const industries = [
    'Product & engineering',
    'Marketing & growth',
    'Customer support',
    'Sales & partnerships',
    'Operations',
    'Founder teams',
  ];

  const testimonials = [
    {
      quote: 'Organize AI keeps our project rooms clean while still letting us ideate fast.',
      name: 'Ayesha Khan',
      title: 'Product Lead',
    },
    {
      quote: 'Private threads saved us from endless side DMs and lost context.',
      name: 'Naveed Ali',
      title: 'Engineering Manager',
    },
    {
      quote: 'We finally have AI support without the noise in every message.',
      name: 'Sara Malik',
      title: 'Operations',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <OrganizeLogo size="sm" />

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => navigate('/auth')}
              aria-label="Sign in to Organize AI"
              className="rounded-full px-5"
            >
              Sign In
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={() => navigate('/auth')}
              aria-label="Sign up for Organize AI"
              className="rounded-full px-5"
            >
              Request a demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-animated-gradient animate-gradient opacity-30" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-soft" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            {/* Launching Soon Badge */}
            <motion.div
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-4 h-4" />
              Launching Soon
            </motion.div>

            <motion.h1
              className="font-display text-5xl md:text-7xl font-semibold mb-6 leading-[1.1] tracking-tight max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-foreground">Your First</span>
              <br />
              <span className="text-gradient animate-shimmer inline-block">
                Personal and Group AI
              </span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              Brainstorm privately before sharing with your team. Keep group chats organized. Get AI summaries on demand.
            </motion.p>
            <motion.div
              className="mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <WaitlistForm variant="hero" />
            </motion.div>
          </div>

          <motion.div
            className="relative mt-16 flex items-center justify-center"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute w-[520px] h-[520px] rounded-full bg-gradient-to-b from-primary/20 to-transparent blur-3xl animate-pulse-soft" />
            <div className="relative w-full max-w-4xl animate-float">
              <HeroMockUI />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const ref = useRef(null);
              const isInView = useInView(ref, { once: true, margin: "-100px" });

              return (
                <motion.div
                  key={stat.label}
                  ref={ref}
                  className="bg-card rounded-2xl p-6 border border-border card-hover-lift"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="text-4xl font-display font-medium text-foreground tracking-tight">{stat.value}</div>
                  <p className="text-sm text-muted-foreground mt-3">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Usage Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-medium text-foreground mb-4 tracking-tight">
              Built for real collaboration
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Move from thinking to action without losing the thread.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {usage.map((item, index) => {
              const ref = useRef(null);
              const isInView = useInView(ref, { once: true, margin: "-100px" });

              return (
                <motion.div
                  key={item.title}
                  ref={ref}
                  className="bg-card rounded-2xl p-8 border border-border card-hover-lift"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <h3 className="font-display text-xl font-medium text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="py-16 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-start gap-12">
            <motion.div
              className="lg:w-1/2"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-3xl md:text-4xl font-medium text-foreground mb-4 tracking-tight">
                Your team's collaboration, structured and calm
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Organize AI keeps discussions organized while making AI available only when it adds value.
              </p>
              <Button variant="hero" onClick={() => navigate('/auth')} className="magnetic-hover">
                Start free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
            <div className="lg:w-1/2 grid gap-6">
              {platform.map((item, index) => {
                const ref = useRef(null);
                const isInView = useInView(ref, { once: true, margin: "-100px" });

                return (
                  <motion.div
                    key={item.title}
                    ref={ref}
                    className="bg-card rounded-2xl p-6 border border-border card-hover-lift"
                    initial={{ opacity: 0, x: 30 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    >
                      <item.icon className="w-5 h-5 text-primary" />
                    </motion.div>
                    <h3 className="font-display text-lg font-medium text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 text-primary text-sm font-medium mb-4">
            <Building2 className="w-4 h-4" />
            <span>Teams who use Organize AI</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-foreground mb-6 tracking-tight">
            Reimagine how your teams work together
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {industries.map((item) => (
              <div key={item} className="border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-medium text-foreground mb-4 tracking-tight">
              Teams ship faster with Organize AI
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real stories from teams that needed clarity and speed.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((item, index) => {
              const ref = useRef(null);
              const isInView = useInView(ref, { once: true, margin: "-100px" });

              return (
                <motion.div
                  key={item.name}
                  ref={ref}
                  className="bg-card border border-border rounded-2xl p-6 card-hover-lift"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <p className="text-sm text-muted-foreground mb-6">"{item.quote}"</p>
                  <div className="text-sm font-medium text-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.title}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="bg-animated-gradient animate-gradient rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-medium text-primary-foreground mb-4 tracking-tight">
              Get Early Access
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8 max-w-xl mx-auto">
              Join the waitlist and be among the first to experience organized team collaboration.
            </p>

            <WaitlistForm variant="cta" />

            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse-soft" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse-soft" />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <OrganizeLogo size="sm" />
              <p className="text-sm text-muted-foreground max-w-xs">
                Your first personal and group AI. Brainstorm privately before sharing with your team.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Connect With Us</h3>
              <div className="flex gap-3">
                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-muted hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>

                {/* Product Hunt */}
                <a
                  href="https://producthunt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-muted hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-110"
                  aria-label="Product Hunt"
                >
                  <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.604 9.4h-3.405v3.2h3.405a1.6 1.6 0 1 0 0-3.2M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0m1.604 14.4h-3.405V18H7.801V6h5.803a4.4 4.4 0 1 1 0 8.4" />
                  </svg>
                </a>

                {/* Discord */}
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-muted hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-110"
                  aria-label="Discord"
                >
                  <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Organize AI. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
