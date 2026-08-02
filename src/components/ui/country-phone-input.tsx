"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "IN", dialCode: "+91", name: "India", flag: "🇮🇳" },
  { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸" },
  { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "AE", dialCode: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "AU", dialCode: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "SG", dialCode: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "DE", dialCode: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "FR", dialCode: "+33", name: "France", flag: "🇫🇷" },
  { code: "JP", dialCode: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "MY", dialCode: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "PK", dialCode: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "BD", dialCode: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "NP", dialCode: "+977", name: "Nepal", flag: "🇳🇵" },
  { code: "LK", dialCode: "+94", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "ZA", dialCode: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "NG", dialCode: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "PH", dialCode: "+63", name: "Philippines", flag: "🇵🇭" },
  { code: "ID", dialCode: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "KE", dialCode: "+254", name: "Kenya", flag: "🇰🇪" },
  { code: "BR", dialCode: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", dialCode: "+52", name: "Mexico", flag: "🇲🇽" },
  { code: "IT", dialCode: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "ES", dialCode: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "NL", dialCode: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "SE", dialCode: "+46", name: "Sweden", flag: "🇸🇪" },
  { code: "NZ", dialCode: "+64", name: "New Zealand", flag: "🇳🇿" },
];

interface CountryPhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function CountryPhoneInput({
  value,
  onChange,
  placeholder = "89836 75270",
  required = false,
  className = "",
}: CountryPhoneInputProps) {
  // Default to India +91
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Parse initial value if passed
  useEffect(() => {
    if (!value) return;
    const matched = COUNTRY_CODES.find((c) => value.startsWith(c.dialCode));
    if (matched) {
      setSelectedCountry(matched);
      const numberPart = value.slice(matched.dialCode.length).trim();
      setPhoneNumber(numberPart);
    } else {
      setPhoneNumber(value.replace(/^\+\d+\s*/, ""));
    }
  }, []);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matched = COUNTRY_CODES.find((c) => c.code === e.target.value);
    if (matched) {
      setSelectedCountry(matched);
      const full = phoneNumber.trim() ? `${matched.dialCode} ${phoneNumber.trim()}` : "";
      onChange(full);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setPhoneNumber(inputVal);
    const full = inputVal.trim() ? `${selectedCountry.dialCode} ${inputVal.trim()}` : "";
    onChange(full);
  };

  return (
    <div className={`flex items-center w-full bg-background border border-white/20 focus-within:border-accent rounded-xl shadow-sm overflow-hidden transition-all ${className}`}>
      {/* Country Select Dropdown Box */}
      <div className="relative flex items-center shrink-0 w-[115px] bg-white/5 hover:bg-white/10 transition-colors pl-3 py-3">
        <span className="text-base select-none mr-1">{selectedCountry.flag}</span>
        <span className="text-xs font-bold text-foreground font-mono">{selectedCountry.dialCode}</span>

        {/* Native Select Overlay */}
        <select
          value={selectedCountry.code}
          onChange={handleCountryChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Select Country Code"
        >
          {COUNTRY_CODES.map((country) => (
            <option key={country.code} value={country.code} className="bg-slate-900 text-white font-sans text-sm">
              {country.flag} {country.dialCode} &mdash; {country.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto mr-2 pointer-events-none" />
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/15 shrink-0" />

      {/* Phone Number Input Field */}
      <input
        type="tel"
        required={required}
        value={phoneNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className="flex-1 w-full bg-transparent px-3.5 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none text-sm font-mono tracking-wide"
      />
    </div>
  );
}
