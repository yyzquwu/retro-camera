import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { 
  Camera as CameraIcon, ArrowRight, Layout, Zap, ShieldCheck, Sparkles,
  Heart, Users, QrCode, Download, Calendar, Star, Check, Play
} from 'lucide-react';
import './LandingPage.css';

/* ───── Animated 3D floating component ───── */
const Float3D: React.FC<{ 
  src: string; alt: string; className?: string; 
  delay?: number; duration?: number; amplitude?: number;
}> = ({ src, alt, className = '', delay = 0, duration = 6, amplitude = 18 }) => (
  <motion.img
    src={src}
    alt={alt}
    className={`float-3d ${className}`}
    initial={{ opacity: 0, scale: 0.7, y: 30 }}
    animate={{ 
      opacity: 1, scale: 1, y: [0, -amplitude, 0],
      rotate: [0, 3, -2, 0],
    }}
    transition={{ 
      y: { duration, repeat: Infinity, ease: 'easeInOut', delay },
      rotate: { duration: duration * 1.2, repeat: Infinity, ease: 'easeInOut', delay },
      opacity: { duration: 0.8, delay: delay * 0.5 },
      scale: { duration: 0.8, delay: delay * 0.5, type: 'spring' },
    }}
    draggable={false}
  />
);

/* ───── Particle sparkle component ───── */
const SparkleParticle: React.FC<{ delay: number; x: string; y: string; size?: number }> = 
  ({ delay, x, y, size = 6 }) => (
  <motion.div
    className="sparkle-particle"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{ 
      opacity: [0, 1, 0], 
      scale: [0.5, 1.2, 0.5],
      rotate: [0, 180, 360],
    }}
    transition={{ duration: 2.5, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

/* ───── Animated counter ───── */
const AnimatedStat: React.FC<{ value: string; label: string; icon: React.ReactNode }> = 
  ({ value, label, icon }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div 
      ref={ref}
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
};

/* ───── Feature card with hover tilt ───── */
const FeatureCard: React.FC<{ 
  icon: React.ReactNode; title: string; desc: string; accent: string; delay: number 
}> = ({ icon, title, desc, accent, delay }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div 
      ref={ref}
      className="feature-card"
      style={{ '--card-accent': accent } as React.CSSProperties}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <div className="feature-icon-wrap">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </motion.div>
  );
};

/* ───── Use-case showcase card ───── */
const ShowcaseCard: React.FC<{ 
  emoji: string; title: string; subtitle: string; price: string; 
  features: string[]; accent: string; delay: number; featured?: boolean 
}> = ({ emoji, title, subtitle, price, features, accent, delay, featured }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div 
      ref={ref}
      className={`showcase-card ${featured ? 'featured' : ''}`}
      style={{ '--showcase-accent': accent } as React.CSSProperties}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, transition: { duration: 0.25 } }}
    >
      {featured && <div className="showcase-label">Most Popular</div>}
      <div className="showcase-emoji">{emoji}</div>
      <h3>{title}</h3>
      <p className="showcase-subtitle">{subtitle}</p>
      <div className="showcase-price">{price}</div>
      <ul className="showcase-features">
        {features.map((f, i) => <li key={i}><Check size={14} /> {f}</li>)}
      </ul>
      <button className={`showcase-cta ${featured ? 'primary' : 'outline'}`}>
        Get Started <ArrowRight size={16} />
      </button>
    </motion.div>
  );
};

