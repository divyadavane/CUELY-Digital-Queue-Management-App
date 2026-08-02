import { Search, X } from "lucide-react";

interface TicketSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TicketSearch({ searchQuery, onSearchChange }: TicketSearchProps) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="text"
        className="block w-full pl-11 pr-10 py-3 bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm shadow-inner"
        placeholder="Search patients by name, token # or phone number..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
