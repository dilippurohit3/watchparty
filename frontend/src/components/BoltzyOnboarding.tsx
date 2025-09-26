import React, { useState, useEffect } from 'react';
import { X, Play, Users, Heart, Share2, Crown, Music, Zap, Star, ArrowRight, ArrowLeft } from 'lucide-react';

interface BoltzyOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const BoltzyOnboarding: React.FC<BoltzyOnboardingProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const steps = [
    {
      title: "Welcome to Boltzy! 🎵",
      subtitle: "Your social watchparty platform",
      content: (
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Music className="w-12 h-12 text-white" />
          </div>
          <p className="text-white/70 text-lg leading-relaxed">
            Join millions of users watching videos together in real-time. 
            Discover new content, connect with friends, and create unforgettable experiences.
          </p>
        </div>
      ),
      icon: Music,
      gradient: "from-pink-500 to-purple-500"
    },
    {
      title: "How to Host a Room",
      subtitle: "Become a DJ and share your favorite content",
      content: (
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Create Your Room</h3>
              <p className="text-white/70">Tap the "+" button to create a room and become the DJ. You control the playlist and video playback.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Invite Friends</h3>
              <p className="text-white/70">Share your room code or link to invite friends. They can join instantly and watch together.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Play className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Control Playback</h3>
              <p className="text-white/70">Play, pause, skip, and seek videos. Everyone stays perfectly synchronized in real-time.</p>
            </div>
          </div>
        </div>
      ),
      icon: Crown,
      gradient: "from-pink-500 to-purple-500"
    },
    {
      title: "Social Features",
      subtitle: "Connect and interact with the community",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="boltzy-glass rounded-2xl p-4 text-center">
              <Heart className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1">Reactions</h3>
              <p className="text-white/70 text-sm">Express yourself with emojis and animations</p>
            </div>
            
            <div className="boltzy-glass rounded-2xl p-4 text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1">Follow Users</h3>
              <p className="text-white/70 text-sm">Follow your favorite DJs and creators</p>
            </div>
            
            <div className="boltzy-glass rounded-2xl p-4 text-center">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1">Trending</h3>
              <p className="text-white/70 text-sm">Discover popular rooms and content</p>
            </div>
            
            <div className="boltzy-glass rounded-2xl p-4 text-center">
              <Star className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1">Chat</h3>
              <p className="text-white/70 text-sm">Real-time messaging with friends</p>
            </div>
          </div>
        </div>
      ),
      icon: Heart,
      gradient: "from-pink-500 to-purple-500"
    },
    {
      title: "Ready to Start?",
      subtitle: "Let's create your first room!",
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
            <Play className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-white font-bold text-xl">You're all set!</h3>
            <p className="text-white/70 text-lg">
              Start by creating a room or joining an existing one. 
              The community is waiting for you!
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <div className="boltzy-glass rounded-2xl p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-medium">Create Room</p>
            </div>
            
            <div className="boltzy-glass rounded-2xl p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-medium">Join Room</p>
            </div>
          </div>
        </div>
      ),
      icon: Play,
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="boltzy-glass rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="relative p-6 border-b border-white/10">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-r ${steps[currentStep].gradient} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <steps[currentStep].icon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-white/70 text-lg">
                {steps[currentStep].subtitle}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto boltzy-scrollbar">
            {steps[currentStep].content}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            {/* Progress */}
            <div className="flex justify-center mb-6">
              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep ? 'bg-pink-500' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`boltzy-btn boltzy-btn-ghost px-6 py-3 rounded-2xl ${
                  currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>

              <button
                onClick={handleNext}
                className="boltzy-btn boltzy-btn-primary px-6 py-3 rounded-2xl"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoltzyOnboarding;
