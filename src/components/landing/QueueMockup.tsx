export function QueueMockup() {
  return (
    <div className="relative w-full max-w-[500px] h-[550px] mx-auto perspective-1000">
      {/* Background Admin Card (Offset Right & Back) */}
      <div 
        className="absolute right-0 top-12 w-[85%] bg-surface rounded-2xl premium-shadow border border-border p-5 transform rotate-y-[-5deg] rotate-x-[5deg] translate-z-[-20px] animate-float-delayed"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 w-24 bg-muted rounded-full" />
          <div className="h-4 w-12 bg-muted rounded-full" />
        </div>
        
        <div className="space-y-3">
          {/* Row 1 */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                A12
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-20 bg-muted rounded-full" />
                <div className="h-2 w-16 bg-muted/60 rounded-full" />
              </div>
            </div>
            <div className="h-6 w-16 bg-status-served/10 text-status-served text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center">
              Served
            </div>
          </div>
          
          {/* Row 2 (Active/Called) */}
          <div className="flex items-center justify-between p-3 rounded-lg border-2 border-accent bg-accent/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm relative">
                B04
                <div className="absolute inset-0 rounded-full border-2 border-accent animate-pulse-ring" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-24 bg-foreground/80 rounded-full" />
                <div className="h-2 w-14 bg-muted-foreground rounded-full" />
              </div>
            </div>
            <div className="h-6 w-16 bg-accent text-white text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center shadow-sm">
              Called
            </div>
          </div>
          
          {/* Row 3 */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm">
                B05
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-16 bg-muted rounded-full" />
                <div className="h-2 w-12 bg-muted/60 rounded-full" />
              </div>
            </div>
            <div className="h-6 w-16 bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center">
              Waiting
            </div>
          </div>
        </div>
      </div>

      {/* Foreground Phone Mockup (Offset Left & Forward) */}
      <div 
        className="absolute left-0 top-0 w-[65%] max-w-[280px] bg-background rounded-[2rem] premium-shadow border-4 border-foreground/10 overflow-hidden transform rotate-y-[5deg] rotate-z-[-2deg] translate-z-[20px] animate-float flex flex-col"
        style={{ height: '480px', transformStyle: 'preserve-3d' }}
      >
        {/* Dynamic Island / Notch area */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center">
          <div className="w-24 h-4 bg-foreground/10 rounded-b-xl" />
        </div>
        
        {/* Screen Content */}
        <div className="flex-1 p-6 pt-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-terracotta/20 flex items-center justify-center mb-6">
            <div className="w-6 h-6 text-terracotta">
              <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            </div>
          </div>
          
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">Your Number</p>
          <div className="text-6xl font-bold font-sans text-foreground mb-6 relative">
            B05
          </div>
          
          <div className="w-full bg-muted rounded-2xl p-4 mb-auto">
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <p className="text-lg font-bold text-foreground">You're #3 in line</p>
            
            {/* Progress Bar */}
            <div className="mt-4 h-2 w-full bg-background rounded-full overflow-hidden">
              <div className="h-full w-[40%] bg-accent rounded-full" />
            </div>
          </div>
          
          <div className="w-full mt-4 py-3 border-t border-border/50 text-xs font-medium text-muted-foreground flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-ring" />
            Live wait time: ~4 min
          </div>
        </div>
      </div>
      
      {/* Floating Accent Badge */}
      <div className="absolute bottom-16 right-[15%] bg-surface border border-border px-4 py-3 rounded-xl premium-shadow flex items-center gap-3 transform translate-z-[30px] animate-float-delayed">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full border-2 border-surface bg-accent/20" />
          <div className="w-8 h-8 rounded-full border-2 border-surface bg-terracotta/20" />
          <div className="w-8 h-8 rounded-full border-2 border-surface bg-foreground/10" />
        </div>
        <div className="text-xs font-medium text-foreground">
          <span className="font-bold">120+</span> businesses<br/>trust Cuely
        </div>
      </div>
    </div>
  );
}
