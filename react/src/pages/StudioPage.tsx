import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  Settings, 
  Download, 
  Share2, 
  Plus, 
  Calendar,
  User,
  CreditCard,
  ChevronLeft,
  Star,
  Image as ImageIcon,
  BookOpen,
  ExternalLink,
  Copy,
  Info,
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useRetroStore, type Room } from '../store/useRetroStore';
import Polaroid from '../components/Polaroid';
import './StudioPage.css';

const sidebarItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.08, type: 'spring', stiffness: 120, damping: 14 }
  })
};

const StudioPage: React.FC = () => {
  const { rooms, currentRoomId, setCurrentRoom, addRoom } = useRetroStore();
  const [showMonetization, setShowMonetization] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'export'>('edit');

  const currentRoom = rooms.find(r => r.id === currentRoomId) || rooms[0];

  const handleCreateRoom = () => {
    const newRoom: Room = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Memory Room',
      type: 'event',
      host: 'Me',
      subtitle: 'Capturing magic',
      prompt: 'Share a smile!',
      photos: []
    };
    addRoom(newRoom);
    setCurrentRoom(newRoom.id);
  };

  return (
    <div className="studio-container">
      {/* Sidebar - Premium Minimalist */}
      <motion.aside 
        className="studio-sidebar"
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring', damping: 20 }}
      >
        <div className="sidebar-header">
          <motion.button 
            className="back-btn" 
            onClick={() => window.location.hash = ''}
            whileHover={{ scale: 1.1, rotate: -8 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft size={18} />
          </motion.button>
          <div className="sidebar-title">
            <h2>Studio</h2>
            <motion.span 
              className="plan-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >Free</motion.span>
          </div>
        </div>

        <div className="rooms-list">
          <div className="section-label">Your Spaces</div>
          {rooms.map((room, index) => (
            <motion.button 
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              key={room.id}
              className={`room-item ${currentRoomId === room.id ? 'active' : ''}`}
              onClick={() => setCurrentRoom(room.id)}
              custom={index}
              variants={sidebarItemVariants}
              initial="hidden"
              animate="visible"
            >
              <div className={`room-icon-wrapper type-${room.type}`}>
                {room.type === 'event' && <Calendar size={14} />}
                {room.type === 'journal' && <BookOpen size={14} />}
                {room.type === 'brand' && <Zap size={14} />}
              </div>
              <div className="room-info">
                <span className="room-name">{room.name}</span>
                <span className="room-meta">{room.photos.length} photos</span>
              </div>
            </motion.button>
          ))}
          <motion.button 
            className="add-room-btn" 
            onClick={handleCreateRoom}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={16} /> Create Room
          </motion.button>
        </div>

        <div className="sidebar-footer">
          <motion.button 
            className="footer-promo" 
            onClick={() => setShowMonetization(true)}
            whileHover={{ scale: 1.03 }}
            animate={{ boxShadow: ['0 0 0px rgba(252,211,77,0)', '0 0 20px rgba(252,211,77,0.3)', '0 0 0px rgba(252,211,77,0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="promo-icon"><Star size={14} /></div>
            <div className="promo-text">
              <strong>Go Pro</strong>
              <span>Unlock all features</span>
            </div>
          </motion.button>
          <div className="footer-nav">
            <motion.button className="footer-item" onClick={() => setShowMonetization(true)} whileHover={{ x: 4 }}>
              <CreditCard size={18} /> <span>Plan</span>
            </motion.button>
            <motion.button className="footer-item" whileHover={{ x: 4 }}><Settings size={18} /> <span>Settings</span></motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Workspace */}
      <main className="studio-main">
        <header className="workspace-header">
          <div className="room-header-info">
            <motion.h1 
              key={currentRoom.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {currentRoom.name}
            </motion.h1>
            <div className="room-meta-tags">
              <span className="tag"><User size={12} /> {currentRoom.host}</span>
              <span className="tag-separator"></span>
              <span className="tag"><ImageIcon size={12} /> {currentRoom.type}</span>
            </div>
          </div>
          
          <div className="workspace-header-actions">
            <button className="btn-secondary-sm"><Share2 size={16} /> Share</button>
            <button className="btn-primary-sm">Open Preview <ExternalLink size={14} /></button>
          </div>
        </header>

        {/* The Desk - Sophisticated Grid Area */}
        <div className="desk-area studio-grid">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentRoom.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="desk-surface"
            >
              {currentRoom.photos.map((photo) => (
                <Polaroid 
                  key={photo.id}
                  src={photo.src}
                  date={photo.date}
                  caption={photo.caption}
                  initialRotation={photo.rotation}
                  style={{ top: photo.y, left: photo.x }}
                />
              ))}
              
              {currentRoom.photos.length === 0 && (
                <motion.div 
                  className="empty-state-studio"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                >
                  <motion.img 
                    src="/retro_camera_3d.png" 
                    alt="Empty Room" 
                    className="empty-visual-img"
                    animate={{ y: [0, -12, 0], rotate: [0, 3, -2, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <h3>This room is quiet...</h3>
                  <p>Share the invite link to start collecting memories from your guests.</p>
                  <div className="empty-actions">
                    <motion.button 
                      className="btn-primary"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Copy size={16} /> Copy Invite Link
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Right Property Panel */}
      <div className="studio-properties">
        <div className="properties-tabs">
          <button 
            className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            Customize
          </button>
          <button 
            className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
        </div>

        <div className="properties-content">
          {activeTab === 'edit' ? (
            <div className="tool-section">
              <div className="control-group">
                <label>Space Name</label>
                <input type="text" defaultValue={currentRoom.name} placeholder="E.g. Summer Wedding" />
              </div>
              <div className="control-group">
                <label>Welcome Prompt</label>
                <textarea defaultValue={currentRoom.prompt} placeholder="What should guests capture?" />
              </div>
              <div className="control-group">
                <label>Host Attribution</label>
                <input type="text" defaultValue={currentRoom.host} />
              </div>
              
              <div className="info-box">
                <Info size={16} />
                <p>These settings affect the guest join page and the final keepsake artifact.</p>
              </div>
            </div>
          ) : (
            <div className="tool-section">
              <div className="export-options-grid">
                <div className="export-option active">
                  <div className="option-preview collage"></div>
                  <div className="option-label">
                    <strong>Photo Collage</strong>
                    <span>Best for printing</span>
                  </div>
                </div>
                <div className="export-option">
                  <div className="option-preview guestbook"></div>
                  <div className="option-label">
                    <strong>Guestbook</strong>
                    <span>Full event history</span>
                  </div>
                </div>
                <div className="export-option">
                  <div className="option-preview strip"></div>
                  <div className="option-label">
                    <strong>4-Up Strip</strong>
                    <span>Classic retro feel</span>
                  </div>
                </div>
              </div>
              <button className="btn-primary-full"><Download size={18} /> Generate Export</button>
            </div>
          )}
        </div>

        <div className="monetization-card-mini" onClick={() => setShowMonetization(true)}>
          <div className="card-top">
            <Zap size={16} className="zap-icon" />
            <span>Event Pro Upgrade</span>
          </div>
          <p>Get high-res PDF exports and custom brand frames.</p>
          <ArrowRight size={16} className="arrow-icon" />
        </div>
      </div>

      {/* Premium Pricing Modal */}
      <AnimatePresence>
        {showMonetization && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowMonetization(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="modal-shell pricing-modal-shell"
              onClick={e => e.stopPropagation()}
            >
              <div className="pricing-modal-header">
                <div className="modal-badge"><Sparkles size={14} /> Upgrade Your Studio</div>
                <h2>The right plan for every memory.</h2>
                <button className="modal-close" onClick={() => setShowMonetization(false)}>×</button>
              </div>
              
              <div className="pricing-tiers">
                <div className="tier-card">
                  <div className="tier-icon"><BookOpen size={24} /></div>
                  <h3>Journal Club</h3>
                  <div className="tier-price">$9<span>/mo</span></div>
                  <p>For couples and personal memory rituals.</p>
                  <ul className="tier-features">
                    <li>1 Private Shared Room</li>
                    <li>Daily memory prompts</li>
                    <li>Monthly recap export</li>
                  </ul>
                  <button className="btn-outline-full">Select Plan</button>
                </div>
                
                <div className="tier-card featured">
                  <div className="tier-label">Best for Events</div>
                  <div className="tier-icon"><Calendar size={24} /></div>
                  <h3>Event Pro</h3>
                  <div className="tier-price">$49<span>/event</span></div>
                  <p>For weddings, parties, and activations.</p>
                  <ul className="tier-features">
                    <li>Unlimited contributors</li>
                    <li>QR join posters</li>
                    <li>High-res PDF Guestbook</li>
                    <li>Premium film filters</li>
                  </ul>
                  <button className="btn-primary-full">Select Event</button>
                </div>
                
                <div className="tier-card">
                  <div className="tier-icon"><Zap size={24} /></div>
                  <h3>Brand Mode</h3>
                  <div className="tier-price">$299<span>/activ.</span></div>
                  <p>For agencies and brand activations.</p>
                  <ul className="tier-features">
                    <li>Branded room styling</li>
                    <li>Custom frame overlays</li>
                    <li>Campaign analytics</li>
                  </ul>
                  <button className="btn-outline-full">Inquire</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudioPage;
