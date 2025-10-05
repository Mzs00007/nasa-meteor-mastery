import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';
import '../styles/glassmorphic.css';

const GlamorousLandingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [showAbout, setShowAbout] = useState(false);
  const heroRef = useRef(null);

  // Mock NASA news headlines (in production, this would come from NASA API)
  const newsHeadlines = [
    "NASA's DART Mission Successfully Deflects Asteroid",
    'New Near-Earth Object Detection System Online',
    'Planetary Defense Coordination Office Updates',
    'Advanced Asteroid Tracking Technology Deployed',
  ];

  useEffect(() => {
    // Stagger loading animations
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    // Auto-rotate news headlines
    const newsTimer = setInterval(() => {
      setCurrentNewsIndex(prev => (prev + 1) % newsHeadlines.length);
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearInterval(newsTimer);
    };
  }, []);

  const scrollToAbout = () => {
    setShowAbout(true);
    setTimeout(() => {
      document.getElementById('about-section')?.scrollIntoView({
        behavior: 'smooth',
      });
    }, 100);
  };

  const TelescopeIcon = () => (
    <svg width='32' height='32' viewBox='0 0 24 24' fill='currentColor'>
      <path d='M17.5 8c0-.8-.7-1.5-1.5-1.5s-1.5.7-1.5 1.5.7 1.5 1.5 1.5 1.5-.7 1.5-1.5zM1.7 6.3c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0L5 6.8c.4.4.4 1 0 1.4-.4.4-1 .4-1.4 0L1.7 6.3zM12 2c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1s-1-.4-1-1V3c0-.6.4-1 1-1zM20.3 6.3c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4L19.8 9.6c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4l1.9-1.9zM4.5 12c0-.6.4-1 1-1h2c.6 0 1 .4 1 1s-.4 1-1 1h-2c-.6 0-1-.4-1-1zM12 18c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1zM17.5 12c0-.6.4-1 1-1h2c.6 0 1 .4 1 1s-.4 1-1 1h-2c-.6 0-1-.4-1-1z' />
    </svg>
  );

  const MeteorIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
      <path d='M21 3l-9 9-3-3-6 6 3 3 6-6 3 3 9-9-3-3z' />
    </svg>
  );

  return (
    <div className='min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
      {/* Enhanced Meteor Background */}
      <EnhancedMeteorBackground
        meteorCount={30}
        starCount={800}
        intensity={1.2}
      />

      {/* Glass Navigation */}
      <nav 
        className='fixed top-0 left-0 right-0 z-50'
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div className='flex items-center space-x-4'>
          <Link
            to='/'
            className='flex items-center space-x-2 text-white hover:text-orange-300 transition-colors'
          >
            <TelescopeIcon />
            <span className='font-orbitron font-bold text-xl'>
              Meteor Madness
            </span>
          </Link>
        </div>
        <div className='flex items-center space-x-2'>
          <Link
            to='/simulation'
            className='glass-nav-item'
            style={{
              padding: '8px 16px',
              color: 'rgba(255, 255, 255, 0.9)',
              textDecoration: 'none',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = 'rgba(255, 255, 255, 0.9)';
            }}
            title='Launch advanced asteroid impact simulations with real NASA data and physics-based modeling'
          >
            Simulation
          </Link>
          <Link
            to='/education'
            className='glass-nav-item'
            style={{
              padding: '8px 16px',
              color: 'rgba(255, 255, 255, 0.9)',
              textDecoration: 'none',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = 'rgba(255, 255, 255, 0.9)';
            }}
            title='Learn about planetary defense, asteroid science, and space exploration through interactive content'
          >
            Education
          </Link>
          <Link
            to='/tutorials'
            className='glass-nav-item'
            style={{
              padding: '8px 16px',
              color: 'rgba(255, 255, 255, 0.9)',
              textDecoration: 'none',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = 'rgba(255, 255, 255, 0.9)';
            }}
            title='Step-by-step guides for using simulation tools and understanding asteroid impact scenarios'
          >
            Tutorials
          </Link>
          <button
            onClick={scrollToAbout}
            className='glass-nav-item'
            style={{
              padding: '8px 16px',
              color: 'rgba(255, 255, 255, 0.9)',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = 'rgba(255, 255, 255, 0.9)';
            }}
            title='Discover the science and technology behind Meteor Madness planetary defense platform'
          >
            About
          </button>
          <Link
            to='/mission-control'
            className='glass-nav-item'
            style={{
              padding: '8px 16px',
              color: 'rgba(255, 255, 255, 0.9)',
              textDecoration: 'none',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = 'rgba(255, 255, 255, 0.9)';
            }}
            title='Access real-time asteroid tracking data and mission control dashboard with live telemetry'
          >
            Mission Control
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='relative min-h-screen flex items-center justify-center px-4'>
        <div className='text-center max-w-6xl mx-auto relative z-10'>
          {/* Enhanced Title with Better Typography */}
          <div className='mb-8'>
            <h1 
              className='font-orbitron font-bold text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight'
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 0 30px rgba(102, 126, 234, 0.5)',
                animation: 'glow 2s ease-in-out infinite alternate'
              }}
            >
              METEOR MADNESS
            </h1>
            <div className='h-1 w-48 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 mx-auto rounded-full mb-6 animate-pulse' />
            <p className='text-xl md:text-2xl text-white/90 font-medium max-w-3xl mx-auto leading-relaxed'>
              Experience cutting-edge asteroid impact simulation with real NASA data. 
              Explore planetary defense strategies and visualize cosmic threats in stunning detail.
            </p>
          </div>

          {/* Enhanced Action Buttons with Better Spacing */}
          <div className='flex flex-col sm:flex-row gap-6 justify-center items-center mb-16'>
            <Link 
              to='/simulation'
              className='group relative overflow-hidden'
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '18px 36px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '16px',
                color: 'white',
                fontSize: '18px',
                fontWeight: '700',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                minWidth: '280px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px) scale(1.02)';
                e.target.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.5)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.3)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              title='Launch comprehensive asteroid impact simulations with real-time physics modeling and NASA data integration'
            >
              <span className='mr-3 text-2xl'>🚀</span>
              Start Simulation
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000' />
            </Link>
            
            <button
              onClick={() => setShowAbout(!showAbout)}
              className='group relative overflow-hidden'
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '18px 36px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '16px',
                color: 'white',
                fontSize: '18px',
                fontWeight: '700',
                minWidth: '280px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px) scale(1.02)';
                e.target.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)';
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              title='Explore the scientific foundation, technology stack, and planetary defense capabilities of our asteroid impact simulation platform'
            >
              <span className='mr-3 text-2xl'>🌌</span>
              Discover More
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000' />
            </button>
          </div>

          {/* Enhanced Live Stats with Better Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto'>
            {[
              { value: '2,000+', label: 'Known NEOs Tracked', icon: '🛰️', delay: '0s' },
              { value: '99.9%', label: 'Detection Accuracy', icon: '🎯', delay: '0.2s' },
              { value: '24/7', label: 'Real-time Monitoring', icon: '⚡', delay: '0.4s' }
            ].map((stat, index) => (
              <div
                key={index}
                className='group relative overflow-hidden'
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  padding: '32px 24px',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  animationDelay: stat.delay
                }}
                className='animate-float hover:scale-105'
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.2)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                <div className='text-4xl mb-4 group-hover:scale-110 transition-transform duration-300'>
                  {stat.icon}
                </div>
                <div className='text-4xl font-bold text-white mb-3 font-orbitron'>
                  {stat.value}
                </div>
                <div className='text-lg font-semibold text-white/90'>
                  {stat.label}
                </div>
                <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-20' />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Ticker */}
      <div 
        className='fixed bottom-4 left-4 right-4 z-50 p-4'
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div className='flex items-center space-x-3'>
          <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse' />
          <div className='flex-1 overflow-hidden'>
            <p className='text-sm text-white/90 font-medium whitespace-nowrap animate-marquee'>
              🚀 {newsHeadlines[currentNewsIndex]}
            </p>
          </div>
        </div>
      </div>

      {/* About Section */}
      {showAbout && (
        <section
          id='about-section'
          className='min-h-screen flex items-center justify-center px-4 py-20'
        >
          <div className='max-w-6xl mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='font-orbitron font-bold text-4xl md:text-6xl text-white mb-6'>
                About Meteor Madness
              </h2>
              <div className='h-1 w-32 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full' />
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16'>
              <div 
                className='p-8'
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <h3 className='font-orbitron font-bold text-2xl text-white mb-4'>
                  🛡️ Planetary Defense
                </h3>
                <p className='text-white/80 leading-relaxed'>
                  Experience cutting-edge asteroid impact simulation technology
                  used by NASA's Planetary Defense Coordination Office. Our
                  platform provides real-time visualization of Near-Earth Object
                  trajectories and impact scenarios.
                </p>
              </div>

              <div 
                className='p-8'
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <h3 className='font-orbitron font-bold text-2xl text-white mb-4'>
                  🔬 Scientific Accuracy
                </h3>
                <p className='text-white/80 leading-relaxed'>
                  Built with authentic NASA data, our simulations incorporate
                  real physics models for atmospheric entry, impact dynamics,
                  and environmental effects. Every calculation is based on
                  peer-reviewed scientific research.
                </p>
              </div>

              <div 
                className='p-8'
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <h3 className='font-orbitron font-bold text-2xl text-white mb-4'>
                  🌍 Global Impact Assessment
                </h3>
                <p className='text-white/80 leading-relaxed'>
                  Analyze potential impact zones, blast radii, and environmental
                  consequences with our advanced modeling system. Understand the
                  full scope of asteroid threats to human civilization.
                </p>
              </div>

              <div 
                className='p-8'
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <h3 className='font-orbitron font-bold text-2xl text-white mb-4'>
                  🚀 Mission Planning
                </h3>
                <p className='text-white/80 leading-relaxed'>
                  Explore deflection strategies including kinetic impactors,
                  nuclear devices, and gravity tractors. Test different
                  intervention scenarios and their effectiveness against various
                  asteroid types.
                </p>
              </div>
            </div>

            <div className='text-center'>
              <Link 
                to='/simulation'
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                }}
                title='Start your planetary defense mission with comprehensive asteroid impact simulations, deflection strategies, and real-time threat assessment tools'
              >
                Begin Your Mission
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className='relative z-10 py-12 px-4'>
        <div className='max-w-6xl mx-auto'>
          <div 
            className='p-8'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left'>
              <div>
                <h4 className='font-orbitron font-bold text-white mb-4'>
                  Data Sources
                </h4>
                <div className='space-y-2 text-white/70 text-sm'>
                  <p>🛰️ NASA JPL Small-Body Database</p>
                  <p>🌍 NASA GIBS Earth Imagery</p>
                  <p>📊 CNEOS Impact Risk Assessment</p>
                </div>
              </div>

              <div>
                <h4 className='font-orbitron font-bold text-white mb-4'>
                  Technology
                </h4>
                <div className='space-y-2 text-white/70 text-sm'>
                  <p>⚛️ React & Three.js</p>
                  <p>🗺️ OpenLayers Mapping</p>
                  <p>📈 D3.js Visualization</p>
                </div>
              </div>

              <div>
                <h4 className='font-orbitron font-bold text-white mb-4'>
                  Open Source
                </h4>
                <div className='space-y-2 text-white/70 text-sm'>
                  <p>📖 MIT License</p>
                  <p>🔗 GitHub Repository</p>
                  <p>🤝 Community Driven</p>
                </div>
              </div>
            </div>

            <div className='border-t border-white/20 mt-8 pt-8 text-center'>
              <p className='text-white/60 text-sm'>
                © 2024 Meteor Madness. Built for NASA Space Apps Challenge.
                Powered by real NASA data and cutting-edge web technologies.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GlamorousLandingPage;
