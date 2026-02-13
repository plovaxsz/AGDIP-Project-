
import React, { useState, useRef, useEffect } from 'react';
import { ProjectData, ChatMessage } from '../types';
import { sendChatToAI } from '../services/aiService';
import { Send, Bot, User, Paperclip, X, Image as ImageIcon, FileText, Trash2, MessageSquare } from 'lucide-react';
// @ts-ignore
import * as pdfjsLibProxy from 'pdfjs-dist';

// @ts-ignore
const pdfjsLib = pdfjsLibProxy.default || pdfjsLibProxy;

// Re-set worker for Chat component if not already global
if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface ChatAssistantProps {
    data: ProjectData;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ data }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { 
            id: '1', role: 'model', text: `Halo! Saya Genie, konsultan AI untuk proyek "${data.meta.theme}". Ada yang bisa saya bantu terkait analisis risiko, anggaran, atau strategi implementasi?`, timestamp: new Date() 
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [attachments, setAttachments] = useState<{ type: 'image' | 'file', content: string, name: string }[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => { scrollToBottom() }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() && attachments.length === 0) return;

        const newUserMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date(),
            attachments: [...attachments]
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInput('');
        setAttachments([]);
        setIsTyping(true);

        try {
            // Prepare history for API (limit last 10 turns to save tokens)
            const history = messages.slice(-10).map(m => ({ role: m.role, text: m.text }));
            
            const responseText = await sendChatToAI(history, newUserMsg.text, data, newUserMsg.attachments);
            
            const newBotMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseText || "Maaf, saya tidak dapat memproses permintaan saat ini.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, newBotMsg]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleClearChat = () => {
        if (window.confirm("Hapus riwayat percakapan?")) {
            setMessages([{ 
                id: Date.now().toString(), 
                role: 'model', 
                text: `Halo! Saya Genie. Percakapan telah direset. Apa yang ingin Anda diskusikan tentang proyek "${data.meta.theme}"?`, 
                timestamp: new Date() 
            }]);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Limit size 5MB
            if (file.size > 5 * 1024 * 1024) {
                alert("Ukuran file maksimal 5MB.");
                return;
            }

            // Determine type
            const isImage = file.type.startsWith('image/');
            const isPDF = file.type === 'application/pdf';
            const isText = file.type === 'text/plain' || file.name.endsWith('.txt');

            if (!isImage && !isPDF && !isText) {
                alert("Hanya mendukung Gambar, PDF, dan TXT.");
                return;
            }

            const reader = new FileReader();
            
            reader.onload = async (event) => {
                if (event.target?.result) {
                    let content = event.target.result as string;
                    
                    setAttachments(prev => [...prev, {
                        type: isImage ? 'image' : 'file',
                        content: content,
                        name: file.name
                    }]);
                }
            };

            reader.readAsDataURL(file); // Read everything as DataURL for easy transport/preview
        }
        // Reset input
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-[#1E1E2D] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">Genie Consultant (Multimodal)</h3>
                        <p className="text-[10px] text-slate-500">Konteks Proyek + Analisis Gambar & Dokumen</p>
                    </div>
                </div>
                <button 
                    onClick={handleClearChat}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    title="Hapus Chat"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 dark:bg-[#151521]">
                {messages.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                         <MessageSquare className="w-12 h-12 mb-2" />
                         <p className="text-sm">Belum ada pesan. Mulai diskusi!</p>
                     </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-blue-600 text-white'}`}>
                                {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600 dark:text-slate-300" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`max-w-[80%] space-y-2`}>
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className={`flex gap-2 flex-wrap ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.attachments.map((att, idx) => (
                                            <div key={idx} className="bg-slate-200 dark:bg-slate-800 p-2 rounded text-xs flex items-center gap-2 border border-slate-300 dark:border-slate-700">
                                                {att.type === 'image' ? (
                                                    <img src={att.content} className="w-8 h-8 object-cover rounded" alt="preview" />
                                                ) : (
                                                    <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded flex items-center justify-center">
                                                        <FileText className="w-4 h-4 text-slate-500 dark:text-slate-200"/>
                                                    </div>
                                                )}
                                                <span className="truncate max-w-[100px]">{att.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tr-none' 
                                    : 'bg-blue-600 text-white rounded-tl-none'
                                }`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                <span className="text-[10px] text-slate-400 block px-1">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                    ))
                )}
                
                {isTyping && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white"><Bot className="w-4 h-4" /></div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl rounded-tl-none flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-[#1E1E2D] border-t border-slate-200 dark:border-slate-700">
                {attachments.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                        {attachments.map((att, i) => (
                            <div key={i} className="relative group">
                                {att.type === 'image' ? (
                                    <img src={att.content} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                                ) : (
                                    <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700">
                                        <FileText className="w-6 h-6 text-slate-400"/>
                                    </div>
                                )}
                                <button 
                                    onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                    className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] truncate px-1 rounded-b-lg">{att.name}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="flex gap-2 items-end">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="Lampirkan Gambar atau PDF"
                    >
                        <Paperclip className="w-5 h-5" />
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.txt" />
                    </button>
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Tanyakan analisis atau unggah dokumen..."
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 resize-none max-h-32 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                        rows={1}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() && attachments.length === 0}
                        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatAssistant;
