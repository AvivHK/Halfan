'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { CURRENCY_FLAGS } from '@/lib/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
}

interface Offer {
  id: string;
  type: 'BUY' | 'SELL';
  currency: string;
  amount: string;
  meetingZone: string;
}

interface Transaction {
  id: string;
  offerId: string;
  initiatorId: string;
  ownerId: string;
  status: string;
  initiatorConfirmed: boolean;
  ownerConfirmed: boolean;
  initiator: Participant;
  owner: Participant;
  offer: Offer;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderFirstName: string;
  createdAt: string;
}

export default function ChatPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingTx, setLoadingTx] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Load transaction + messages
  const loadTransaction = useCallback(async () => {
    if (!token) return;
    setLoadingTx(true);
    try {
      const res = await fetch(`${API}/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError('לא נמצאה שיחה זו');
        return;
      }
      const data = await res.json() as { transaction: Transaction; messages: ChatMessage[] };
      setTransaction(data.transaction);
      setMessages(data.messages);
    } catch {
      setError('שגיאה בטעינת השיחה');
    } finally {
      setLoadingTx(false);
    }
  }, [token, transactionId]);

  useEffect(() => {
    loadTransaction();
  }, [loadTransaction]);

  // Connect Socket.io
  useEffect(() => {
    if (!token || !transactionId) return;

    const socket = io(WS_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', transactionId);
    });

    socket.on('new-message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('transaction:updated', (update: Partial<Transaction>) => {
      setTransaction((prev) => prev ? { ...prev, ...update } : prev);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, transactionId]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('send-message', { transactionId, content: input.trim() });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleConfirm = async () => {
    if (!token) return;
    setConfirming(true);
    try {
      const res = await fetch(`${API}/transactions/${transactionId}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { transaction: Transaction };
        setTransaction(data.transaction);
      }
    } finally {
      setConfirming(false);
    }
  };

  if (authLoading || loadingTx) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">טוען...</div>
      </div>
    );
  }

  if (error || !transaction || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'שגיאה'}</p>
          <Link href="/" className="text-blue-600 hover:underline">חזרה לדף הראשי</Link>
        </div>
      </div>
    );
  }

  const isInitiator = user.id === transaction.initiatorId;
  const myConfirmed = isInitiator ? transaction.initiatorConfirmed : transaction.ownerConfirmed;
  const otherConfirmed = isInitiator ? transaction.ownerConfirmed : transaction.initiatorConfirmed;
  const otherParty = isInitiator ? transaction.owner : transaction.initiator;
  const isCompleted = transaction.status === 'COMPLETED';

  const offer = transaction.offer;
  const offerLabel = `${CURRENCY_FLAGS[offer.currency] ?? ''} ${offer.currency} — ${offer.type === 'BUY' ? 'קונה' : 'מוכר'} ${parseFloat(offer.amount).toLocaleString('he-IL')}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-blue-900 font-bold text-xl">💱</Link>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">
              שיחה עם {otherParty.firstName} {otherParty.lastName.charAt(0)}.
            </div>
            <div className="text-xs text-gray-500 truncate">{offerLabel} • 📍 {offer.meetingZone}</div>
          </div>
          <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-700 shrink-0">
            Dashboard ←
          </Link>
        </div>
      </header>

      {/* Completion banner */}
      {isCompleted && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3 text-center text-green-700 text-sm font-medium">
          ✅ העסקה הושלמה בהצלחה! תוכל להשאיר דירוג בקרוב.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-2xl w-full mx-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            תחילת השיחה — שלחו הודעה ראשונה
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === user.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                  isMine
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                }`}
              >
                {!isMine && (
                  <div className="text-xs font-semibold mb-1 text-gray-500">
                    {msg.senderFirstName}
                  </div>
                )}
                <p>{msg.content}</p>
                <div className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Confirmation section */}
      {!isCompleted && (
        <div className="bg-white border-t border-gray-100 max-w-2xl w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex gap-4 text-xs text-gray-500">
              <span className={myConfirmed ? 'text-green-600 font-medium' : ''}>
                {myConfirmed ? '✅ אישרת' : '⏳ ממתין לאישורך'}
              </span>
              <span className={otherConfirmed ? 'text-green-600 font-medium' : ''}>
                {otherConfirmed
                  ? `✅ ${otherParty.firstName} אישר/ה`
                  : `⏳ ממתין לאישור ${otherParty.firstName}`}
              </span>
            </div>
            {!myConfirmed && (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-xl transition-colors shrink-0"
              >
                {confirming ? 'מאשר...' : '✅ השלמתי עסקה'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      {!isCompleted && (
        <div className="bg-white border-t border-gray-100 max-w-2xl w-full mx-auto px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="הקלד הודעה..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white rounded-xl transition-colors text-sm font-semibold"
            >
              שלח
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
