import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';
import AdvancedParticleSystem from './ui/AdvancedParticleSystem';
import EnhancedHeroSection from './ui/EnhancedHeroSection';
import EnhancedNewsTicker from './EnhancedNewsTicker';
import '../styles/glassmorphic.css';
import '../styles/enhanced-animations.css';

const GlamorousLandingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    // Stagger loading animations
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => {
      clearTimeout(timer);
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
      
      {/* Advanced Particle System */}
      <AdvancedParticleSystem />

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
          <Link
            to='/analytics-dashboard'
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
            title='Advanced analytics center with real-time monitoring, threat assessment, and mission statistics'
          >
            Analytics
          </Link>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <div className="pt-20 pb-16">
        <EnhancedHeroSection />
      </div>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-orbitron font-bold text-4xl md:text-5xl text-white mb-6">
              Advanced Simulation Features
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🌍",
                title: "Real-Time Earth Visualization",
                description: "Interactive 3D Earth model with live satellite data and impact zone visualization"
              },
              {
                icon: "🛰️",
                title: "NASA Data Integration",
                description: "Direct access to NASA's Near-Earth Object database with real-time tracking"
              },
              {
                icon: "💥",
                title: "Impact Physics Engine",
                description: "Advanced physics calculations for atmospheric entry and impact dynamics"
              },
              {
                icon: "📊",
                title: "Threat Assessment",
                description: "Comprehensive risk analysis with damage estimation and evacuation planning"
              },
              {
                icon: "🚀",
                title: "Deflection Strategies",
                description: "Simulate various planetary defense missions and intervention scenarios"
              },
              {
                icon: "🌌",
                title: "Cosmic Environment",
                description: "Immersive space environment with realistic asteroid fields and trajectories"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl transition-all duration-500 hover:scale-105 cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="font-orbitron font-bold text-xl text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/80 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Live Space News */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <EnhancedNewsTicker />
        </div>
      </section>

      {/* About Section */}
      {showAbout && (
        <section
          id='about-section'
          className='relative z-10 min-h-screen flex items-center justify-center px-4 py-16 mt-8 mb-8'
        >
          <div className='max-w-6xl mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='font-orbitron font-bold text-4xl md:text-6xl text-white mb-6'>
                About Meteor Madness
              </h2>
              <div className='h-1 w-32 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full' />
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24'>
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

      {/* Call to Action Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div 
            className="p-12 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(252, 61, 33, 0.1) 0%, rgba(11, 61, 145, 0.1) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h2 className="font-orbitron font-bold text-4xl md:text-5xl text-white mb-6">
              Ready to Defend Earth?
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Join the planetary defense mission and experience the most advanced asteroid impact simulation ever created. 
              Test your skills against cosmic threats and help protect our planet.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/simulation"
                className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl text-white font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(252, 61, 33, 0.9), rgba(255, 69, 0, 0.9))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <span className="text-2xl">🚀</span>
                  Launch Simulation
                </span>
              </Link>
              <Link
                to="/education"
                className="group relative px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <span className="text-2xl">📚</span>
                  Learn More
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='relative z-10 py-12 px-4 mt-16'>
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
