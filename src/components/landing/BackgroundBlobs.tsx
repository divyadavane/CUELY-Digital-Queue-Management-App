export function BackgroundBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Primary Accent Blob (Top Right) */}
      <div 
        className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[100px] opacity-[0.08] dark:opacity-[0.15] animate-blob-drift-1"
        style={{ backgroundColor: 'var(--color-accent)' }}
      />
      
      {/* Secondary Terracotta Blob (Bottom Left) */}
      <div 
        className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[80px] opacity-[0.06] dark:opacity-[0.12] animate-blob-drift-2"
        style={{ backgroundColor: 'var(--color-terracotta)' }}
      />

      {/* Decorative Grid Motif */}
      <div 
        className="absolute top-[20%] left-[5%] w-32 h-32 opacity-20 dark:opacity-30"
        style={{
          backgroundImage: 'radial-gradient(var(--color-foreground) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      />
      
      {/* Decorative Plus-Sign Motif (Bottom Right) */}
      <div 
        className="absolute bottom-[15%] right-[10%] w-40 h-40 opacity-10 dark:opacity-20 flex flex-wrap gap-4"
        style={{ width: '160px' }}
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="relative w-4 h-4 text-foreground/50">
            <div className="absolute inset-x-1.5 inset-y-0 bg-current rounded-full" />
            <div className="absolute inset-y-1.5 inset-x-0 bg-current rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
