export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#fff0f6',100:'#ffe3ef',200:'#ffc6e0',300:'#ff9abe',400:'#ff5f99',500:'#ff2d73',600:'#f00055',700:'#cc0049',800:'#a8003c',900:'#8a0033' },
        neon: { blue:'#00d4ff', purple:'#8b5cf6', pink:'#ff2d73', green:'#00ff88', yellow:'#ffd700', orange:'#ff6b35' },
        dark: { 900:'#050508', 800:'#0a0a12', 700:'#0f0f1a', 600:'#14141f', 500:'#1a1a2e', 400:'#16213e', 300:'#0f3460', 200:'#1e2040' }
      },
      fontFamily: {
        gaming: ['"Orbitron"', 'monospace'],
        display: ['"Rajdhani"', 'sans-serif'],
        body: ['"Exo 2"', 'sans-serif']
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 3s linear infinite',
        'particle': 'particle 10s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite'
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-20px)' } },
        glow: { from: { textShadow: '0 0 10px #ff2d73, 0 0 20px #ff2d73' }, to: { textShadow: '0 0 20px #ff2d73, 0 0 40px #ff2d73, 0 0 60px #ff2d73' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 20px rgba(255,45,115,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(255,45,115,0.8), 0 0 80px rgba(255,45,115,0.4)' } }
      },
      backgroundImage: {
        'gaming-gradient': 'linear-gradient(135deg, #050508 0%, #0a0a12 25%, #0f0f1a 50%, #14141f 100%)',
        'neon-gradient': 'linear-gradient(90deg, #ff2d73, #8b5cf6, #00d4ff)',
        'card-gradient': 'linear-gradient(145deg, rgba(255,45,115,0.1), rgba(139,92,246,0.05))',
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)'
      },
      boxShadow: {
        'neon-pink': '0 0 20px rgba(255,45,115,0.5), 0 0 40px rgba(255,45,115,0.2)',
        'neon-blue': '0 0 20px rgba(0,212,255,0.5), 0 0 40px rgba(0,212,255,0.2)',
        'neon-purple': '0 0 20px rgba(139,92,246,0.5), 0 0 40px rgba(139,92,246,0.2)',
        'card': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
      }
    }
  },
  plugins: []
}
