import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Users, 
  Settings, 
  Phone, 
  PhoneOff,
  MicIcon,
  VolumeIcon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { toast } from 'react-hot-toast';

interface VoiceParticipant {
  userId: string;
  username: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  joinedAt: Date;
}

interface BoltzyVoiceChatProps {
  roomId: string;
  isVisible: boolean;
  onToggle: () => void;
}

const BoltzyVoiceChat: React.FC<BoltzyVoiceChatProps> = ({
  roomId,
  isVisible,
  onToggle
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio context and stream
  const initializeAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      });

      localStreamRef.current = stream;

      // Create audio context for level detection
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Start audio level monitoring
      monitorAudioLevel();

      return stream;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      toast.error('Failed to access microphone');
      throw error;
    }
  }, []);

  // Monitor audio level for speaking detection
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const level = average / 255;
      
      setAudioLevel(level);
      
      // Detect speaking (threshold can be adjusted)
      const speaking = level > 0.1;
      if (speaking !== isSpeaking) {
        setIsSpeaking(speaking);
        if (socket && isConnected) {
          socket.emit('voice:speaking', { roomId, userId: user?.id, speaking });
        }
      }
      
      // Send audio level to server
      if (socket && isConnected) {
        socket.emit('voice:audio_level', { roomId, userId: user?.id, level });
      }
      
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  }, [socket, isConnected, roomId, user?.id, isSpeaking]);

  // Create peer connection
  const createPeerConnection = useCallback((userId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    });

    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      // Play remote audio
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.play().catch(console.error);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('voice:ice_candidate', {
          roomId,
          targetUserId: userId,
          candidate: event.candidate
        });
      }
    };

    return peerConnection;
  }, [socket, roomId]);

  // Join voice room
  const joinVoiceRoom = useCallback(async () => {
    if (!socket || !user) return;

    try {
      await initializeAudio();
      
      socket.emit('voice:join', {
        roomId,
        userId: user.id,
        username: user.username
      });
      
      setIsConnected(true);
      toast.success('Joined voice chat');
    } catch (error) {
      console.error('Failed to join voice room:', error);
      toast.error('Failed to join voice chat');
    }
  }, [socket, user, roomId, initializeAudio]);

  // Leave voice room
  const leaveVoiceRoom = useCallback(() => {
    if (!socket || !user) return;

    socket.emit('voice:leave', { roomId, userId: user.id });
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    // Stop audio monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsConnected(false);
    setParticipants([]);
    toast.success('Left voice chat');
  }, [socket, user, roomId]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!socket || !user) return;

    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    // Mute/unmute local stream
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMuted;
      });
    }
    
    socket.emit('voice:mute', { roomId, userId: user.id, muted: newMuted });
  }, [socket, user, roomId, isMuted]);

  // Toggle deafen
  const toggleDeafen = useCallback(() => {
    if (!socket || !user) return;

    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    
    socket.emit('voice:deafen', { roomId, userId: user.id, deafened: newDeafened });
  }, [socket, user, roomId, isDeafened]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleParticipants = (data: { participants: VoiceParticipant[] }) => {
      setParticipants(data.participants);
    };

    const handleParticipantJoined = (data: { userId: string; username: string; timestamp: Date }) => {
      setParticipants(prev => [...prev, {
        userId: data.userId,
        username: data.username,
        isMuted: false,
        isDeafened: false,
        isSpeaking: false,
        audioLevel: 0,
        joinedAt: data.timestamp
      }]);
      toast.success(`${data.username} joined voice chat`);
    };

    const handleParticipantLeft = (data: { userId: string; username: string; timestamp: Date }) => {
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      toast.success(`${data.username} left voice chat`);
    };

    const handleParticipantMuted = (data: { userId: string; username: string; muted: boolean; timestamp: Date }) => {
      setParticipants(prev => prev.map(p => 
        p.userId === data.userId ? { ...p, isMuted: data.muted } : p
      ));
    };

    const handleParticipantDeafened = (data: { userId: string; username: string; deafened: boolean; timestamp: Date }) => {
      setParticipants(prev => prev.map(p => 
        p.userId === data.userId ? { ...p, isDeafened: data.deafened } : p
      ));
    };

    const handleParticipantSpeaking = (data: { userId: string; username: string; speaking: boolean; timestamp: Date }) => {
      setParticipants(prev => prev.map(p => 
        p.userId === data.userId ? { ...p, isSpeaking: data.speaking } : p
      ));
    };

    const handleParticipantAudioLevel = (data: { userId: string; username: string; level: number; timestamp: Date }) => {
      setParticipants(prev => prev.map(p => 
        p.userId === data.userId ? { ...p, audioLevel: data.level } : p
      ));
    };

    // WebRTC signaling
    const handleOffer = (data: { fromUserId: string; offer: RTCSessionDescriptionInit; timestamp: Date }) => {
      const peerConnection = createPeerConnection(data.fromUserId);
      peerConnectionsRef.current.set(data.fromUserId, peerConnection);
      
      peerConnection.setRemoteDescription(data.offer).then(() => {
        return peerConnection.createAnswer();
      }).then(answer => {
        return peerConnection.setLocalDescription(answer);
      }).then(() => {
        socket.emit('voice:answer', {
          roomId,
          targetUserId: data.fromUserId,
          answer: peerConnection.localDescription
        });
      });
    };

    const handleAnswer = (data: { fromUserId: string; answer: RTCSessionDescriptionInit; timestamp: Date }) => {
      const peerConnection = peerConnectionsRef.current.get(data.fromUserId);
      if (peerConnection) {
        peerConnection.setRemoteDescription(data.answer);
      }
    };

    const handleICECandidate = (data: { fromUserId: string; candidate: RTCIceCandidateInit; timestamp: Date }) => {
      const peerConnection = peerConnectionsRef.current.get(data.fromUserId);
      if (peerConnection) {
        peerConnection.addIceCandidate(data.candidate);
      }
    };

    // Register event listeners
    socket.on('voice:participants', handleParticipants);
    socket.on('voice:participant_joined', handleParticipantJoined);
    socket.on('voice:participant_left', handleParticipantLeft);
    socket.on('voice:participant_muted', handleParticipantMuted);
    socket.on('voice:participant_deafened', handleParticipantDeafened);
    socket.on('voice:participant_speaking', handleParticipantSpeaking);
    socket.on('voice:participant_audio_level', handleParticipantAudioLevel);
    socket.on('voice:offer', handleOffer);
    socket.on('voice:answer', handleAnswer);
    socket.on('voice:ice_candidate', handleICECandidate);

    // Cleanup
    return () => {
      socket.off('voice:participants', handleParticipants);
      socket.off('voice:participant_joined', handleParticipantJoined);
      socket.off('voice:participant_left', handleParticipantLeft);
      socket.off('voice:participant_muted', handleParticipantMuted);
      socket.off('voice:participant_deafened', handleParticipantDeafened);
      socket.off('voice:participant_speaking', handleParticipantSpeaking);
      socket.off('voice:participant_audio_level', handleParticipantAudioLevel);
      socket.off('voice:offer', handleOffer);
      socket.off('voice:answer', handleAnswer);
      socket.off('voice:ice_candidate', handleICECandidate);
    };
  }, [socket, roomId, createPeerConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        leaveVoiceRoom();
      }
    };
  }, [isConnected, leaveVoiceRoom]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-black/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Voice Chat</h3>
            <p className="text-white/70 text-sm">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="boltzy-btn boltzy-btn-ghost p-2 rounded-xl"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onToggle}
            className="boltzy-btn boltzy-btn-ghost p-2 rounded-xl"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Participants List */}
      <div className="p-4 max-h-64 overflow-y-auto boltzy-scrollbar">
        <div className="space-y-3">
          {participants.map((participant) => (
            <div key={participant.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {participant.username.charAt(0)}
                    </span>
                  </div>
                  {participant.isSpeaking && (
                    <div className="absolute -inset-1 border-2 border-green-400 rounded-full animate-pulse" />
                  )}
                </div>
                
                <div>
                  <p className="text-white font-medium text-sm">{participant.username}</p>
                  <div className="flex items-center space-x-2 text-xs text-white/70">
                    {participant.isMuted && <MicOff className="w-3 h-3" />}
                    {participant.isDeafened && <VolumeX className="w-3 h-3" />}
                    {participant.isSpeaking && <span className="text-green-400">Speaking</span>}
                  </div>
                </div>
              </div>
              
              {/* Audio Level Indicator */}
              {participant.isSpeaking && (
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-4 rounded-full transition-colors ${
                        participant.audioLevel > i * 0.2 ? 'bg-green-400' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-white/10">
        {!isConnected ? (
          <button
            onClick={joinVoiceRoom}
            className="boltzy-btn boltzy-btn-primary w-full p-3 rounded-2xl"
          >
            <Phone className="w-5 h-5 mr-2" />
            Join Voice Chat
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={toggleMute}
              className={`boltzy-btn p-3 rounded-2xl ${
                isMuted ? 'boltzy-btn-primary' : 'boltzy-btn-ghost'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <button
              onClick={toggleDeafen}
              className={`boltzy-btn p-3 rounded-2xl ${
                isDeafened ? 'boltzy-btn-primary' : 'boltzy-btn-ghost'
              }`}
            >
              {isDeafened ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            
            <button
              onClick={leaveVoiceRoom}
              className="boltzy-btn boltzy-btn-ghost p-3 rounded-2xl"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoltzyVoiceChat;
