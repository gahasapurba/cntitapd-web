import React, { useEffect, useRef } from 'react';

export default function StarfieldBackground({ warpSpeed = false }) {
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

    // Generate stars
    const numStars = 280;
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * width - width / 2,
      y: Math.random() * height - height / 2,
      z: Math.random() * width,
      size: Math.random() * 1.5 + 0.5,
      color: ['#ffffff', '#38bdf8', '#c084fc', '#fef08a', '#60a5fa'][
        Math.floor(Math.random() * 5)
      ],
      twinkle: Math.random() * Math.PI,
    }));

    // Generate glowing nebula clouds
    const nebulas = Array.from({ length: 4 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 250 + 150,
      color: [
        'rgba(0, 61, 121, 0.18)',
        'rgba(56, 189, 248, 0.08)',
        'rgba(192, 132, 252, 0.09)',
        'rgba(255, 184, 0, 0.05)',
      ][Math.floor(Math.random() * 4)],
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: (Math.random() - 0.5) * 0.2,
    }));

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX - width / 2) * 0.05;
      mouseY = (e.clientY - height / 2) * 0.05;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      // Clear with slight trailing blur on warp
      ctx.fillStyle = warpSpeed ? 'rgba(4, 9, 20, 0.25)' : 'rgba(4, 9, 20, 1)';
      ctx.fillRect(0, 0, width, height);

      // Draw Nebulas
      nebulas.forEach((neb) => {
        neb.x += neb.speedX;
        neb.y += neb.speedY;

        if (neb.x < -100) neb.x = width + 100;
        if (neb.x > width + 100) neb.x = -100;
        if (neb.y < -100) neb.y = height + 100;
        if (neb.y > height + 100) neb.y = -100;

        const grad = ctx.createRadialGradient(
          neb.x,
          neb.y,
          0,
          neb.x,
          neb.y,
          neb.radius
        );
        grad.addColorStop(0, neb.color);
        grad.addColorStop(1, 'rgba(4, 9, 20, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(neb.x, neb.y, neb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Stars with 3D perspective projection
      const speed = warpSpeed ? 22 : 0.8;
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
          const alpha = Math.min(1, (1 - star.z / width) * (0.6 + 0.4 * Math.sin(star.twinkle)));
          const size = Math.max(0.5, star.size * k);

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = star.color;

          if (warpSpeed) {
            // Draw star streak during warp speed
            const prevK = 250 / (star.z + speed * 2.5);
            const prevPx = star.x * prevK + centerX;
            const prevPy = star.y * prevK + centerY;

            ctx.strokeStyle = star.color;
            ctx.lineWidth = size;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(prevPx, prevPy);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();

            // Glow core for larger stars
            if (size > 1.8) {
              ctx.shadowColor = star.color;
              ctx.shadowBlur = 8;
              ctx.fill();
            }
          }
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
  }, [warpSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
    />
  );
}
