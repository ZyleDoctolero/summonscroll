import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const Route = createFileRoute('/_authenticated/penalty-zone')({
  component: PenaltyZone,
});

function PenaltyZone() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isChecked, setIsChecked] = useState(false);

  // Fetch the penalty task
  const { data: profile } = useQuery({
    queryKey: ['profile-penalty'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('in_penalty_zone, penalty_zone_task')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Redirect out if they aren't actually in the penalty zone
  useEffect(() => {
    if (profile && !profile.in_penalty_zone) {
      navigate({ to: '/' });
    }
  }, [profile, navigate]);

  // Audio hum effect
  useEffect(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(40, ctx.currentTime); // Low hum
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      
      return () => {
        osc.stop();
        ctx.close();
      };
    } catch (e) {
      console.error("Audio Context failed", e);
    }
  }, []);

  const escapeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('escape_penalty_zone');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: "SYSTEM OVERRIDE",
        description: "You have survived the Penalty Zone.",
      });
      navigate({ to: '/' });
    }
  });

  const handleEscape = () => {
    if (!isChecked) {
      toast({
        title: "ACCESS DENIED",
        description: "You must complete the survival task first.",
        variant: "destructive",
      });
      return;
    }
    escapeMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col items-center justify-center p-4">
      {/* CRT Scanline and Glitch Overlays */}
      <div className="absolute inset-0 scanlines opacity-50 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-red-900/10 pointer-events-none animate-pulse" />
      
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="border border-red-500/50 bg-black/80 backdrop-blur-md shadow-[0_0_50px_rgba(255,0,60,0.2)] p-8 rounded-sm">
          
          <div className="flex flex-col items-center text-center space-y-6">
            <motion.div
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 0.1, ease: 'linear' }}
            >
              <ShieldAlert className="w-20 h-20 text-red-600 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]" />
            </motion.div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-widest text-red-500 uppercase font-mono">
                Penalty Zone
              </h1>
              <p className="text-red-400/80 font-mono text-sm tracking-widest">
                DAILY QUOTAS FAILED. DATABASE LOCKED.
              </p>
            </div>

            <div className="w-full bg-red-950/30 border border-red-900/50 p-6 text-left space-y-4">
              <div className="flex items-center space-x-2 text-red-500 font-mono text-sm">
                <Terminal className="w-4 h-4" />
                <span>SURVIVAL_TASK.EXE</span>
              </div>
              
              <div className="text-xl font-bold text-white font-mono">
                {profile?.penalty_zone_task || "AWAITING SYSTEM DIRECTIVE..."}
              </div>

              <div className="pt-4 flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  id="task-complete"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="w-5 h-5 accent-red-600 bg-black border-red-500 rounded-none cursor-pointer"
                />
                <label htmlFor="task-complete" className="text-red-300 font-mono text-sm cursor-pointer select-none">
                  I SWEAR I HAVE COMPLETED THIS TASK IN REAL LIFE.
                </label>
              </div>
            </div>

            <Button
              onClick={handleEscape}
              disabled={escapeMutation.isPending}
              className={`w-full font-mono font-bold tracking-widest uppercase transition-all duration-300 ${
                isChecked 
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(255,0,0,0.5)]' 
                  : 'bg-black border border-red-900 text-red-900 cursor-not-allowed'
              }`}
            >
              {escapeMutation.isPending ? 'UPLOADING...' : 'INITIATE ESCAPE SEQUENCE'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
