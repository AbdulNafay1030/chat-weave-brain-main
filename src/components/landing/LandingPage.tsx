import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lock, Users, Sparkles, Zap, LogIn, ShieldCheck, Workflow, Layers, Building2, BadgeCheck } from 'lucide-react';
import HeroMockUI from './HeroMockUI';
import SidechatLogo from '@/components/SidechatLogo';

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
      quote: 'Sidechat keeps our project rooms clean while still letting us ideate fast.',
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
    <div className="min-h-screen bg-[#0b0b0e] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0b0e]/80 backdrop-blur border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <SidechatLogo size="sm" textClassName="text-white" />
          <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <span className="hover:text-white transition-colors">Product</span>
            <span className="hover:text-white transition-colors">Solutions</span>
            <span className="hover:text-white transition-colors">Resources</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => navigate('/auth')}
              aria-label="Sign in to Sidechat"
              className="bg-white text-black hover:bg-white/90 rounded-full px-5"
            >
              Sign In
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={() => navigate('/auth')}
              aria-label="Sign up for Sidechat"
              className="bg-white text-black hover:bg-white/90 rounded-full px-5"
            >
              Request a demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1
              className="font-display text-5xl md:text-6xl font-medium text-white mb-6 leading-tight tracking-tight max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              The enterprise AI platform
              <br />
              for focused team work
            </motion.h1>
            <motion.p
              className="text-lg text-white/60 mb-8 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Sidechat keeps group conversations clean with private threads and AI on demand.
            </motion.p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 h-11 px-8 rounded-full"
                onClick={() => navigate('/auth')}
              >
                Request a demo
              </Button>
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 h-11 px-8 rounded-full"
                onClick={() => navigate('/auth')}
              >
                Sign in
              </Button>
            </div>
          </div>

          <div className="relative mt-14 flex items-center justify-center">
            <div className="absolute w-[520px] h-[520px] rounded-full bg-gradient-to-b from-white/10 to-transparent blur-3xl" />
            <div className="relative w-full max-w-4xl">
              <HeroMockUI />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-[#111217]">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-[#0f1116] rounded-2xl p-6 border border-white/5">
                <div className="text-4xl font-display font-medium text-white tracking-tight">{stat.value}</div>
                <p className="text-sm text-white/60 mt-3">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
              Built for real collaboration
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Move from thinking to action without losing the thread.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {usage.map((item) => (
              <div key={item.title} className="bg-[#10131a] rounded-2xl p-8 border border-white/5">
                <h3 className="font-display text-xl font-medium text-white mb-3">{item.title}</h3>
                <p className="text-white/60">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="py-16 px-6 bg-[#0f1116]">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-start gap-12">
            <div className="lg:w-1/2">
              <h2 className="font-display text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
                Your team’s collaboration, structured and calm
              </h2>
              <p className="text-lg text-white/60 mb-8">
                Sidechat keeps discussions organized while making AI available only when it adds value.
              </p>
              <Button variant="hero" onClick={() => navigate('/auth')} className="bg-white text-black hover:bg-white/90">
                Start free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="lg:w-1/2 grid gap-6">
              {platform.map((item) => (
                <div key={item.title} className="bg-[#0b0e14] rounded-2xl p-6 border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display text-lg font-medium text-white mb-2">{item.title}</h3>
                  <p className="text-white/60">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 text-white text-sm font-medium mb-4">
            <Building2 className="w-4 h-4" />
            <span>Teams who use Sidechat</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-white mb-6 tracking-tight">
            Reimagine how your teams work together
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {industries.map((item) => (
              <div key={item} className="border border-white/10 rounded-xl px-4 py-3 text-sm text-white/60">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 bg-[#111217]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
              Teams ship faster with Sidechat
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Real stories from teams that needed clarity and speed.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((item) => (
              <div key={item.name} className="bg-[#0f1116] border border-white/5 rounded-2xl p-6">
                <p className="text-sm text-white/70 mb-6">“{item.quote}”</p>
                <div className="text-sm font-medium text-white">{item.name}</div>
                <div className="text-xs text-white/50">{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="bg-[#111217] rounded-3xl p-12 md:p-16 text-center relative overflow-hidden border border-white/5"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
              Start focused conversations today
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">
              Sidechat helps teams align faster without the noise.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 h-12 px-8 rounded-full"
                onClick={() => navigate('/auth')}
              >
                Request a demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/10">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <SidechatLogo size="xs" textClassName="text-white" />
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/60">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Support</span>
            <span>© 2025 Sidechat</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
