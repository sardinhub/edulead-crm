import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Users, Megaphone, Search, Loader2, CheckCheck, Volume2, VolumeX, ChevronLeft } from 'lucide-react';
import { useStore } from '../store/useStore';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Makassar', // WITA / WIB+1 sesuai kebutuhan
  });
}

function formatDateDivider(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hari Ini';
  if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function Avatar({ name, size = 'md' }) {
  const colors = ['bg-indigo-100', 'bg-violet-100', 'bg-blue-100', 'bg-emerald-100', 'bg-rose-100', 'bg-amber-100'];
  const textColors = ['text-indigo-700', 'text-violet-700', 'text-blue-700', 'text-emerald-700', 'text-rose-700', 'text-amber-700'];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const initials = name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';
  return (
    <div className={`${sizeClass} rounded-full ${colors[idx]} ${textColors[idx]} font-bold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Komponen Gelembung Pesan ─────────────────────────────────────────────────

function MessageBubble({ msg, currentUser, isGroup }) {
  const isMine = msg.sender_id === currentUser?.id;
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMine && <Avatar name={msg.sender_name} size="sm" />}
      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {!isMine && isGroup && (
          <span className="text-[11px] font-semibold text-slate-500 px-1">{msg.sender_name}</span>
        )}
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isMine
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100'
        }`}>
          {msg.message}
        </div>
        <span className={`text-[10px] text-slate-400 px-1 flex items-center gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          {formatTime(msg.created_at)}
          {isMine && <CheckCheck className="w-3 h-3 text-indigo-400" />}
        </span>
      </div>
    </div>
  );
}

// ─── Panel Kiri: Daftar Kontak ────────────────────────────────────────────────

function ContactList({ contacts, selectedContact, onSelect, unreadCounts, currentUser }) {
  const [search, setSearch] = useState('');
  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kontak..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((contact) => {
          const isActive = selectedContact?.id === contact.id;
          const unread = unreadCounts[contact.id] || 0;
          return (
            <button
              key={contact.id}
              onClick={() => onSelect(contact)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left border-b border-slate-50 ${
                isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                {contact.isBroadcast
                  ? <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                  : <Avatar name={contact.name} />
                }
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>
                  {contact.name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {contact.isBroadcast ? 'Pesan ke semua staff' : contact.role || 'Marketing'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Panel Kanan: Area Percakapan ─────────────────────────────────────────────

function ChatWindow({ contact, messages, currentUser, onSend, isLoading, onBack }) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(contact, text);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Kelompokkan pesan berdasarkan tanggal
  const groupedMessages = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const msgDate = msg.created_at ? new Date(msg.created_at).toDateString() : null;
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: 'divider', date: msg.created_at });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: 'message', data: msg });
  });

  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 text-center p-8">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-10 h-10 text-indigo-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-600 mb-2">Pilih Percakapan</h3>
        <p className="text-sm text-slate-400">Pilih kontak di sebelah kiri untuk memulai chat</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="md:hidden p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        {contact.isBroadcast
          ? <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
          : <Avatar name={contact.name} />
        }
        <div>
          <p className="font-semibold text-slate-900 text-sm">{contact.name}</p>
          <p className="text-xs text-slate-400">{contact.isBroadcast ? 'Semua Staff' : (contact.role || 'Marketing')}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Belum ada pesan. Mulai percakapan!</p>
          </div>
        ) : (
          groupedMessages.map((item, idx) => {
            if (item.type === 'divider') {
              return (
                <div key={`divider-${idx}`} className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] text-slate-400 font-medium bg-slate-100 px-3 py-0.5 rounded-full">
                    {formatDateDivider(item.date)}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              );
            }
            return (
              <MessageBubble
                key={item.data.id}
                msg={item.data}
                currentUser={currentUser}
                isGroup={contact.isBroadcast}
              />
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-slate-200">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            placeholder={contact.isBroadcast ? 'Kirim pesan ke semua staff...' : `Pesan ke ${contact.name}...`}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 resize-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all max-h-28 overflow-y-auto"
            style={{ height: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-lg shadow-indigo-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Enter untuk kirim · Shift+Enter untuk baris baru</p>
      </div>
    </div>
  );
}

// ─── Halaman Utama TeamChat ───────────────────────────────────────────────────

export default function TeamChat() {
  const { user, systemUsers, fetchSystemUsers, chatMessages, fetchChatMessages, sendChatMessage, markChatAsRead, initChatRealtime, unreadCounts } = useStore();
  const [selectedContact, setSelectedContact] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showContactList, setShowContactList] = useState(true);
  const audioRef = useRef(null);

  // Buat audio ping menggunakan Web Audio API (tidak butuh file eksternal)
  const playNotification = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  }, [soundEnabled]);

  // Fetch data awal
  useEffect(() => {
    fetchSystemUsers();
  }, []);

  // Ambil pesan ketika kontak dipilih
  useEffect(() => {
    if (!selectedContact) return;
    setIsLoading(true);
    fetchChatMessages(selectedContact).finally(() => setIsLoading(false));
    if (selectedContact) {
      markChatAsRead(selectedContact, user);
    }
  }, [selectedContact?.id]);

  // Init realtime
  useEffect(() => {
    const channel = initChatRealtime(user, selectedContact, playNotification);
    return () => channel?.unsubscribe?.();
  }, [user?.id, selectedContact?.id, soundEnabled]);

  // Daftar kontak: Broadcast + semua staff aktif
  const contacts = [
    // Broadcast tersedia untuk semua
    { id: 'broadcast', name: '📢 Broadcast — Semua Staff', isBroadcast: true },
    // Daftar user lain
    ...systemUsers
      .filter(u => u.id !== user?.id && u.is_active)
      .map(u => ({ id: u.id, name: u.name, role: u.role })),
  ];

  // Filter pesan untuk kontak yang dipilih
  const currentMessages = chatMessages.filter(msg => {
    if (!selectedContact) return false;
    if (selectedContact.isBroadcast) {
      // Broadcast: pesan yang recipient_id = null
      return msg.recipient_id === null || msg.recipient_id === undefined;
    }
    // DM: pesan antara current user dan kontak ini
    return (
      (msg.sender_id === user?.id && msg.recipient_id === selectedContact.id) ||
      (msg.sender_id === selectedContact.id && msg.recipient_id === user?.id)
    );
  });

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setShowContactList(false); // mobile: beralih ke panel chat
  };

  const handleSend = async (contact, text) => {
    await sendChatMessage({
      contact,
      message: text,
      sender: user,
    });
  };

  const handleBack = () => {
    setShowContactList(true);
    setSelectedContact(null);
  };

  return (
    <div className="p-0 h-[calc(100vh-4rem)] flex flex-col">
      {/* Page Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Team Chat</h1>
            <p className="text-xs text-slate-500">Komunikasi langsung dengan tim</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(v => !v)}
            title={soundEnabled ? 'Matikan suara notifikasi' : 'Aktifkan suara notifikasi'}
            className={`p-2 rounded-xl transition-all border ${soundEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium">Real-time</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel Kiri: Kontak */}
        <div className={`w-full md:w-72 lg:w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden ${!showContactList ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kontak</span>
              <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {contacts.length} kontak
              </span>
            </div>
          </div>
          <ContactList
            contacts={contacts}
            selectedContact={selectedContact}
            onSelect={handleSelectContact}
            unreadCounts={unreadCounts}
            currentUser={user}
          />
        </div>

        {/* Panel Kanan: Chat Window */}
        <div className={`flex-1 flex flex-col overflow-hidden ${showContactList && !selectedContact ? 'hidden md:flex' : 'flex'}`}>
          <ChatWindow
            contact={selectedContact}
            messages={currentMessages}
            currentUser={user}
            onSend={handleSend}
            isLoading={isLoading}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
}
