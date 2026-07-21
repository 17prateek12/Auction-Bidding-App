'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Sparkles, Send, Loader2, CheckCircle2, Bot, User, Trophy, FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const PastEventDetailsPage = () => {
  const params = useParams();
  const eventId = (params?.id as string) || '';

  const [mounted, setMounted] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Chatbot State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'Hello! I am your Gemini AI Sourcing Assistant. Ask me anything about this concluded bidding event, winning suppliers, item prices, or savings analysis.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPastEventDetails = useCallback(async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const token = Cookies.get('token') || Cookies.get('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(`${API_URL}/api/event/user-event/${eventId}`, { headers });
      const event = res.data.event || {};
      const itemsList = res.data.item || res.data.items || [];

      setEventData(event);
      setItems(itemsList);

      let parsedCols: string[] = [];
      if (Array.isArray(event.columns)) {
        parsedCols = event.columns;
      } else if (typeof event.columns === 'string') {
        try {
          parsedCols = JSON.parse(event.columns);
        } catch {
          parsedCols = [];
        }
      }
      setColumns(parsedCols);
    } catch (err) {
      console.error('Error loading past event details:', err);
      toast.error('Failed to load past event data.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchPastEventDetails();
  }, [fetchPastEventDetails]);

  // Send Question to Gemini AI API
  const handleAskAi = async (questionText?: string) => {
    const query = (questionText || inputQuestion).trim();
    if (!query || isAiThinking) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInputQuestion('');
    setIsAiThinking(true);

    try {
      const token = Cookies.get('token') || Cookies.get('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(
        `${API_URL}/api/event/getEntireEvent/${eventId}`,
        { question: query },
        { headers }
      );

      const aiReplyText =
        typeof res.data === 'string'
          ? res.data
          : res.data.answer || res.data.response || res.data.message || 'Analysis complete.';

      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      console.error('Gemini AI Query Error:', error);
      toast.error('Failed to query Gemini AI assistant.');
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Sorry, I encountered an issue analyzing the event data. Please try asking again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <span className="text-sm font-medium">Loading Past Event Analytics & AI Assistant...</span>
      </div>
    );
  }

  const eventName = eventData?.name || eventData?.eventName || 'Concluded Bidding Event';
  const description = eventData?.description || 'Finalized sourcing event records and snapshot analysis.';

  const samplePrompts = [
    'Which supplier offered the lowest bid on Apple MacBook Pro M3?',
    'What is the estimated total savings achieved in this auction?',
    'Show me the full summary of winning bids across all items.',
  ];

  return (
    <div className="px-4 sm:px-8 py-8 w-full min-h-screen text-white space-y-6">
      {/* Back Navigation Button */}
      <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
        <Link href="/event-page">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Events Dashboard
        </Link>
      </Button>

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-purple-950/40 border border-gray-700 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-700/60 text-gray-300 border border-gray-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Ended & Finalized Event
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-100">{eventName}</h1>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Concluded Items Catalog Table */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" /> Final Sourcing Catalog ({items.length} Items)
          </h2>

          <div className="w-full overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-xl">
            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-800/90 text-gray-200 text-xs font-bold uppercase tracking-wider border-b border-gray-700">
                    <th className="px-4 py-3 text-center border-r border-gray-700 w-12">#</th>
                    {columns.map((col, idx) => (
                      <th key={idx} className="px-4 py-3 border-r border-gray-700">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                  {items.map((item, rowIndex) => {
                    let colData: Record<string, any> = {};
                    if (typeof item.column_data === 'string') {
                      try {
                        colData = JSON.parse(item.column_data);
                      } catch {
                        colData = {};
                      }
                    } else if (typeof item.column_data === 'object' && item.column_data !== null) {
                      colData = item.column_data;
                    }

                    return (
                      <tr key={item.id || rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950/60'}>
                        <td className="px-4 py-3 text-center font-mono text-xs text-gray-500 border-r border-gray-800">
                          {rowIndex + 1}
                        </td>
                        {columns.map((colKey, colIdx) => (
                          <td key={colIdx} className="px-4 py-3 border-r border-gray-800 font-medium text-gray-200">
                            {colData[colKey] !== undefined ? String(colData[colKey]) : '—'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Gemini AI Analytics Assistant Chatbot */}
        <div className="flex flex-col h-[600px] rounded-2xl border border-purple-900/50 bg-gray-900 shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 bg-gradient-to-r from-purple-950 via-gray-900 to-blue-950 border-b border-purple-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-100">Gemini AI Event Assistant</h3>
                <p className="text-[11px] text-purple-300">Natural language event analytics</p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-700 bg-gray-950/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                      : 'bg-gray-800/90 text-gray-200 border border-gray-700 rounded-bl-none shadow-md whitespace-pre-wrap'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="block text-[10px] text-gray-400 text-right mt-1.5 opacity-70">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 flex-shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isAiThinking && (
              <div className="flex gap-2.5 justify-start items-center text-xs text-purple-400">
                <Bot className="w-4 h-4 animate-bounce" />
                <span className="italic">Gemini AI is analyzing event snapshot...</span>
              </div>
            )}
          </div>

          {/* Suggested Prompt Buttons */}
          <div className="p-2.5 bg-gray-900 border-t border-gray-800 flex flex-wrap gap-1.5">
            {samplePrompts.map((promptText, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleAskAi(promptText)}
                disabled={isAiThinking}
                className="text-[11px] bg-gray-800 hover:bg-purple-900/40 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-800/40 text-left transition-colors truncate max-w-full"
              >
                💡 {promptText}
              </button>
            ))}
          </div>

          {/* Input Box & Send Button */}
          <div className="p-3 bg-gray-900 border-t border-gray-800 flex items-center gap-2">
            <Input
              type="text"
              placeholder="Ask Gemini AI a question about this event..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
              disabled={isAiThinking}
              className="bg-gray-950 border-gray-700 text-gray-100 h-9 text-xs focus:border-purple-500"
            />
            <Button
              type="button"
              size="sm"
              disabled={isAiThinking || !inputQuestion.trim()}
              onClick={() => handleAskAi()}
              className="bg-purple-600 hover:bg-purple-500 text-white h-9 px-3 flex items-center gap-1 shadow"
            >
              {isAiThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PastEventDetailsPage;
