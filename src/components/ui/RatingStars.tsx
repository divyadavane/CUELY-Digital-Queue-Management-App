import { Star } from "lucide-react";

interface RatingStarsProps {
  value: number;
  size?: "xs" | "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

const sizeMap: Record<NonNullable<RatingStarsProps["size"]>, string> = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function RatingStars({ value, size = "sm", interactive = false, onChange, disabled }: RatingStarsProps) {
  const stars = [1, 2, 3, 4, 5];

  if (interactive) {
    return (
      <div className="flex items-center gap-1.5">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(star)}
            aria-label={`Rate ${star} out of 5`}
            className={`transition-transform ${disabled ? "cursor-not-allowed" : "hover:scale-125 active:scale-95"} ${
              star <= value ? "scale-110" : ""
            }`}
          >
            <Star
              className={`${sizeMap[size]} ${
                star <= value
                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                  : "fill-white/10 text-white/30"
              }`}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => (
        <Star
          key={star}
          className={`${sizeMap[size]} ${
            star <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-white/10 text-white/25"
          }`}
        />
      ))}
    </div>
  );
}
