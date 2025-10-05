import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/design-guide.css';
import './LandingPage.css';

const LandingPage = () => {
  const canvasRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    // Initialize Three.js meteor animations
    const initMeteorAnimations = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      // Simple canvas-based meteor animation
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const meteors = [];
      const meteorCount = 15;

      // Create meteor particles
      for (let i = 0; i < meteorCount; i++) {
        meteors.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.3,
          speed: 2 + Math.random() * 3,
          length: 30 + Math.random() * 50,
          size: 1 + Math.random() * 2,
          opacity: 0.3 + Math.random() * 0.7,
          color: `hsl(${200 + Math.random() * 40}, 100%, 80%)`,
        });
      }

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw stars
        for (let i = 0; i < 100; i++) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8})`;
          ctx.fillRect(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            1,
            1
          );
        }

        // Draw meteors
        meteors.forEach(meteor => {
          ctx.beginPath();
          ctx.moveTo(meteor.x, meteor.y);
          ctx.lineTo(meteor.x - meteor.length * 0.8, meteor.y + meteor.length);
          ctx.strokeStyle = `${meteor.color}${Math.floor(meteor.opacity * 255)
            .toString(16)
            .padStart(2, '0')}`;
          ctx.lineWidth = meteor.size;
          ctx.stroke();

          // Update meteor position
          meteor.x += meteor.speed;
          meteor.y += meteor.speed * 0.5;

          // Reset meteor when it goes off screen
          if (meteor.x > canvas.width + 100 || meteor.y > canvas.height + 100) {
            meteor.x = -50;
            meteor.y = Math.random() * canvas.height * 0.3;
            meteor.speed = 2 + Math.random() * 3;
          }
        });

        requestAnimationFrame(animate);
      };

      animate();

      // Handle window resize
      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    };

    initMeteorAnimations();
  }, []);

  return (
    <div className='cosmic-landing-container'>
      {/* Cosmic Background Video */}
      <div className='cosmic-background'>
        <video
          autoPlay
          muted
          loop
          playsInline
          className='background-video'
          onLoadedData={() => setIsVideoLoaded(true)}
          poster='/assets/cosmic-poster.jpg'
        >
          <source src='/assets/cosmic-background.mp4' type='video/mp4' />
          <source src='/assets/cosmic-background.webm' type='video/webm' />
        </video>

        {/* Meteor Canvas Animation */}
        <canvas
          ref={canvasRef}
          className='meteor-canvas'
          style={{ opacity: isVideoLoaded ? 1 : 0 }}
        />

        {/* Overlay Gradient */}
        <div className='cosmic-overlay' />
      </div>

      {/* Main Content */}
      <div className='cosmic-content'>
        <header className='cosmic-header'>
          <h1 className='cosmic-title glitch-text' data-text='METEOR MADNESS'>
            METEOR MADNESS
          </h1>
          <h2 className='cosmic-subtitle pulse-text'>
            NASA Advanced Asteroid Impact Simulator
          </h2>
        </header>

        <main className='cosmic-main'>
          <div className='cta-buttons'>
            <Link
              to='/simulation'
              className='cta-btn primary cosmic-glow enhanced-btn enhanced-focus enhanced-glow'
              title='Launch advanced asteroid impact simulation with real NASA data and physics modeling'
            >
              <span className='btn-icon enhanced-icon'>🚀</span>
              Start Simulation
              <div className='btn-sparkle' />
            </Link>

            <button
              className='cta-btn secondary cosmic-glow enhanced-btn enhanced-focus enhanced-pulse'
              title='Discover more about asteroid science, planetary defense, and simulation capabilities'
            >
              <span className='btn-icon enhanced-icon'>🌌</span>
              Learn More
              <div className='btn-sparkle' />
            </button>
          </div>

          <div className='cosmic-features'>
            <div className='feature-card glow-card enhanced-card enhanced-focus'>
              <div className='feature-icon enhanced-icon'>☄️</div>
              <h3>Real-time Impact Simulation</h3>
              <p>Advanced physics-based asteroid impact modeling</p>
            </div>

            <div className='feature-card glow-card enhanced-card enhanced-focus'>
              <div className='feature-icon enhanced-icon'>🌍</div>
              <h3>Global Impact Analysis</h3>
              <p>Comprehensive Earth impact visualization</p>
            </div>

            <div className='feature-card glow-card enhanced-card enhanced-focus'>
              <div className='feature-icon enhanced-icon'>📊</div>
              <h3>Scientific Data</h3>
              <p>NASA-approved scientific models and data</p>
            </div>
          </div>
        </main>

        <footer className='cosmic-footer'>
          <div className='footer-content'>
            <div className='nasa-badge'>
              <span className='nasa-text'>NASA</span>
              <span className='partner-text'>Official Partner</span>
            </div>

            <div className='footer-links'>
              <a
                href='https://www.nasa.gov'
                target='_blank'
                rel='noopener noreferrer'
              >
                NASA.gov
              </a>
              <a
                href='https://cneos.jpl.nasa.gov'
                target='_blank'
                rel='noopener noreferrer'
              >
                CNEOS
              </a>
              <a
                href='https://www.usgs.gov'
                target='_blank'
                rel='noopener noreferrer'
              >
                USGS
              </a>
            </div>

            <div className='credits'>
              <p>Developed with ❤️ for planetary defense research</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Parallax Elements */}
      <div className='parallax-stars' />
      <div className='parallax-nebula' />

      {/* Dynamic Lighting */}
      <div className='dynamic-lighting'>
        <div className='light-source' />
        <div className='light-source' />
        <div className='light-source' />
      </div>
    </div>
  );
};

export default LandingPage;
