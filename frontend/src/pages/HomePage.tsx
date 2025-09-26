import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Users, MessageCircle, Star, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">
              Watch Together,
              <span className="text-primary-600"> Anywhere</span>
            </h1>
            <p className="text-xl text-secondary-600 dark:text-secondary-300 mb-8 max-w-3xl mx-auto">
              Create virtual watch parties with friends and family. Sync videos, chat in real-time, 
              and enjoy shared experiences from anywhere in the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/create"
                className="btn btn-primary btn-lg inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Room
              </Link>
              <Link
                to="/join"
                className="btn btn-outline btn-lg inline-flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Join Room
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
              Everything you need for the perfect watch party
            </h2>
            <p className="text-lg text-secondary-600 dark:text-secondary-300 max-w-2xl mx-auto">
              Powerful features designed to make your virtual gatherings seamless and enjoyable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Play className="w-8 h-8 text-primary-600" />}
              title="Synchronized Playback"
              description="Videos play, pause, and seek in perfect sync across all devices. Never miss a moment together."
            />
            <FeatureCard
              icon={<MessageCircle className="w-8 h-8 text-primary-600" />}
              title="Real-time Chat"
              description="Chat with friends while watching. Share reactions, jokes, and memories in real-time."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-primary-600" />}
              title="Easy Room Management"
              description="Create private or public rooms. Invite friends with simple links or room codes."
            />
            <FeatureCard
              icon={<Star className="w-8 h-8 text-primary-600" />}
              title="Playlist Management"
              description="Queue up multiple videos, reorder your playlist, and keep the entertainment flowing."
            />
            <FeatureCard
              icon={<Play className="w-8 h-8 text-primary-600" />}
              title="Multiple Sources"
              description="Watch YouTube videos, upload your own files, or stream from any URL. The choice is yours."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-primary-600" />}
              title="Mobile Friendly"
              description="Works perfectly on all devices. Watch together whether you're on desktop, tablet, or mobile."
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-secondary-50 dark:bg-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
              How it works
            </h2>
            <p className="text-lg text-secondary-600 dark:text-secondary-300">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              step="1"
              title="Create a Room"
              description="Start by creating your own watch party room. Set a name, description, and privacy settings."
              icon={<Plus className="w-6 h-6" />}
            />
            <StepCard
              step="2"
              title="Invite Friends"
              description="Share your room link or code with friends. They can join instantly without any registration."
              icon={<Users className="w-6 h-6" />}
            />
            <StepCard
              step="3"
              title="Start Watching"
              description="Add videos to your playlist and start watching together. Everything syncs automatically."
              icon={<Play className="w-6 h-6" />}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to start your watch party?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of users who are already enjoying synchronized video experiences.
          </p>
          <Link
            to="/create"
            className="btn btn-secondary btn-lg inline-flex items-center gap-2"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="card p-6 hover:shadow-lg transition-shadow duration-200">
    <div className="flex items-center mb-4">
      <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
        {icon}
      </div>
    </div>
    <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
      {title}
    </h3>
    <p className="text-secondary-600 dark:text-secondary-300">
      {description}
    </p>
  </div>
);

interface StepCardProps {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const StepCard: React.FC<StepCardProps> = ({ step, title, description, icon }) => (
  <div className="text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full text-2xl font-bold mb-4">
      {step}
    </div>
    <div className="flex items-center justify-center mb-4">
      <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
        {icon}
      </div>
    </div>
    <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
      {title}
    </h3>
    <p className="text-secondary-600 dark:text-secondary-300">
      {description}
    </p>
  </div>
);

export default HomePage;
