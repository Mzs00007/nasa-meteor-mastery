import React, { useEffect, useRef, useState } from 'react';

const AdvancedParticleSystem = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let shootingStars = [];
    let nebulaClouds = [];

    // Resize canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle class for stars
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.8 + 0.2;
        this.twinkleSpeed = Math.random() * 0.02 + 0.01;
        this.twinklePhase = Math.random() * Math.PI * 2;
        this.color = this.getRandomStarColor();
      }

      getRandomStarColor() {
        const colors = [
          'rgba(255, 255, 255, ',
          'rgba(173, 216, 230, ',
          'rgba(255, 182, 193, ',
          'rgba(255, 255, 224, ',
          'rgba(255, 218, 185, '
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.twinklePhase += this.twinkleSpeed;
        this.opacity = 0.3 + Math.sin(this.twinklePhase) * 0.5;

        // Wrap around screen
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color + this.opacity + ')';
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color + '0.8)';
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add cross sparkle effect for larger stars
        if (this.size > 1.5) {
          ctx.strokeStyle = this.color + (this.opacity * 0.6) + ')';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(this.x - this.size * 2, this.y);
          ctx.lineTo(this.x + this.size * 2, this.y);
          ctx.moveTo(this.x, this.y - this.size * 2);
          ctx.lineTo(this.x, this.y + this.size * 2);
          ctx.stroke();
        }
        
        ctx.restore();
      }
    }

    // Shooting star class
    class ShootingStar {
      constructor() {
        this.reset();
        this.life = Math.random() * 100 + 100;
        this.maxLife = this.life;
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height * 0.3;
        this.speedX = Math.random() * 8 + 4;
        this.speedY = Math.random() * 4 + 2;
        this.size = Math.random() * 2 + 1;
        this.life = Math.random() * 100 + 100;
        this.maxLife = this.life;
        this.trail = [];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;

        // Add to trail
        this.trail.push({ x: this.x, y: this.y, life: 20 });
        if (this.trail.length > 15) {
          this.trail.shift();
        }

        // Update trail
        this.trail.forEach(point => point.life--);
        this.trail = this.trail.filter(point => point.life > 0);

        if (this.life <= 0 || this.x > canvas.width + 100 || this.y > canvas.height + 100) {
          this.reset();
        }
      }

      draw() {
        const opacity = this.life / this.maxLife;
        
        // Draw trail
        this.trail.forEach((point, index) => {
          const trailOpacity = (point.life / 20) * opacity * (index / this.trail.length);
          ctx.save();
          ctx.globalAlpha = trailOpacity;
          ctx.fillStyle = `rgba(255, 255, 255, ${trailOpacity})`;
          ctx.shadowBlur = 5;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(point.x, point.y, this.size * (index / this.trail.length), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Draw main star
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Nebula cloud class
    class NebulaCloud {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 200 + 100;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.speedY = (Math.random() - 0.5) * 0.2;
        this.opacity = Math.random() * 0.1 + 0.05;
        this.color = this.getRandomNebulaColor();
        this.pulseSpeed = Math.random() * 0.01 + 0.005;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      getRandomNebulaColor() {
        const colors = [
          'rgba(138, 43, 226, ',  // Purple
          'rgba(75, 0, 130, ',    // Indigo
          'rgba(255, 20, 147, ',  // Deep pink
          'rgba(0, 191, 255, ',   // Deep sky blue
          'rgba(255, 69, 0, '     // Red orange
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulsePhase += this.pulseSpeed;
        
        // Wrap around
        if (this.x < -this.size) this.x = canvas.width + this.size;
        if (this.x > canvas.width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = canvas.height + this.size;
        if (this.y > canvas.height + this.size) this.y = -this.size;
      }

      draw() {
        const pulseOpacity = this.opacity + Math.sin(this.pulsePhase) * 0.02;
        
        ctx.save();
        ctx.globalAlpha = pulseOpacity;
        
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size
        );
        gradient.addColorStop(0, this.color + pulseOpacity + ')');
        gradient.addColorStop(0.5, this.color + (pulseOpacity * 0.5) + ')');
        gradient.addColorStop(1, this.color + '0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Initialize particles
    for (let i = 0; i < 200; i++) {
      particles.push(new Particle());
    }

    for (let i = 0; i < 3; i++) {
      shootingStars.push(new ShootingStar());
    }

    for (let i = 0; i < 5; i++) {
      nebulaClouds.push(new NebulaCloud());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw nebula clouds first (background)
      nebulaClouds.forEach(cloud => {
        cloud.update();
        cloud.draw();
      });

      // Draw particles (stars)
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw shooting stars (foreground)
      shootingStars.forEach(star => {
        star.update();
        star.draw();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -5,
        pointerEvents: 'none',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease'
      }}
    />
  );
};

export default AdvancedParticleSystem;