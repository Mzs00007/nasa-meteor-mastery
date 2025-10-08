import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const EnhancedHeroSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const heroRef = useRef(null);
  const titleRef = useRef(null);

  const dynamicWords = ['MASTERY', 'DEFENSE', 'SCIENCE', 'DISCOVERY'];
  const stats = [
    { value: '2,000+', label: 'Known NEOs Tracked', icon: '🛰️', color: 'from-blue-400 to-cyan-400' },
    { value: '99.9%', label: 'Detection Accuracy', icon: '🎯', color: 'from-green-400 to-emerald-400' },
    { value: '24/7', label: 'Real-time Monitoring', icon: '⚡', color: 'from-yellow-400 to-orange-400' }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    
    // Cycle through dynamic words
    const wordTimer = setInterval(() => {
      setCurrentWordIndex(prev => (prev + 1) % dynamicWords.length);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(wordTimer);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height
        });
      }
    };

    const heroElement = heroRef.current;
    if (heroElement) {
      heroElement.addEventListener('mousemove', handleMouseMove);
      return () => heroElement.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const parallaxStyle = {
    transform: `translate(${mousePosition.x * 20 - 10}px, ${mousePosition.y * 20 - 10}px)`
  };

  return (
    <section 
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
      style={{
        background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, 
          rgba(252, 61, 33, 0.1) 0%, 
          rgba(11, 61, 145, 0.05) 50%, 
          transparent 100%)`
      }}
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-pulse"
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${
                ['rgba(252, 61, 33, 0.3)', 'rgba(11, 61, 145, 0.3)', 'rgba(75, 181, 67, 0.3)'][i % 3]
              } 0%, transparent 70%)`,
              animation: `float ${5 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="text-center max-w-7xl mx-auto relative z-10" style={parallaxStyle}>
        {/* Enhanced Title */}
        <div className="mb-20">
          <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 
              ref={titleRef}
              className="font-orbitron font-black text-6xl md:text-8xl lg:text-[10rem] xl:text-[12rem] mb-4 leading-none text-center"
              style={{
                background: 'linear-gradient(135deg, #fc3d21 0%, #ffffff 25%, #0b3d91 50%, #4bb543 75%, #fc3d21 100%)',
                backgroundSize: '400% 400%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradientShift 4s ease infinite, textGlow 2s ease-in-out infinite alternate',
                textShadow: '0 0 40px rgba(252, 61, 33, 0.5), 0 0 80px rgba(11, 61, 145, 0.3)',
                filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))'
              }}
            >
              METEOR MADNESS
            </h1>
          </div>

          {/* Subtitle with Typewriter Effect */}
          <div className={`transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 font-light max-w-4xl mx-auto leading-relaxed mb-16">
              Experience cutting-edge asteroid impact simulation with{' '}
              <span className="font-semibold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                real NASA data
              </span>
              . Explore planetary defense strategies and visualize cosmic threats in stunning detail.
            </p>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-8 justify-center items-center mb-24 transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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
              Start Simulation
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          <button
            onClick={() => document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="group relative px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <span className="relative z-10 flex items-center gap-3">
              <span className="text-2xl">🌌</span>
              Discover More
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>
        </div>

        {/* Animated Statistics Cards */}
        <div id="stats-section" className={`grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-3xl transition-all duration-500 hover:scale-105 cursor-pointer overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                animationDelay: `${index * 0.2}s`
              }}
            >
              {/* Animated Background */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
              />
              
              {/* Icon with Pulse Effect */}
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300 relative">
                <span className="relative z-10">{stat.icon}</span>
                <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              </div>
              
              {/* Value with Counter Animation */}
              <div className={`text-5xl md:text-6xl font-black mb-4 font-orbitron bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              
              {/* Label */}
              <div className="text-lg font-semibold text-white/90 leading-tight">
                {stat.label}
              </div>
              
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} blur-xl opacity-30`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes textGlow {
          0% { filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3)); }
          100% { filter: drop-shadow(0 0 40px rgba(252, 61, 33, 0.6)) drop-shadow(0 0 60px rgba(11, 61, 145, 0.4)); }
        }
      `}</style>
    </section>
  );
};

export default EnhancedHeroSection;