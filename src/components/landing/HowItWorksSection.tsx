import { motion } from 'framer-motion';
import { Users, Lock, MessageSquare, Sparkles } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Users,
    title: 'Start with your team',
    description: 'Begin in a normal group chat with your teammates.',
    visual: 'group',
    gradient: 'from-violet-500/20 to-purple-600/20',
    borderGlow: 'group-hover:shadow-violet-500/20',
  },
  {
    number: '02',
    icon: Lock,
    title: 'Branch into privacy',
    description: 'Create a private side conversation with selected members.',
    visual: 'branch',
    gradient: 'from-purple-500/20 to-fuchsia-600/20',
    borderGlow: 'group-hover:shadow-purple-500/20',
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'Think freely',
    description: 'Brainstorm openly without AI watching or interrupting.',
    visual: 'brainstorm',
    gradient: 'from-fuchsia-500/20 to-pink-600/20',
    borderGlow: 'group-hover:shadow-fuchsia-500/20',
  },
  {
    number: '04',
    icon: Sparkles,
    title: 'Summarize & share',
    description: 'Send your discussion to AI and share insights with the group.',
    visual: 'ai',
    gradient: 'from-cyan-500/20 to-teal-600/20',
    borderGlow: 'group-hover:shadow-cyan-500/20',
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            How it works
          </motion.span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Think better, <span className="text-gradient">together</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            A calm, intentional flow that helps teams refine ideas before bringing in AI.
          </p>
        </motion.div>

        {/* Visual Flow */}
        <div className="relative">
          {/* Animated Connection Line */}
          <div className="hidden lg:block absolute top-[200px] left-[12%] right-[12%] h-[2px] overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-violet-500 via-purple-500 via-fuchsia-500 to-cyan-500"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.3 }}
              style={{ transformOrigin: 'left' }}
            />
            {/* Animated glow dot */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary blur-sm"
              initial={{ left: '0%' }}
              animate={{ left: '100%' }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: 1.5 }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="relative group"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                {/* Card */}
                <div className={`relative bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-6 h-full transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-2xl ${step.borderGlow}`}>
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Step Number Badge */}
                  <motion.div 
                    className="absolute -top-4 left-6 z-10"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
                      Step {step.number}
                    </span>
                  </motion.div>

                  {/* Visual Illustration */}
                  <div className="relative mt-6 mb-8 h-36 flex items-center justify-center">
                    <StepVisual step={step.visual} index={index} />
                  </div>

                  {/* Icon with glow */}
                  <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                    <step.icon className="w-6 h-6 text-primary" />
                    <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content */}
                  <h3 className="relative z-10 font-display text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="relative z-10 text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connection node (desktop) */}
                {index < steps.length - 1 && (
                  <motion.div 
                    className="hidden lg:flex absolute -right-3 top-[200px] -translate-y-1/2 z-20"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.2, type: 'spring' }}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom tagline with animation */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-secondary/50 border border-border text-muted-foreground text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            AI joins the conversation only when you're ready
            <Sparkles className="w-4 h-4 text-accent" />
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// Visual illustrations for each step
const StepVisual = ({ step, index }: { step: string; index: number }) => {
  switch (step) {
    case 'group':
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Main chat container */}
          <motion.div
            className="w-36 h-24 rounded-2xl bg-gradient-to-br from-secondary to-muted border border-border/50 shadow-xl overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Header bar */}
            <div className="h-6 bg-secondary/80 border-b border-border/30 flex items-center px-2 gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400/60" />
              <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
              <div className="w-2 h-2 rounded-full bg-green-400/60" />
            </div>
            {/* Avatar group */}
            <div className="flex items-center justify-center pt-3 pb-2">
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 border-2 border-card flex items-center justify-center shadow-md"
                    initial={{ opacity: 0, scale: 0, y: 10 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                  >
                    <div className="w-3 h-3 rounded-full bg-primary/80" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
          {/* Floating message indicators */}
          <motion.div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5"
            initial={{ opacity: 0, y: 5 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div 
                key={i} 
                className="w-2 h-2 rounded-full bg-primary/60"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </div>
      );

    case 'branch':
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Main chat (faded) */}
          <motion.div 
            className="w-24 h-16 rounded-xl bg-muted/40 border border-border/30 absolute left-4 top-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.5 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          />
          {/* Animated branch line */}
          <motion.svg
            className="absolute left-14 top-8 w-20 h-20"
            viewBox="0 0 80 80"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.path
              d="M0 0 Q20 0 30 20 T60 60"
              fill="none"
              stroke="url(#branchGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4 }}
            />
            <defs>
              <linearGradient id="branchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--primary))" />
              </linearGradient>
            </defs>
          </motion.svg>
          {/* Private thread card */}
          <motion.div
            className="w-24 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 border-2 border-primary/50 absolute right-4 bottom-2 flex items-center justify-center shadow-lg shadow-primary/20"
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, type: 'spring' }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lock className="w-5 h-5 text-primary" />
            </motion.div>
          </motion.div>
          {/* Lock icon on main */}
          <motion.div
            className="absolute left-8 top-6 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Lock className="w-3 h-3 text-primary/60" />
          </motion.div>
        </div>
      );

    case 'brainstorm':
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Floating chat bubbles */}
          <div className="relative w-36 h-28">
            {[
              { x: 0, y: 12, delay: 0.2, width: 'w-20', height: 'h-10' },
              { x: 48, y: 0, delay: 0.4, width: 'w-16', height: 'h-8' },
              { x: 16, y: 50, delay: 0.6, width: 'w-18', height: 'h-9' },
            ].map((bubble, i) => (
              <motion.div
                key={i}
                className={`absolute ${bubble.width} ${bubble.height} rounded-xl bg-gradient-to-br from-primary/15 to-fuchsia-500/15 border border-primary/30 backdrop-blur-sm`}
                style={{ left: bubble.x, top: bubble.y }}
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: bubble.delay, type: 'spring' }}
              >
                <div className="h-full w-full flex items-center justify-center gap-1.5 px-3">
                  {[0, 1, 2].map((j) => (
                    <motion.div 
                      key={j} 
                      className="w-1.5 h-1.5 rounded-full bg-primary/50"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: j * 0.2 + i * 0.3 }}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
            {/* No AI indicator */}
            <motion.div
              className="absolute -right-2 bottom-0 px-3 py-1.5 rounded-full bg-secondary text-xs font-semibold text-muted-foreground border border-border flex items-center gap-1.5 shadow-md"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9, type: 'spring' }}
            >
              <MessageSquare className="w-3 h-3" />
              No AI
            </motion.div>
          </div>
        </div>
      );

    case 'ai':
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* AI Summary card */}
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <div className="w-32 h-24 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/15 to-cyan-500/20 border border-primary/40 p-4 shadow-xl shadow-primary/10">
              {/* Summary lines with animation */}
              <div className="space-y-2">
                {[1, 0.75, 0.5].map((width, i) => (
                  <motion.div
                    key={i}
                    className="h-2 rounded-full bg-gradient-to-r from-primary/40 to-accent/40"
                    style={{ width: `${width * 100}%` }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.15, duration: 0.4 }}
                  />
                ))}
              </div>
            </div>
            {/* AI sparkle badge */}
            <motion.div
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/40"
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </motion.div>
            </motion.div>
            {/* Share indicator */}
            <motion.div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1"
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
            >
              <motion.div
                className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center"
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="w-3 h-3 text-accent" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      );

    default:
      return null;
  }
};

export default HowItWorksSection;
