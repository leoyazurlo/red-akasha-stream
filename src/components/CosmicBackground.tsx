export const CosmicBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Nebulosa dorada de fondo */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-background">
        <div className="absolute bottom-0 left-0 right-0 h-[60vh] bg-gradient-to-t from-amber-950/20 via-amber-900/10 to-transparent opacity-60" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-yellow-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>
      
      {/* Estrellas */}
      <div className="stars-container absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="star absolute rounded-full bg-amber-200/80"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              animation: `twinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 3}s`,
              boxShadow: '0 0 4px rgba(251, 191, 36, 0.8)',
            }}
          />
        ))}
      </div>

      {/* Estrellas grandes brillantes */}
      <div className="stars-bright absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="star-bright absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `pulse-glow ${Math.random() * 4 + 3}s infinite ${Math.random() * 2}s`,
            }}
          >
            <div 
              className="w-1 h-1 bg-amber-400 rounded-full"
              style={{
                boxShadow: '0 0 8px 2px rgba(251, 191, 36, 0.8), 0 0 16px 4px rgba(251, 191, 36, 0.4)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Polvo cósmico dorado */}
      <div className="absolute bottom-0 left-0 right-0 h-[40vh] opacity-30">
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at bottom, rgba(251, 191, 36, 0.15) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 0.6; 
            transform: scale(1);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.5);
          }
        }
      `}</style>
    </div>
  );
};