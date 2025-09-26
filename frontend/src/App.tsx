/**
 * BOLTZY - PROPRIETARY SOFTWARE
 * Copyright (c) 2024 Boltzy. All rights reserved.
 * 
 * This software is proprietary and confidential. Unauthorized use, modification,
 * distribution, or commercial use is strictly prohibited and will be prosecuted
 * to the full extent of the law.
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';

// Pages
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import CreateRoomPage from './pages/CreateRoomPage';
import JoinRoomPage from './pages/JoinRoomPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Rave-style Pages
import RaveHomePage from './pages/RaveHomePage';
import RaveDiscoverPage from './pages/RaveDiscoverPage';
import AdminDashboard from './pages/AdminDashboard';

// Components
import Layout from './components/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';

function App() {
  const { user, isLoading } = useAuth();
  const { isConnected } = useSocket();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* Rave-style Routes */}
        <Route path="/" element={<RaveHomePage />} />
        <Route path="/discover" element={<RaveDiscoverPage />} />
        
        {/* Original Routes */}
        <Route path="/classic" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/create" element={<CreateRoomPage />} />
        <Route path="/join" element={<JoinRoomPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