/* ═══════════════════ MAIN LANDING PAGE ═══════════════════ */
const LandingPage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroParallax = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.96]);

  return (
    <div className="landing-container">
      {/* ──── Navigation ──── */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="landing-header"
      >
        <div className="header-logo">
          <div className="logo-icon">
            <CameraIcon size={22} />
          </div>
          <span>Retro Room</span>
        </div>
        <nav className="header-nav">
          <a href="#features">Features</a>
          <a href="#showcase">Use Cases</a>
          <a href="#pricing">Pricing</a>
          <div className="nav-divider"></div>
          <button className="btn-secondary">Log In</button>
          <button className="btn-primary" onClick={() => window.location.hash = '#studio'}>
            Get Started
          </button>
        </nav>
      </motion.header>

      {/* ──── Hero Section ──── */}
      <motion.section 
        ref={heroRef}
        className="hero-section"
        style={{ y: heroParallax, scale: heroScale }}
      >
        <div className="hero-content">
          <motion.div 
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Sparkles size={14} />
            <span>New: Wedding Guestbook Mode</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Turn live moments into <span className="highlight-word">collectible</span> artifacts.
          </motion.h1>
          
          <motion.p
            className="hero-desc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            A high-fidelity memory studio that transforms events, private journals, 
            and branded activations into beautiful, shareable digital polaroids.
          </motion.p>

          <motion.div 
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <button className="btn-hero-primary" onClick={() => window.location.hash = '#studio'}>
              Open Studio <ArrowRight size={20} />
            </button>
            <button className="btn-hero-secondary">
              <Play size={18} /> Watch Demo
            </button>
          </motion.div>

          <motion.div 
            className="hero-trust"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="trust-avatars">
              {[11, 12, 13, 14, 15].map(i => (
                <img key={i} src={`https://i.pravatar.cc/40?img=${i}`} alt="user" />
              ))}
            </div>
            <div className="trust-text">
              <strong>2,000+</strong> creators & event hosts
            </div>
          </motion.div>
        </div>

        <div className="hero-visual">
          {/* Animated ring */}
          <motion.div 
            className="hero-ring-outer"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div 
            className="hero-ring-inner"
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />

          {/* Main 3D camera */}
          <Float3D 
            src="/retro_camera_3d.png" 
            alt="3D Retro Camera" 
            className="hero-cam" 
            duration={5} amplitude={16}
          />
          
          {/* Floating 3D polaroid */}
          <Float3D 
            src="/polaroid_frame_3d.png" 
            alt="3D Polaroid" 
            className="hero-polaroid" 
            delay={1.2} duration={7} amplitude={14}
          />

          {/* Floating 3D film reel */}
          <Float3D 
            src="/film_reel_3d.png" 
            alt="3D Film Reel" 
            className="hero-reel" 
            delay={0.8} duration={6.5} amplitude={12}
          />

          {/* Sparkle particles */}
          <SparkleParticle delay={0} x="15%" y="20%" size={8} />
          <SparkleParticle delay={0.5} x="75%" y="15%" size={6} />
          <SparkleParticle delay={1.0} x="85%" y="65%" size={7} />
          <SparkleParticle delay={1.5} x="10%" y="70%" size={5} />
          <SparkleParticle delay={2.0} x="50%" y="85%" size={6} />
          <SparkleParticle delay={0.7} x="65%" y="40%" size={4} />

          {/* Glassmorphic UI preview card */}
          <motion.div 
            className="preview-card-glass"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <div className="preview-card-dot green" />
            <div className="preview-card-dot yellow" />
            <div className="preview-card-dot red" />
            <div className="preview-card-label">retro-room.studio</div>
            <div className="preview-card-body">
              <div className="preview-mini-polaroid" />
              <div className="preview-mini-polaroid second" />
              <div className="preview-mini-text">
                <div className="preview-line w60" />
                <div className="preview-line w40" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Background elements */}
        <div className="hero-bg-gradient-1" />
        <div className="hero-bg-gradient-2" />
      </motion.section>

      {/* ──── Stats Bar ──── */}
      <section className="stats-bar">
        <AnimatedStat value="2K+" label="Active Creators" icon={<Users size={20} />} />
        <AnimatedStat value="15K+" label="Rooms Created" icon={<CameraIcon size={20} />} />
        <AnimatedStat value="50K+" label="Exports Generated" icon={<Download size={20} />} />
        <AnimatedStat value="99%" label="Satisfaction Rate" icon={<Heart size={20} />} />
      </section>

      {/* ──── Features Section ──── */}
      <section className="features-section" id="features">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="section-badge"><Zap size={14} /> Core Features</div>
          <h2>Everything you need to capture, curate, and share.</h2>
          <p>Premium tools wrapped in a retro aesthetic that people actually love using.</p>
        </motion.div>

        <div className="features-grid">
          <FeatureCard 
            icon={<QrCode size={24} />}
            title="QR Join Flow"
            desc="Guests scan a code and start contributing instantly. No app downloads, no logins."
            accent="#ff6b6b"
            delay={0}
          />
          <FeatureCard 
            icon={<ShieldCheck size={24} />}
            title="Private Rooms"
            desc="Every memory room is invite-only. Control who contributes and curate your keepsake."
            accent="#4ade80"
            delay={0.1}
          />
          <FeatureCard 
            icon={<Layout size={24} />}
            title="Export Studio"
            desc="Collages, guestbooks, strips, and share cards — print-ready in one click."
            accent="#60a5fa"
            delay={0.2}
          />
          <FeatureCard 
            icon={<Sparkles size={24} />}
            title="Film Presets"
            desc="Authentic retro film looks that make every photo feel like a collectible artifact."
            accent="#fbbf24"
            delay={0.3}
          />
          <FeatureCard 
            icon={<Heart size={24} />}
            title="Memory Prompts"
            desc="Daily prompts that turn photo-taking into a shared ritual for couples and friends."
            accent="#f472b6"
            delay={0.4}
          />
          <FeatureCard 
            icon={<Star size={24} />}
            title="Brand Campaigns"
            desc="Custom branded rooms with your logo, colors, and CTAs for activations and popups."
            accent="#a78bfa"
            delay={0.5}
          />
        </div>
      </section>

      {/* ──── How It Works ──── */}
      <section className="how-section">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="section-badge"><Play size={14} /> How It Works</div>
          <h2>Three steps to unforgettable memories.</h2>
        </motion.div>

        <div className="how-steps">
          {[
            { num: '01', title: 'Create Your Room', desc: 'Set up an event, journal, or brand room in seconds. Name it, add a prompt, pick a vibe.', icon: <CameraIcon size={28} /> },
            { num: '02', title: 'Invite & Capture', desc: 'Share a QR code or link. Guests snap polaroids with retro film filters — no app needed.', icon: <QrCode size={28} /> },
            { num: '03', title: 'Export & Keep', desc: 'Download guestbooks, collages, and strips. Print-ready memories you\'ll actually treasure.', icon: <Download size={28} /> },
          ].map((step, i) => (
            <motion.div 
              key={step.num}
              className="how-step"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className="step-number">{step.num}</div>
              <div className="step-icon-wrap">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              {i < 2 && <div className="step-connector" />}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ──── Showcase / Pricing Section ──── */}
      <section className="showcase-section" id="showcase">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="section-badge"><Calendar size={14} /> Use Cases</div>
          <h2>The right plan for every memory.</h2>
          <p>From intimate journals to full event activations — pick your lane.</p>
        </motion.div>

        <div className="showcase-grid" id="pricing">
          <ShowcaseCard 
            emoji="💕"
            title="Journal Club"
            subtitle="For couples & personal memory rituals"
            price="$9/mo"
            features={['Private shared room', 'Daily memory prompts', 'Monthly recap export', 'Premium film access']}
            accent="#f472b6"
            delay={0}
          />
          <ShowcaseCard 
            emoji="🎉"
            title="Event Pro"
            subtitle="For weddings, parties & activations"
            price="$49/event"
            features={['Unlimited contributors', 'QR join poster', 'HD guestbook export', 'Premium film filters', 'Custom frames']}
            accent="#ff6b6b"
            delay={0.1}
            featured
          />
          <ShowcaseCard 
            emoji="⚡"
            title="Brand Mode"
            subtitle="For agencies & brand activations"
            price="$299/campaign"
            features={['Branded room styling', 'Custom frame overlays', 'Campaign analytics', 'Social-share deliverables']}
            accent="#a78bfa"
            delay={0.2}
          />
        </div>
      </section>

      {/* ──── CTA Section ──── */}
      <section className="cta-section">
        <motion.div 
          className="cta-content"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Float3D 
            src="/retro_camera_3d.png" 
            alt="Camera" 
            className="cta-camera" 
            amplitude={10} duration={4}
          />
          <h2>Ready to make some memories?</h2>
          <p>Open the studio and start capturing. It's free to try, instant to love.</p>
          <button className="btn-hero-primary" onClick={() => window.location.hash = '#studio'}>
            Open Studio — It's Free <ArrowRight size={20} />
          </button>
        </motion.div>
      </section>

      {/* ──── Footer ──── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="logo-icon small"><CameraIcon size={16} /></div>
            <span>Retro Room Studio</span>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#showcase">Use Cases</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="footer-copy">© 2026 Retro Room Studio. Made with 💕</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;