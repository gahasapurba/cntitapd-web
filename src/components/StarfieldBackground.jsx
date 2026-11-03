import React, { useEffect, useRef } from 'react';

export default function StarfieldBackground({ theme = 'dark' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const numStars = theme === 'dark' ? 180 : 80;
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * width - width / 2,
      y: Math.random() * height - height / 2,
      z: Math.random() * width,
      size: Math.random() * 1.4 + 0.6,
      color: theme === 'dark' 
        ? ['#ffffff', '#38bdf8', '#c084fc', '#fef08a', '#60a5fa'][Math.floor(Math.random() * 5)]
        : ['#00529b', '#3b82f6', '#0284c7', '#d97706', '#9333ea'][Math.floor(Math.random() * 5)],
      twinkle: Math.random() * Math.PI,
    }));

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX - width / 2) * 0.03;
      mouseY = (e.clientY - height / 2) * 0.03;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const speed = 0.5;
      const centerX = width / 2 + mouseX;
      const centerY = height / 2 + mouseY;

      stars.forEach((star) => {
        star.z -= speed;
        if (star.z <= 0) {
          star.z = width;
          star.x = Math.random() * width - width / 2;
          star.y = Math.random() * height - height / 2;
        }

        const k = 250 / star.z;
        const px = star.x * k + centerX;
        const py = star.y * k + centerY;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          star.twinkle += 0.03;
          const alpha = Math.min(theme === 'dark' ? 0.7 : 0.35, (1 - star.z / width) * (0.5 + 0.3 * Math.sin(star.twinkle)));
          const size = Math.max(0.5, star.size * k);

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
