"use client";

interface CallNextButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  waitingCount: number;
}

export default function CallNextButton({ onClick, disabled, loading, waitingCount }: CallNextButtonProps) {
  const isDisabled = disabled || loading || waitingCount === 0;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-xl text-lg font-bold
                  transition-all duration-200 shadow-lg
                  ${isDisabled
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-navy-900 text-white hover:bg-navy-800 active:scale-[0.98] shadow-navy-900/30 hover:shadow-xl"
                  }`}
    >
      {loading ? (
        <>
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Calling...
        </>
      ) : waitingCount === 0 ? (
        <>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
          Queue is Empty
        </>
      ) : (
        <>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          Call Next ({waitingCount} waiting)
        </>
      )}
    </button>
  );
}
