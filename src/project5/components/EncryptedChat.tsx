import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Send, 
  CheckCheck, 
  User, 
  Clock, 
  Sparkles,
  Paperclip,
  KeyRound
} from 'lucide-react';
import { ChatMessage, UserRole, Language } from '../types';
import { INITIAL_CHAT_MESSAGES } from '../data/sampleData';

interface EncryptedChatProps {
  role: UserRole;
  isDarkMode: boolean;
  language: Language;
}

export const EncryptedChat: React.FC<EncryptedChatProps> = ({
  role,
  isDarkMode,
  language,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputVal, setInputVal] = useState('');
  const [activeChannel, setActiveChannel] = useState<'dispatcher' | 'accounts' | 'transporter'>('dispatcher');

  const channels = [
    { id: 'dispatcher', name: 'Karthik (Ambattur Dispatcher)', role: 'Floor Incharge', unread: 0 },
    { id: 'accounts', name: 'Senthil (Tally Accounts)', role: 'Credit Controller', unread: 1 },
    { id: 'transporter', name: 'Balaji Freight Contractor', role: 'Fleet Manager', unread: 0 },
  ];

  const quickPrompts = [
    'Why was DSP-26-8812 delayed 135 mins at Bay 2?',
    'Has Kaveri Automotive initiated the ₹1,45,000 RTGS?',
    'Confirm receipt of M12 Hex Bolts batch from Sundram.',
    'Issue debit note for spot hire rate surge on TR-112.',
  ];

  const handleSend = () => {
    if (!inputVal.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: role === 'owner' ? 'Factory Owner' : role === 'supply_chain_head' ? 'SCM Head' : 'Dispatcher',
      role: role.replace('_', ' ').toUpperCase(),
      content: inputVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      status: 'delivered',
      encrypted: true,
    };

    setMessages(prev => [...prev, newMsg]);
    setInputVal('');

    // Simulated automated encrypted reply from local agent after 1.5s
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: activeChannel === 'dispatcher' ? 'Karthik (Floor Dispatcher)' : activeChannel === 'accounts' ? 'Senthil (Tally Accounts)' : 'Balaji Dispatch Desk',
        role: 'Verified Local Agent',
        content: activeChannel === 'dispatcher' 
          ? 'Understood, bay supervisor is verifying the physical gate pass log now. Will update before 9:15 AM.'
          : 'Acknowledged. Added to the morning recovery queue.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
        status: 'read',
        encrypted: true,
      };
      setMessages(p => [...p, replyMsg]);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner explaining encryption and RBAC */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                Discrepancy Resolution Dispatch Channel
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>AES-256-GCM E2EE</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Direct encrypted channel with shop-floor supervisors and transport brokers to fix the 6 numbers before 9 AM.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
          <span>Active Identity:</span>
          <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-amber-400 uppercase font-bold text-[11px]">
            {role.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Agent Channels List */}
        <div className="md:col-span-1 space-y-2">
          <div className="text-xs font-mono text-neutral-500 uppercase px-1">
            Local Operational Contacts
          </div>
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id as any)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                activeChannel === ch.id
                  ? isDarkMode
                    ? 'bg-neutral-850 border-amber-500/50 shadow-sm'
                    : 'bg-amber-50 border-amber-400 shadow-sm'
                  : isDarkMode
                    ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div>
                <div className="font-semibold text-xs text-neutral-200">{ch.name}</div>
                <div className="text-[11px] text-neutral-500">{ch.role}</div>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <Lock className="w-3 h-3" />
                <span>Secured</span>
              </div>
            </button>
          ))}

          {/* Quick Prompts Panel */}
          <div className={`p-3.5 rounded-xl border mt-4 text-xs space-y-2 ${
            isDarkMode ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <span className="font-semibold text-neutral-400 text-[11px] block uppercase font-mono">
              Quick Discrepancy Inquiries:
            </span>
            <div className="space-y-1.5">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputVal(prompt)}
                  className="w-full text-left p-1.5 rounded text-[11px] text-neutral-300 hover:bg-amber-500/10 hover:text-amber-300 transition-colors truncate block border border-transparent hover:border-amber-500/20"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Conversation Feed */}
        <div className={`md:col-span-2 rounded-xl border flex flex-col justify-between overflow-hidden min-h-[460px] ${
          isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        }`}>
          {/* Channel Header */}
          <div className={`p-3.5 border-b flex items-center justify-between text-xs ${
            isDarkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-neutral-200">
                {channels.find(c => c.id === activeChannel)?.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-500 font-mono text-[11px]">
              <KeyRound className="w-3 h-3 text-amber-500" />
              <span>Key Fingerprint: 4F92-88B1-AA30</span>
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[340px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] text-neutral-500 mb-0.5 font-mono">
                  {m.sender} · {m.timestamp}
                </div>
                <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.isMe
                    ? 'bg-amber-500 text-neutral-950 font-medium rounded-tr-none'
                    : isDarkMode
                      ? 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700'
                      : 'bg-neutral-100 text-neutral-900 rounded-tl-none border border-neutral-200'
                }`}>
                  <p>{m.content}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-neutral-500 mt-0.5 font-mono">
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                  <span>Encrypted End-to-End</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className={`p-3 border-t ${
            isDarkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type discrepancy resolution note..."
                className={`flex-1 text-xs px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isDarkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
                }`}
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
