import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Video,
  User,
  Bot,
  Send,
  Star,
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Plus,
  VideoOff,
  Mic,
  MicOff,
  UserCheck,
  Check,
  Monitor,
  Volume2,
  VolumeX,
  FileText,
  Code,
  Download,
  Zap,
  ShieldCheck,
  Activity,
  PhoneOff,
  Share2
} from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const CareerConsultancy = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'bookings'
  const [consultants, setConsultants] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Scheduler Form State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [topic, setTopic] = useState('Resume Audit');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Virtual Consultancy Room State
  const [activeBooking, setActiveBooking] = useState(null);
  const [roomTab, setRoomTab] = useState('chat'); // 'chat' | 'scratchpad' | 'report'
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Media & Real-time Stream States
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  // Shared Scratchpad State
  const [scratchpadText, setScratchpadText] = useState('');
  const [savingScratchpad, setSavingScratchpad] = useState(false);

  // Rating & Summary Modal State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [sessionSummary, setSessionSummary] = useState(null);

  // Refs
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);
  const userVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const audioContextRef = useRef(null);

  const topicsList = [
    'Resume Audit',
    'System Design Prep',
    'Career Transition',
    'Mock Technical Interview',
    'Behavioral STAR Drills'
  ];

  const timeSlotsList = [
    '09:00 AM - 09:30 AM',
    '10:00 AM - 10:30 AM',
    '11:30 AM - 12:00 PM',
    '02:00 PM - 02:30 PM',
    '03:30 PM - 04:00 PM',
    '05:00 PM - 05:30 PM'
  ];

  useEffect(() => {
    loadConsultancyData();
  }, []);

  // Meeting Timer & WebRTC Stream Management
  useEffect(() => {
    if (activeBooking) {
      setChatMessages(activeBooking.messages || []);
      setScratchpadText(activeBooking.scratchpadContent || `# Shared Consultancy Scratchpad\n- Goal: ${activeBooking.topic}\n- Advisor: ${activeBooking.consultantName}\n\n// Write notes, code snippets, or system architecture here...\n`);
      setCallDuration(0);

      // Start meeting timer
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Initialize Webcam & Mic Stream if available
      initLocalStream();
    } else {
      stopLocalStreams();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      stopLocalStreams();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeBooking]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  // Handle Speech Synthesis for AI Voice
  const speakAIText = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const loadConsultancyData = async () => {
    try {
      setLoading(true);
      const consultantsRes = await API.get('/bookings/consultants');
      setConsultants(consultantsRes.data);

      const bookingsRes = await API.get('/bookings');
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error('Error fetching consultancy data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // WebRTC Local Media Stream Initialization
  const initLocalStream = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }

        // Setup audio level visualizer using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateAudioLevel = () => {
          if (!activeBooking) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const average = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
          requestAnimationFrame(updateAudioLevel);
        };
        updateAudioLevel();
      }
    } catch (err) {
      console.warn('Webcam/Mic access denied or unavailable. Using simulated avatar feed.', err.message);
    }
  };

  const stopLocalStreams = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Screen Sharing Toggle
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = stream;
          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = stream;
          }
          setIsScreenSharing(true);
          stream.getVideoTracks()[0].onended = () => setIsScreenSharing(false);
        }
      } catch (err) {
        console.warn('Screen sharing cancelled or unavailable.', err.message);
      }
    }
  };

  // Open booking modal
  const handleOpenBooking = (consultant) => {
    setSelectedConsultant(consultant);
    setDate(new Date().toISOString().split('T')[0]);
    setTimeSlot(timeSlotsList[0]);
    setTopic('Resume Audit');
    setNotes('');
    setBookingSuccess(false);
    setShowBookingModal(true);
  };

  // Launch Instant Live Session immediately
  const handleStartInstantCall = async (consultant) => {
    try {
      setLoading(true);
      const res = await API.post('/bookings', {
        consultantId: consultant.id,
        topic: 'Live Career Guidance & Resume Audit',
        notes: 'Instant 1-on-1 consultation session launched',
        isInstant: true
      });
      
      const newBooking = res.data;
      setBookings(prev => [newBooking, ...prev]);
      setActiveBooking(newBooking);
    } catch (err) {
      console.error('Instant call launch failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create scheduled booking
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!date || !timeSlot || !selectedConsultant) return;

    try {
      setSubmitting(true);
      await API.post('/bookings', {
        consultantId: selectedConsultant.id,
        date,
        timeSlot,
        topic,
        notes
      });

      const bookingsRes = await API.get('/bookings');
      setBookings(bookingsRes.data);

      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setActiveTab('bookings');
      }, 1200);
    } catch (err) {
      console.error('Booking failed:', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Send message in meeting chat
  const handleSendMessage = async (e, textOverride) => {
    if (e) e.preventDefault();
    const msgToSend = textOverride || chatInput;
    if (!msgToSend.trim() || chatLoading || !activeBooking) return;

    const userMsg = msgToSend.trim();
    if (!textOverride) setChatInput('');

    setChatMessages(prev => [...prev, { sender: 'student', content: userMsg, timestamp: new Date() }]);
    setChatLoading(true);

    try {
      const res = await API.post(
        `/bookings/${activeBooking._id}/chat`,
        { content: userMsg },
        { timeout: 60000 }
      );
      setChatMessages(res.data.messages);

      // Trigger AI Speech if enabled
      const lastMsg = res.data.messages[res.data.messages.length - 1];
      if (lastMsg && lastMsg.sender === 'consultant') {
        speakAIText(lastMsg.content);
      }
    } catch (err) {
      console.error('Chat error:', err.message);
      const errorMessage = err.response?.data?.message ||
        (err.code === 'ECONNABORTED'
          ? 'The AI response took too long. Please try again with a shorter message.'
          : 'Could not send your message. Please check your connection and try again.');
      setChatMessages(prev => [
        ...prev,
        { sender: 'consultant', content: errorMessage, timestamp: new Date() }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Save scratchpad
  const handleSaveScratchpad = async () => {
    if (!activeBooking) return;
    try {
      setSavingScratchpad(true);
      await API.put(`/bookings/${activeBooking._id}/scratchpad`, { scratchpadContent: scratchpadText });
    } catch (e) {
      console.error('Scratchpad update failed:', e.message);
    } finally {
      setSavingScratchpad(false);
    }
  };

  // Complete session & trigger summary
  const handleSubmitFeedback = async () => {
    if (!activeBooking) return;
    try {
      const res = await API.post(`/bookings/${activeBooking._id}/complete`, {
        rating: feedbackRating,
        feedback: feedbackText,
        scratchpadContent: scratchpadText
      });
      setSessionSummary(res.data.summaryReport);
      setBookings(prev => prev.map(b => b._id === activeBooking._id ? { ...b, status: 'Completed', summaryReport: res.data.summaryReport } : b));
    } catch (e) {
      console.error('Error completing booking:', e);
    }
    setShowRatingModal(false);
  };

  // Download transcript report
  const handleDownloadReport = () => {
    if (!activeBooking) return;
    const reportText = `
======================================================
     NEXORA CAREER CONSULTANCY SESSION REPORT
======================================================
Date: ${new Date().toLocaleDateString()}
Session Topic: ${activeBooking.topic}
Consultant: ${activeBooking.consultantName} (${activeBooking.consultantRole})
Duration: ${formatDuration(callDuration)}
Candidate: ${user?.name || 'Student'}

--- CHAT TRANSCRIPT ---
${chatMessages.map(m => `[${m.sender.toUpperCase()}]: ${m.content}`).join('\n\n')}

--- SHARED SCRATCHPAD & NOTES ---
${scratchpadText}

======================================================
`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Consultation_${activeBooking.consultantName}_${Date.now()}.txt`;
    a.click();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Active Virtual Meeting Room Screen
  if (activeBooking) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col md:flex-row h-screen font-sans">
        {/* Left Container: Video Stage & Call Controls */}
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 relative bg-slate-950 overflow-hidden">
          
          {/* Top Header Bar */}
          <div className="flex justify-between items-center z-20 bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block animate-ping absolute inset-0 opacity-75"></span>
                <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block relative"></span>
              </div>
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-emerald-400">Live Virtual Consultation</h3>
                <p className="text-[10px] text-slate-400">{activeBooking.topic}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Voice AI toggle */}
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition ${
                  voiceEnabled ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{voiceEnabled ? 'AI Speech Active' : 'Mute Speech'}</span>
              </button>

              <div className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-mono font-bold flex items-center gap-1.5 border border-white/10">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatDuration(callDuration)}</span>
              </div>
            </div>
          </div>

          {/* Main Video Stream Container */}
          <div className="relative flex-1 my-4 bg-slate-900 rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center shadow-2xl">
            
            {/* Screen Share Layer if Active */}
            {isScreenSharing ? (
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                <div className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" /> Presenting Screen Live
                </div>
              </div>
            ) : isVideoOff ? (
              /* Avatar View when video off */
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-4xl font-black text-white shadow-2xl border-4 border-emerald-500/30 animate-pulse">
                  {activeBooking.consultantName.charAt(0)}
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-black text-white">{activeBooking.consultantName}</h4>
                  <p className="text-xs text-emerald-400 font-semibold">{activeBooking.consultantRole}</p>
                </div>
              </div>
            ) : (
              /* Live Feed Overlay */
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={
                    activeBooking.consultantId === 'ai-resume' ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&fit=crop' :
                    activeBooking.consultantId === 'ai-tech' ? 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&fit=crop' :
                    activeBooking.consultantId === 'ai-career' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&fit=crop' :
                    activeBooking.consultantId === 'ai-behavioral' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&fit=crop' :
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&fit=crop'
                  }
                  alt={activeBooking.consultantName}
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40"></div>
                
                {/* Consultant Badge */}
                <div className="absolute bottom-6 left-6 text-left bg-slate-950/70 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <h3 className="text-sm font-extrabold text-white">{activeBooking.consultantName}</h3>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-bold mt-0.5">{activeBooking.consultantRole}</p>
                </div>
              </div>
            )}

            {/* Candidate PIP Small Video Feed */}
            <div className="absolute bottom-6 right-6 w-36 h-24 bg-slate-900 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl flex items-center justify-center">
              {localStreamRef.current ? (
                <video ref={userVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {user?.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <span className="text-[10px] text-slate-300 font-extrabold mt-1 truncate max-w-[100px]">{user?.name}</span>
                </div>
              )}

              {/* Audio level indicator bar */}
              <div className="absolute bottom-1 left-2 right-2 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 transition-all duration-75" style={{ width: `${audioLevel}%` }}></div>
              </div>
            </div>
          </div>

          {/* Meeting Controller Bar */}
          <div className="flex justify-center items-center gap-3 z-20 bg-slate-900/90 backdrop-blur-md py-3 px-6 rounded-2xl border border-white/10 max-w-xl mx-auto w-full">
            {/* Mic Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-2xl border transition-all ${
                isMuted ? 'bg-rose-600 border-rose-500 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera Toggle */}
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-3.5 rounded-2xl border transition-all ${
                isVideoOff ? 'bg-rose-600 border-rose-500 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Screen Share Toggle */}
            <button
              onClick={handleToggleScreenShare}
              className={`p-3.5 rounded-2xl border transition-all ${
                isScreenSharing ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
              title="Share Screen"
            >
              <Monitor className="w-5 h-5" />
            </button>

            {/* Leave Call */}
            <button
              onClick={() => setShowRatingModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Session</span>
            </button>
          </div>
        </div>

        {/* Right Container: Dual Chat & Shared Scratchpad Panel */}
        <div className="w-full md:w-[460px] border-t md:border-t-0 md:border-l border-white/10 bg-slate-900 flex flex-col justify-between">
          
          {/* Panel Header & Navigation Tabs */}
          <div className="p-3 border-b border-white/10 bg-slate-950 flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setRoomTab('chat')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  roomTab === 'chat' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Live Chat</span>
              </button>
              <button
                onClick={() => setRoomTab('scratchpad')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  roomTab === 'scratchpad' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Scratchpad</span>
              </button>
            </div>

            <button 
              onClick={() => setActiveBooking(null)} 
              className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition"
              title="Exit View"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Tab 1: Live Chat Workspace */}
          {roomTab === 'chat' && (
            <>
              {/* Quick AI Action Chips */}
              <div className="p-2.5 bg-slate-950/60 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => handleSendMessage(null, 'Could you audit my resume ATS keywords for a Senior Full Stack Role?')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold shrink-0 flex items-center gap-1 transition"
                >
                  <Zap className="w-3 h-3" /> Audit ATS Keywords
                </button>
                <button
                  onClick={() => handleSendMessage(null, 'Give me a mock technical question on system design and database caching.')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold shrink-0 flex items-center gap-1 transition"
                >
                  <Code className="w-3 h-3" /> System Design Prep
                </button>
                <button
                  onClick={() => handleSendMessage(null, 'Ask me a STAR method behavioral question for an engineering interview.')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold shrink-0 flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3 h-3" /> STAR Behavioral Drill
                </button>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-220px)]">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-2 max-w-[90%] ${
                      msg.sender === 'student' ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.sender === 'student' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {msg.sender === 'student' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`p-3.5 rounded-2xl text-[11px] leading-relaxed whitespace-pre-line ${
                      msg.sender === 'student'
                        ? 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="w-7 h-7 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-800 text-slate-400 text-xs rounded-tl-none flex items-center gap-1.5 font-bold border border-slate-700/60">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Send Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  required
                  disabled={chatLoading}
                  placeholder="Type your question or request live feedback..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3.5 py-3 rounded-xl bg-slate-800 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shrink-0 shadow-lg shadow-emerald-600/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {/* Tab 2: Shared Scratchpad & Code Workspace */}
          {roomTab === 'scratchpad' && (
            <div className="flex-1 flex flex-col p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">Shared Collaboration Notes & Code</span>
                <button
                  onClick={handleSaveScratchpad}
                  disabled={savingScratchpad}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold hover:bg-emerald-500/30 transition flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  <span>{savingScratchpad ? 'Saving...' : 'Sync Scratchpad'}</span>
                </button>
              </div>

              <textarea
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="Write shared system design notes, code snippets, or resume bullet edits here..."
                className="flex-1 p-4 rounded-2xl bg-slate-950 border border-white/10 font-mono text-xs text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none min-h-[400px]"
              />
            </div>
          )}

        </div>

        {/* Rating & Post-Session Summary Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl w-full max-w-lg text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Star className="w-7 h-7 fill-emerald-400" />
              </div>
              
              <div>
                <h3 className="text-xl font-black text-white">Rate Your Consultation Session</h3>
                <p className="text-xs text-slate-400 mt-1">
                  How was your live session with {activeBooking.consultantName}? Your feedback enhances our mentor matching.
                </p>
              </div>

              {/* Star Rating Selection */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    onClick={() => setFeedbackRating(num)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star className={`w-8 h-8 ${num <= feedbackRating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Share key insights, questions resolved, or mentor feedback (optional)..."
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleDownloadReport}
                  className="px-4 py-3 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Transcript</span>
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition"
                >
                  Complete & Exit Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 text-black dark:text-white font-sans">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 p-8 text-white shadow-xl">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-widest text-emerald-100 border border-white/20">
              Real-Time Mentorship Hub
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Career Consultancy & Live Mentorship</h2>
          <p className="text-emerald-50 text-sm max-w-xl leading-relaxed">
            Connect 1-on-1 in virtual meeting rooms with AI domain advisors and senior recruiters for real-time ATS resume audits, system design whiteboarding, and mock technical drills.
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-px">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'directory'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Mentor Directory & Live Instant Call
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span>My Consultancy Sessions</span>
          {bookings.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
              {bookings.length}
            </span>
          )}
        </button>
      </div>

      {/* Directory Tab */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {consultants.map((c) => (
            <GlassCard key={c.id} className="flex flex-col sm:flex-row gap-6 p-6 items-start relative group">
              
              {/* Consultant Avatar & Status Badge */}
              <div className="flex flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
                <div className="relative">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/20 shadow-md group-hover:scale-105 transition-all"
                  />
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse"></span>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">{c.rating}</span>
                </div>
              </div>

              {/* Details and Actions */}
              <div className="flex-1 space-y-3 w-full text-left">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{c.name}</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">{c.role}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                    c.type === 'ai' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                  }`}>
                    {c.type === 'ai' ? '🟢 AI Available 24/7' : '🟢 Online Now'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[40px]">
                  {c.bio}
                </p>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleStartInstantCall(c)}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Instant Call</span>
                  </button>

                  <button
                    onClick={() => handleOpenBooking(c)}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-750 transition flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Schedule</span>
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <GlassCard className="text-center py-16 text-slate-500 space-y-3" hover={false}>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm">You do not have any active or previous consultancy sessions.</p>
              <button
                onClick={() => setActiveTab('directory')}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition"
              >
                Find & Launch Consultancy Session
              </button>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bookings.map((booking) => (
                <GlassCard key={booking._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6" hover={false}>
                  <div className="flex gap-4 items-start text-left">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <Video className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Consultation: {booking.topic}
                      </h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                        Advisor: {booking.consultantName} ({booking.consultantRole})
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                        <span className="text-[10px] flex items-center gap-1 text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {booking.date}
                        </span>
                        <span className="text-[10px] flex items-center gap-1 text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {booking.timeSlot}
                        </span>
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-extrabold ${
                          booking.status === 'Scheduled' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 shrink-0">
                    <button
                      onClick={() => setActiveBooking(booking)}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Enter Virtual Room</span>
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Scheduler Modal */}
      {showBookingModal && selectedConsultant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 rounded-3xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {bookingSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <Check className="w-8 h-8 animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Consultation Scheduled!</h3>
                <p className="text-xs text-slate-500">Redirecting to your consultancy dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-5 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Schedule 1-on-1 Session</h3>
                    <p className="text-xs text-slate-500 mt-1">Book a time slot with {selectedConsultant.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition"
                  >
                    &times;
                  </button>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                  <img
                    src={selectedConsultant.avatar}
                    alt={selectedConsultant.name}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{selectedConsultant.name}</h4>
                    <p className="text-[10px] text-emerald-500 font-semibold">{selectedConsultant.role}</p>
                  </div>
                </div>

                {/* Date Picker */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Select Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Time Slots Grid */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Available Slots</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {timeSlotsList.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTimeSlot(slot)}
                        className={`py-2 px-3 text-[10px] font-bold rounded-xl border transition-all ${
                          timeSlot === slot
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Focus Topic</label>
                  <div className="flex flex-wrap gap-2">
                    {topicsList.map((top) => (
                      <button
                        key={top}
                        type="button"
                        onClick={() => setTopic(top)}
                        className={`py-1.5 px-3 text-[10px] font-bold rounded-lg border transition ${
                          topic === top
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {top}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goals input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Notes / Goals</label>
                  <textarea
                    placeholder="Describe what you want to achieve or get feedback on..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <span>Confirm Booking</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerConsultancy;
