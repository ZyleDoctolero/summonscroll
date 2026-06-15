import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SoulResonanceTimerProps {
  monsterId: string | null;
  monsterName?: string;
  durationMinutes?: number;
  onComplete: () => void;
  onFail: () => void;
}

export function SoulResonanceTimer({
  monsterId,
  monsterName = 'Unknown Entity',
  durationMinutes = 25,
  onComplete,
  onFail
}: SoulResonanceTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isFailed, setIsFailed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isActive && document.hidden) {
        // The Master has broken focus
        setIsFailed(true);
        setIsActive(false);
        if (timerRef.current) clearInterval(timerRef.current);
        
        toast({
          title: "RESONANCE SHATTERED",
          description: "Your focus wavered. The soul connection has broken.",
          variant: "destructive",
        });
        
        onFail();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, onFail, toast]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      toast({
        title: "RESONANCE COMPLETE",
        description: `You have perfectly synchronized with ${monsterName}. Buff activated.`,
      });
      
      onComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, monsterName, onComplete, toast]);

  const toggleTimer = () => {
    if (!monsterId) {
      toast({
        title: "No Soul Selected",
        description: "You must tether a soul before initiating Resonance.",
        variant: "destructive",
      });
      return;
    }

    if (isFailed) {
      // Reset after a failure
      setTimeLeft(durationMinutes * 60);
      setIsFailed(false);
    }

    setIsActive(!isActive);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = 1 - (timeLeft / (durationMinutes * 60));

  return (
    <div className={`p-6 rounded-lg system-panel relative overflow-hidden transition-colors ${
      isFailed ? 'border-red-500 shadow-[0_0_20px_rgba(255,0,60,0.3)]' : 
      isActive ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)]' : 
      'border-slate-800'
    }`}>
      {/* Background Progress Bar */}
      <motion.div 
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-600 to-cyan-400"
        initial={{ width: '0%' }}
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 1, ease: 'linear' }}
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        <h3 className="text-sm font-mono tracking-widest text-slate-400 uppercase">
          Soul Resonance
        </h3>
        
        <div className={`text-5xl font-black font-mono tracking-wider ${
          isFailed ? 'text-red-500' : 
          isActive ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 
          'text-slate-300'
        }`}>
          {formatTime(timeLeft)}
        </div>

        <div className="text-xs font-mono text-slate-500 h-4">
          {monsterId ? `Tethered: [${monsterName}]` : 'Awaiting Soul Tether...'}
        </div>

        <Button
          onClick={toggleTimer}
          variant={isActive ? "destructive" : "default"}
          className={`w-full font-mono tracking-widest ${
            !isActive && !isFailed ? 'bg-cyan-950 text-cyan-400 hover:bg-cyan-900 border border-cyan-800' : ''
          }`}
        >
          {isActive ? (
            <><Square className="w-4 h-4 mr-2" /> SEVER CONNECTION</>
          ) : isFailed ? (
            <><AlertTriangle className="w-4 h-4 mr-2" /> PURGE CORRUPTION (RESET)</>
          ) : (
            <><Play className="w-4 h-4 mr-2" /> INITIATE RESONANCE</>
          )}
        </Button>
      </div>
    </div>
  );
}
