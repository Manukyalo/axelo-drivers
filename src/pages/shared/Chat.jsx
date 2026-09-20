import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, doc, updateDoc, writeBatch, setDoc
} from 'firebase/firestore';
import {
  Send, ChevronLeft, ShieldCheck, CheckCheck,
  Loader2, BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// ── Channel config ────────────────────────────────────────────────────────────
const CHANNELS = {
  admin: {
    key: 'admin',
    label: 'Admin',
    subLabel: 'Fleet Command',
    subCollection: 'admin_messages',
    notifyRole: 'admin',
    Icon: ShieldCheck,
    accent: '#C9A84C',
    accentDim: 'rgba(201,168,76,0.09)',
    accentBorder: 'rgba(201,168,76,0.28)',
    bubbleBg: '#C9A84C',
    bubbleText: '#0A0F0D',
    incomingBg: '#1A2E20',
    incomingBorder: 'rgba(16,185,129,0.10)',
  },
  reservations: {
    key: 'reservations',
    label: 'Reservations',
    subLabel: 'Booking Desk',
    subCollection: 'reservations_messages',
    notifyRole: 'reservations',
    Icon: BookOpen,
    accent: '#3B82F6',
    accentDim: 'rgba(59,130,246,0.09)',
    accentBorder: 'rgba(59,130,246,0.28)',
    bubbleBg: '#3B82F6',
    bubbleText: '#ffffff',
    incomingBg: '#0F1D2E',
    incomingBorder: 'rgba(59,130,246,0.12)',
  },
};

// ── MessageBubble ─────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isMe, channel, formatTime }) => {
  const ch = CHANNELS[channel];
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        <div
          style={isMe
            ? { background: ch.bubbleBg, color: ch.bubbleText }
            : { background: ch.incomingBg, border: `1px solid ${ch.incomingBorder}`, color: '#ffffff' }
          }
          className={`p-4 text-xs font-bold leading-relaxed shadow-2xl ${
            isMe ? 'rounded-[22px] rounded-tr-none' : 'rounded-[22px] rounded-tl-none'
          }`}
        >
          {msg.text}
        </div>
        <div className={`flex items-center gap-2 mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[8px] text-[#8A9E8F] font-black uppercase tracking-[0.15em] opacity-40">
            {isMe ? 'You' : ch.label} • {formatTime(msg.timestamp)}
          </span>
          {isMe && (
            <div style={{ color: msg.read ? ch.accent : 'rgba(255,255,255,0.1)' }}>
              <CheckCheck size={10} strokeWidth={3} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const Chat = () => {
  const navigate = useNavigate();
  const { currentUser, role, driverProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('admin');
  const [channelMessages, setChannelMessages] = useState({ admin: [], reservations: [] });
  const [unreadCounts, setUnreadCounts] = useState({ admin: 0, reservations: 0 });
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const activeTabRef = useRef(activeTab);

  const driverId = currentUser?.uid;
  const ch = CHANNELS[activeTab];

  // Keep ref in sync so the snapshot callbacks can read the current active tab
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // ── Subscribe to both channels simultaneously ─────────────────────────────
  useEffect(() => {
    if (!driverId) return;

    const unsubs = Object.values(CHANNELS).map(channel => {
      const colPath = `driverMessages/${driverId}/${channel.subCollection}`;
      const q = query(collection(db, colPath), orderBy('timestamp', 'asc'));

      return onSnapshot(q, snapshot => {
        const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setChannelMessages(prev => ({ ...prev, [channel.key]: msgs }));

        const unread = snapshot.docs.filter(
          d => d.data().senderRole !== role && !d.data().read
        );

        if (channel.key === activeTabRef.current) {
          // Auto-scroll
          setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }, 80);

          // Mark read immediately if on this tab
          if (unread.length > 0) {
            const batch = writeBatch(db);
            unread.forEach(d => batch.update(doc(db, colPath, d.id), { read: true }));
            batch.commit().catch(err => console.error('mark-read error:', err));
          }
          setUnreadCounts(prev => ({ ...prev, [channel.key]: 0 }));
        } else {
          setUnreadCounts(prev => ({ ...prev, [channel.key]: unread.length }));
        }
      });
    });

    return () => unsubs.forEach(u => u());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId, role]);

  // Mark messages read on tab switch + scroll to bottom
  useEffect(() => {
    if (!driverId) return;
    const channel = CHANNELS[activeTab];
    const colPath = `driverMessages/${driverId}/${channel.subCollection}`;
    const msgs = channelMessages[activeTab];
    const unread = msgs.filter(m => m.senderRole !== role && !m.read);

    if (unread.length > 0) {
      const batch = writeBatch(db);
      unread.forEach(m => batch.update(doc(db, colPath, m.id), { read: true }));
      batch.commit().catch(err => console.error('tab-switch mark-read error:', err));
      setUnreadCounts(prev => ({ ...prev, [activeTab]: 0 }));
    }

    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 80);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const text = newMessage.trim();
    if (!text || !driverId || sending) return;

    const capturedText = text;
    setSending(true);
    setNewMessage('');

    try {
      const channel = CHANNELS[activeTab];
      const colPath = `driverMessages/${driverId}/${channel.subCollection}`;

      await addDoc(collection(db, colPath), {
        text: capturedText,
        senderId: driverId,
        senderName: driverProfile?.name || currentUser?.displayName || 'Staff Unit',
        senderRole: role || 'driver',
        channel: activeTab,
        timestamp: serverTimestamp(),
        read: false,
        type: 'text',
        status: 'sent',
      });

      // Update thread document for the admin list view
      const threadRef = doc(db, 'driverMessages', driverId);
      const patch = {
        [`${channel.key}_lastMessage`]: capturedText,
        [`${channel.key}_lastTimestamp`]: serverTimestamp(),
        driverName: driverProfile?.name || 'Staff Unit',
        driverRole: role || 'driver',
        updatedAt: serverTimestamp(),
        isDeleted: false,
      };
      await updateDoc(threadRef, patch).catch(async () => {
        await setDoc(threadRef, { driverId, ...patch }, { merge: true });
      });

      // Notify the correct team
      await addDoc(collection(db, 'notifications'), {
        title: `💬 ${driverProfile?.name || 'Driver'} → ${channel.label}`,
        message: capturedText.substring(0, 100),
        type: 'INFO',
        targetRole: channel.notifyRole,
        date: serverTimestamp(),
        read: false,
        driverId,
        driverName: driverProfile?.name || 'Driver',
        channel: activeTab,
      });
    } catch (err) {
      console.error('Message send error:', err);
      setNewMessage(capturedText);
      toast.error('Transmission failed. Try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '…';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return 'Now'; }
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return true;
    return d1.toDateString() === d2.toDateString();
  };

  const messages = channelMessages[activeTab];

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0A0F0D] max-w-md mx-auto relative overflow-hidden font-dm-sans">

      {/* ── Header ── */}
      <header className="p-5 bg-[#111A15] border-b border-white/5 z-10 shrink-0 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl active:scale-95 transition-all"
            >
              <ChevronLeft size={20} className="text-white/60" />
            </button>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                HQ <span style={{ color: ch.accent }}>COMMS</span>
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                <p className="text-[8px] text-[#8A9E8F] font-black uppercase tracking-[0.2em]">
                  Signal Secured · Level 5
                </p>
              </div>
            </div>
          </div>
          <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-[#8A9E8F]">
            <ShieldCheck size={18} />
          </div>
        </div>

        {/* ── Channel tabs ── */}
        <div className="flex gap-2">
          {Object.values(CHANNELS).map(channel => {
            const { Icon } = channel;
            const isActive = activeTab === channel.key;
            const count = unreadCounts[channel.key];
            return (
              <button
                key={channel.key}
                onClick={() => setActiveTab(channel.key)}
                style={isActive
                  ? { background: channel.accentDim, borderColor: channel.accentBorder, color: channel.accent }
                  : {}}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                  isActive ? 'shadow-sm' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                }`}
              >
                <Icon size={13} />
                <span>{channel.label}</span>
                {count > 0 && (
                  <span
                    style={{ background: channel.accent, color: channel.bubbleText }}
                    className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                  >
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Message feed ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar"
        style={{ background: 'radial-gradient(ellipse at top, #0D1810 0%, #0A0F0D 80%)' }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40 select-none">
            <ch.Icon size={32} style={{ color: ch.accent }} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 text-center leading-loose">
              No messages yet<br />
              <span className="text-[8px]">{ch.subLabel} channel is open</span>
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser?.uid;
          const msgDate = msg.timestamp?.toDate
            ? msg.timestamp.toDate()
            : msg.timestamp ? new Date(msg.timestamp) : new Date();
          const prevDate = idx > 0
            ? (messages[idx - 1].timestamp?.toDate
              ? messages[idx - 1].timestamp.toDate()
              : new Date(messages[idx - 1].timestamp))
            : null;
          const showDate = idx === 0 || !isSameDay(prevDate, msgDate);
          const dateStr = new Intl.DateTimeFormat('en-US', {
            weekday: 'long', month: 'short', day: 'numeric',
          }).format(msgDate);

          return (
            <React.Fragment key={msg.id || idx}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">
                    {dateStr}
                  </span>
                </div>
              )}
              <MessageBubble
                msg={msg}
                isMe={isMe}
                channel={activeTab}
                formatTime={formatTime}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Input area ── */}
      <div className="shrink-0 p-5 pb-10 bg-[#111A15] border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 mb-3 px-1">
          <ch.Icon size={11} style={{ color: ch.accent }} />
          <span className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: ch.accent }}>
            {ch.subLabel}
          </span>
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            placeholder={`Message ${ch.label}…`}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            className="flex-1 bg-[#0A0F0D] border border-white/10 rounded-2xl py-4 px-5 text-white text-sm focus:outline-none transition-all placeholder:text-white/20 font-medium"
            onFocus={e => { e.target.style.borderColor = ch.accentBorder; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            style={{ background: newMessage.trim() && !sending ? ch.bubbleBg : 'rgba(255,255,255,0.08)' }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all shrink-0 disabled:opacity-20"
          >
            <span style={{ color: newMessage.trim() && !sending ? ch.bubbleText : '#ffffff' }}>
              {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
