import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Users, Sparkles, Send, Lock } from 'lucide-react';

// Typewriter component for AI response
const TypewriterText = ({ text, isActive, speed = 30 }: { text: string; isActive: boolean; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    if (!isActive) {
      setDisplayedText('');
      return;
    }
    
    let index = 0;
    setDisplayedText('');
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, isActive, speed]);
  
  // Parse text into lines for proper formatting
  const lines = useMemo(() => {
    return displayedText.split('\n');
  }, [displayedText]);
  
  return (
    <div className="text-sm text-foreground space-y-1">
      {lines.map((line, i) => (
        <p 
          key={i}
          className={line.startsWith('•') ? 'pl-2 text-muted-foreground' : ''}
        >
          {line}
          {i === lines.length - 1 && displayedText.length < text.length && (
            <motion.span
              className="inline-block w-1.5 h-4 bg-primary ml-0.5 align-middle"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </p>
      ))}
    </div>
  );
};

// Team members with distinct colors and avatar images
const teamMembers = [
  { name: 'Sarah', color: 'hsl(var(--primary))', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face' },
  { name: 'Alex', color: 'hsl(var(--sidechat-purple))', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
  { name: 'Jordan', color: 'hsl(var(--accent))', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face' },
  { name: 'Emma', color: 'hsl(340 70% 55%)', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face' },
];

// Animation phases with longer durations
const PHASE_DURATIONS = {
  groupChat: 5000,      // Show active group chat
  transition: 1500,     // Transition to private
  privateChat: 4500,    // Private discussion
  sendToAI: 1500,       // Send to AI button
  aiResponse: 4000,     // AI responds
  reset: 1000,          // Brief pause before loop
};

const HeroMockUI = () => {
  const [phase, setPhase] = useState<'groupChat' | 'transition' | 'privateChat' | 'sendToAI' | 'aiResponse' | 'reset'>('groupChat');
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [privateMessages, setPrivateMessages] = useState(0);

  // Group chat messages (4 members actively chatting)
  const groupMessages = [
    { user: 'Sarah', content: "Hey team! Ready to brainstorm on the new feature?" },
    { user: 'Jordan', content: "Absolutely! I have some ideas about the user onboarding flow." },
    { user: 'Emma', content: "Let's make sure we consider the mobile experience too." },
    { user: 'Alex', content: "Sarah, let's start a private thread to hash out the details first." },
  ];

  // Private thread between Sarah & Alex
  const threadMessages = [
    { user: 'Sarah', content: "What if we focus on the onboarding flow?" },
    { user: 'Alex', content: "Good call. Users drop off at step 3." },
    { user: 'Sarah', content: "Let's ask AI for suggestions..." },
  ];

  const aiResponse = "I've reviewed your private discussion and synthesized the key takeaways:\n• Focus on simplifying step 3\n• Add progressive disclosure\n• Consider skip option with smart defaults";

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const runAnimation = () => {
      // Phase 1: Group Chat - show messages one by one
      if (phase === 'groupChat') {
        if (visibleMessages < groupMessages.length) {
          timeout = setTimeout(() => {
            setVisibleMessages(prev => prev + 1);
          }, 900);
        } else {
          timeout = setTimeout(() => {
            setPhase('transition');
          }, 1200);
        }
      }
      
      // Phase 2: Transition to private thread
      else if (phase === 'transition') {
        timeout = setTimeout(() => {
          setPhase('privateChat');
        }, PHASE_DURATIONS.transition);
      }
      
      // Phase 3: Private chat messages
      else if (phase === 'privateChat') {
        if (privateMessages < threadMessages.length) {
          timeout = setTimeout(() => {
            setPrivateMessages(prev => prev + 1);
          }, 1000);
        } else {
          timeout = setTimeout(() => {
            setPhase('sendToAI');
          }, 800);
        }
      }
      
      // Phase 4: Send to AI
      else if (phase === 'sendToAI') {
        timeout = setTimeout(() => {
          setPhase('aiResponse');
        }, PHASE_DURATIONS.sendToAI);
      }
      
      // Phase 5: AI Response
      else if (phase === 'aiResponse') {
        timeout = setTimeout(() => {
          setPhase('reset');
        }, PHASE_DURATIONS.aiResponse);
      }
      
      // Reset and loop
      else if (phase === 'reset') {
        timeout = setTimeout(() => {
          setVisibleMessages(0);
          setPrivateMessages(0);
          setPhase('groupChat');
        }, PHASE_DURATIONS.reset);
      }
    };

    runAnimation();
    return () => clearTimeout(timeout);
  }, [phase, visibleMessages, privateMessages, groupMessages.length, threadMessages.length]);

  const showPrivatePanel = phase !== 'groupChat' && phase !== 'reset';
  const highlightPrivateMembers = ['transition', 'privateChat', 'sendToAI'].includes(phase);
  const focusOnAIResponse = phase === 'aiResponse';

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Phase indicator */}
      <div className="flex justify-center gap-3 mb-4">
        {[
          { key: 'group', label: 'Group Chat', active: phase === 'groupChat' },
          { key: 'private', label: 'Private Thread', active: ['transition', 'privateChat', 'sendToAI'].includes(phase) },
          { key: 'ai', label: 'AI Assist', active: phase === 'aiResponse' },
        ].map((step) => (
          <div key={step.key} className="flex items-center gap-2">
            <motion.div
              className={`w-2 h-2 rounded-full ${step.active ? 'bg-primary' : 'bg-muted'}`}
              animate={{ scale: step.active ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 1, repeat: step.active ? Infinity : 0 }}
            />
            <span className={`text-xs font-medium transition-colors duration-300 ${step.active ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <motion.div
        className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Mock Window Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <div className="w-3 h-3 rounded-full bg-green-400/60" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-muted-foreground font-medium">Sidechat — Product Team</span>
          </div>
          {/* Team member avatars */}
          <div className="flex -space-x-2">
            {teamMembers.map((member, i) => (
              <motion.div
                key={member.name}
                className="w-6 h-6 rounded-full overflow-hidden border-2 border-card"
                style={{ zIndex: 4 - i }}
                animate={{
                  opacity: highlightPrivateMembers && !['Sarah', 'Alex'].includes(member.name) ? 0.4 : 1,
                  scale: highlightPrivateMembers && ['Sarah', 'Alex'].includes(member.name) ? 1.1 : 1,
                }}
                transition={{ duration: 0.4 }}
              >
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex h-[480px]">
          {/* Sidebar */}
          <div className="w-14 bg-sidechat-navy flex flex-col items-center py-4 gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-gradient flex items-center justify-center">
              {/* Mini Sidechat logo icon */}
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 4H10C8.9 4 8 4.9 8 6V12C8 13.1 8.9 14 10 14H14L17 17V14H18C19.1 14 20 13.1 20 12V6C20 4.9 19.1 4 18 4Z" fill="currentColor" className="text-primary-foreground/60" />
                <path d="M14 8H6C4.9 8 4 8.9 4 10V16C4 17.1 4.9 18 6 18H7V21L10 18H14C15.1 18 16 17.1 16 16V10C16 8.9 15.1 8 14 8Z" fill="currentColor" className="text-primary-foreground" />
              </svg>
            </div>
            <motion.div 
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              animate={{ 
                backgroundColor: showPrivatePanel ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted) / 0.1)'
              }}
              transition={{ duration: 0.3 }}
            >
              <Lock className={`w-4 h-4 ${showPrivatePanel ? 'text-primary' : 'text-muted-foreground'}`} />
            </motion.div>
            <div className="w-9 h-9 rounded-xl bg-muted/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Main Chat */}
          <motion.div 
            className="flex-1 flex flex-col bg-background relative"
            animate={{ 
              opacity: showPrivatePanel && !focusOnAIResponse ? 0.6 : 1,
              filter: showPrivatePanel && !focusOnAIResponse ? 'blur(1px)' : 'blur(0px)'
            }}
            transition={{ duration: 0.4 }}
          >
            {/* Group chat header */}
            <div className="px-4 py-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground"># general</span>
                <span className="text-xs text-muted-foreground">4 members</span>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-hidden">
              {groupMessages.slice(0, visibleMessages).map((msg, i) => {
                const member = teamMembers.find(m => m.name === msg.user);
                const isPrivateMember = ['Sarah', 'Alex'].includes(msg.user);
                
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: highlightPrivateMembers && !isPrivateMember ? 0.4 : 1,
                      y: 0 
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-2"
                  >
                    <motion.div 
                      className="w-8 h-8 rounded-full overflow-hidden shrink-0"
                      animate={{
                        scale: highlightPrivateMembers && isPrivateMember ? [1, 1.1, 1] : 1,
                        boxShadow: highlightPrivateMembers && isPrivateMember 
                          ? '0 0 12px hsl(var(--primary) / 0.5)' 
                          : '0 0 0px transparent'
                      }}
                      transition={{ duration: 0.6, repeat: highlightPrivateMembers && isPrivateMember ? Infinity : 0 }}
                    >
                      <img 
                        src={member?.avatar} 
                        alt={msg.user}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{msg.user}</p>
                      <p className="text-sm text-muted-foreground">{msg.content}</p>
                    </div>
                  </motion.div>
                );
              })}

              {/* AI Response in main chat */}
              <AnimatePresence>
                {phase === 'aiResponse' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="flex gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 bg-primary/10 rounded-lg p-3 border border-primary/30">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs font-semibold text-primary">AI Assistant</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                          AI Response
                        </span>
                      </div>
                      <TypewriterText 
                        text={aiResponse} 
                        isActive={phase === 'aiResponse'} 
                        speed={25}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2 items-center bg-secondary/50 rounded-lg px-3 py-2">
                <span className="text-sm text-muted-foreground flex-1">Type a message...</span>
                <Send className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </motion.div>

          {/* Private Thread Panel */}
          <AnimatePresence>
            {showPrivatePanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ 
                  width: 220, 
                  opacity: focusOnAIResponse ? 0.5 : 1,
                  filter: focusOnAIResponse ? 'blur(0.5px)' : 'blur(0px)'
                }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="border-l border-primary/30 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden"
              >
                <div className="p-3 border-b border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <Lock className="w-3 h-3 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Private Thread</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {['Sarah', 'Alex'].map((name) => {
                      const member = teamMembers.find(m => m.name === name);
                      return (
                        <div
                          key={name}
                          className="w-5 h-5 rounded-full overflow-hidden"
                        >
                          <img 
                            src={member?.avatar} 
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      );
                    })}
                    <span className="text-[10px] text-muted-foreground ml-1">Sarah & Alex</span>
                  </div>
                </div>

                <div className="p-3 space-y-3">
                  {threadMessages.slice(0, privateMessages).map((msg, i) => {
                    const member = teamMembers.find(m => m.name === msg.user);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex gap-2"
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                          <img 
                            src={member?.avatar} 
                            alt={msg.user}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-foreground">{msg.user}</p>
                          <p className="text-xs text-muted-foreground">{msg.content}</p>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Send to AI button */}
                  <AnimatePresence>
                    {(phase === 'sendToAI' || phase === 'aiResponse') && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1, 
                          y: 0,
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="w-full mt-2 px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {phase === 'aiResponse' ? '✓ Sent!' : 'Send to AI'}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Decorative glow */}
      <motion.div 
        className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-3xl"
        animate={{
          background: focusOnAIResponse
            ? 'radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)'
            : showPrivatePanel 
              ? 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)'
        }}
        transition={{ duration: 0.6 }}
      />
    </div>
  );
};

export default HeroMockUI;
