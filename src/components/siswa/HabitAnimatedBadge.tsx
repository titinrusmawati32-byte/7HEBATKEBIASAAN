import React from 'react';

interface HabitAnimatedBadgeProps {
  habitId: number;
  isCompleted?: boolean;
  className?: string;
}

export const HabitAnimatedBadge: React.FC<HabitAnimatedBadgeProps> = ({
  habitId,
  isCompleted = false,
  className = 'w-16 h-16'
}) => {
  switch (habitId) {
    // 1. Bangun Pagi: Matahari Tersenyum Bersinar & Jam Weker Bergetar
    case 1:
      return (
        <div className={`relative flex items-center justify-center select-none ${className}`}>
          {/* Glowing Aura Ring */}
          <div className="absolute inset-0 rounded-2xl bg-amber-400/20 animate-pulse-ring pointer-events-none" />

          {/* Rotating Sun Rays */}
          <svg
            className="absolute inset-1 w-full h-full text-amber-400/70 animate-spin-slow pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
          >
            <path
              d="M50 8V18M50 82V92M8 50H18M82 50H92M20 20L28 28M72 72L80 80M20 80L28 72M72 28L80 20"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>

          {/* Sun Body & Face */}
          <div className="relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 shadow-md flex items-center justify-center animate-bounce-gentle">
            <svg className="w-8 h-8 text-amber-900" viewBox="0 0 24 24" fill="currentColor">
              {/* Eyes */}
              <circle cx="9" cy="11" r="1.3" />
              <circle cx="15" cy="11" r="1.3" />
              {/* Rosy Cheeks */}
              <ellipse cx="6.5" cy="13.5" rx="1.2" ry="0.8" fill="#f87171" opacity="0.8" />
              <ellipse cx="17.5" cy="13.5" rx="1.2" ry="0.8" fill="#f87171" opacity="0.8" />
              {/* Cheerful Smile */}
              <path
                d="M9 14.5C10 16 14 16 15 14.5"
                stroke="#78350f"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Little Alarm Clock Mini Badge */}
          <div className="absolute -bottom-1 -right-1 z-20 w-6 h-6 rounded-full bg-white border border-amber-300 shadow-xs flex items-center justify-center animate-wiggle">
            <span className="text-[11px] leading-none">⏰</span>
          </div>
        </div>
      );

    // 2. Beribadah & Bersyukur: Tangan Berdoa & Cahaya Bintang Berakhlak
    case 2:
      return (
        <div className={`relative flex items-center justify-center select-none ${className}`}>
          {/* Radiant Emerald Glow */}
          <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 animate-pulse-ring pointer-events-none" />

          {/* Floating Holy Star Sparkles */}
          <div className="absolute -top-1 -right-1 z-20 animate-float text-emerald-500 text-xs">
            ✨
          </div>

          {/* Main Card Icon Container */}
          <div className="relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 shadow-md flex items-center justify-center text-white animate-heart-pulse">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="rgba(255,255,255,0.25)" />
              <path d="M12 5v4M10 7h4" strokeWidth="2" />
            </svg>
          </div>

          {/* Little Grateful Hands Badge */}
          <div className="absolute -bottom-1 -left-1 z-20 w-6 h-6 rounded-full bg-white border border-emerald-300 shadow-xs flex items-center justify-center animate-bounce-gentle">
            <span className="text-[11px] leading-none">🤲</span>
          </div>
        </div>
      );

    // 3. Berolahraga: Pelari Enerjik & Gelombang Gerak Aktif
    case 3:
      return (
        <div className={`relative flex items-center justify-center select-none ${className}`}>
          {/* Energetic Blue Pulse */}
          <div className="absolute inset-0 rounded-2xl bg-sky-400/25 animate-pulse-ring pointer-events-none" />

          {/* Active Sports Container */}
          <div className="relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-500 to-cyan-400 shadow-md flex items-center justify-center text-white animate-bounce-gentle">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {/* Runner Body */}
              <circle cx="12" cy="5" r="2.2" fill="white" />
              <path d="M7 21l3-5 2 2 3-5" />
              <path d="M6 13l4-2 3 3 5-1" />
            </svg>
          </div>

          {/* Speed / Energy Spark Badge */}
          <div className="absolute -top-1 -right-1 z-20 w-6 h-6 rounded-full bg-white border border-sky-300 shadow-xs flex items-center justify-center animate-wiggle">
            <span className="text-[11px] leading-none">⚡</span>
          </div>

          {/* Little Ball */}
          <div className="absolute -bottom-1 -right-1 z-20 w-5 h-5 rounded-full bg-white border border-sky-300 shadow-xs flex items-center justify-center animate-spin-slow">
            <span className="text-[10px] leading-none">⚽</span>
          </div>
        </div>
      );

    // 4. Gemar Belajar: Buku Ajaib & Bintang Kecerdasan
    case 4:
      return (
        <div className={`relative flex items-center justify-center select-none ${className}`}>
          {/* Indigo Knowledge Ring */}
          <div className="absolute inset-0 rounded-2xl bg-indigo-400/20 animate-pulse-ring pointer-events-none" />

          {/* Magic Book Container */}
          <div className="relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-400 shadow-md flex items-center justify-center text-white animate-float-slow">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" fill="rgba(255,255,255,0.2)" />
              <path d="M6 6h10M6 10h10M6 14h6" strokeWidth="1.8" />
            </svg>
          </div>

          {/* Glowing Idea Bulb */}
          <div className="absolute -top-1.5 -right-1 z-20 w-6 h-6 rounded-full bg-amber-100 border border-amber-300 shadow-xs flex items-center justify-center animate-wiggle">
            <span className="text-[11px] leading-none">💡</span>
          </div>

          {/* Mini Graduation Cap */}
          <div className="absolute -bottom-1 -left-1 z-20 w-5 h-5 rounded-full bg-white border border-indigo-300 shadow-xs flex items-center justify-center">
            <span className="text-[10px] leading-none">🎓</span>
          </div>
        </div>
      );

    // 5. Makan Sehat & Bergizi: Apel Ceria & Buah Bergizi
    case 5:
      return (
        <div className={`relative flex items-center justify-center select-none ${className}`}>
          {/* Rose Nutrition Pulse */}
          <div className="absolute inset-0 rounded-2xl bg-rose-400/20 animate-pulse-ring pointer-events-none" />

          {/* Bouncing Juicy Apple */}
          <div className="relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-rose-400 shadow-md flex items-center justify-center text-white animate-bounce-gentle">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              {/* Apple Body */}
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          </div>

          {/* Fresh Milk / Banana Badge */}
          <div className="absolute -top-1 -right-1 z-20 w-6 h-6 rounded-full bg-white border border-rose-300 shadow-xs flex items-center justify-center animate-wiggle">
            <span className="text-[11px] leading-none">🥦</span>
          </div>

          {/* Milk / Nutrition */}
          <div className="absolute -bottom-1 -left-1 z-20 w-5 h-5 rounded-full bg-white border border-rose-300 shadow-xs flex items-center justify-center">
            <span className="text-[10px] leading-none">🥛</span>
          </div>
        </div>
      );

    // 6. Membantu Orang Tua & Sesama: Tangan Tolong-Menolong & Hati Berbagi
    case 6:
      return (
        <div className={`relative flex items-center justify-center select-none ${className}`}>
          {/* Violet Caring Glow */}
          <div className="absolute inset-0 rounded-2xl bg-violet-400/20 animate-pulse-ring pointer-events-none" />

          {/* Helping Hands Container */}
          <div className="relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-500 to-fuchsia-400 shadow-md flex items-center justify-center text-white animate-float">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
              <path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.8L15 13" />
              <path d="M2 13h4" />
            </svg>
          </div>

          {/* Floating Warm Heart */}
          <div className="absolute -top-1.5 -right-1 z-20 w-6 h-6 rounded-full bg-rose-100 border border-rose-300 shadow-xs flex items-center justify-center animate-heart-pulse">
            <span className="text-[11px] leading-none">💖</span>
          </div>

          {/* House / Family Icon */}
          <div className="absolute -bottom-1 -left-1 z-20 w-5 h-5 rounded-full bg-white border border-violet-300 shadow-xs flex items-center justify-center">
            <span className="text-[10px] leading-none">🏡</span>
          </div>
        </div>
      );

    // 7. Tidur Tepat Waktu: Bulan Sabit Nyaman & Zzz Melayang
    case 7:
    default:
      return (
        <div className={`relative flex items-center justify-center select-none ${className}`}>
          {/* Night Sky Cyan Ring */}
          <div className="absolute inset-0 rounded-2xl bg-cyan-400/20 animate-pulse-ring pointer-events-none" />

          {/* Crescent Moon Container */}
          <div className="relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-slate-800 via-indigo-900 to-cyan-600 shadow-md flex items-center justify-center text-amber-300 animate-float-slow">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
            </svg>
          </div>

          {/* Drifting Zzz Animation */}
          <div className="absolute -top-2 right-0 z-20 font-black text-cyan-300 text-xs tracking-tighter animate-zzz select-none pointer-events-none">
            Zzz
          </div>

          {/* Twinkling Night Star */}
          <div className="absolute -bottom-1 -left-1 z-20 w-5 h-5 rounded-full bg-indigo-950 border border-cyan-400/60 shadow-xs flex items-center justify-center">
            <span className="text-[10px] leading-none text-amber-300 animate-wiggle">⭐</span>
          </div>
        </div>
      );
  }
};
