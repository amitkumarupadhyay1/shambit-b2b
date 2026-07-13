"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { getCountries, getCountryCallingCode } from 'react-phone-number-input'
import type { Country } from 'react-phone-number-input'
import PhoneInputWithInput from 'react-phone-number-input/input'
import { ChevronDown, Search } from 'lucide-react'
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

interface PhoneInputProps {
  value?: string
  onChange?: (value?: string) => void
  onBlur?: () => void
  disabled?: boolean
  error?: string
  placeholder?: string
  defaultCountry?: Country | string
  className?: string
  autoComplete?: string
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onBlur,
  disabled,
  error,
  placeholder = "Phone number",
  defaultCountry = "IN",
  className,
  autoComplete,
}) => {
  const [country, setCountry] = useState<Country>(defaultCountry as Country)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const countries = getCountries()
  
  // Use built-in Intl for country names to avoid large dependency payloads
  const regionNames = useMemo(() => new Intl.DisplayNames(['en'], { type: 'region' }), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredCountries = countries.filter((c) => {
    const name = regionNames.of(c) || c;
    const code = getCountryCallingCode(c);
    const searchLower = search.toLowerCase();
    return name.toLowerCase().includes(searchLower) || code.includes(searchLower);
  })

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      <div className="flex items-start gap-2 relative">
        <div className="relative" ref={dropdownRef}>
          <button suppressHydrationWarning
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex items-center gap-2 px-3 h-11 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500",
              error ? "border-red-500" : "border-slate-300",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={country}
              src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${country}.svg`}
              className="w-6 h-4 rounded-sm object-cover border border-slate-100"
            />
            <span className="font-medium text-slate-700">+{getCountryCallingCode(country)}</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          {isOpen && (
            <div className="absolute z-50 top-full left-0 mt-1 w-[300px] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
              <div className="p-2 border-b border-slate-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input suppressHydrationWarning
                  type="text"
                  autoFocus
                  placeholder="Search country or code..."
                  className="w-full text-sm outline-none bg-transparent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[250px] overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((c) => (
                    <button suppressHydrationWarning
                      key={c}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors"
                      onClick={() => {
                        setCountry(c)
                        setIsOpen(false)
                        setSearch("")
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={c}
                        src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${c}.svg`}
                        className="w-6 h-4 rounded-sm object-cover border border-slate-100"
                      />
                      <span className="text-sm font-medium w-12 text-slate-700">+{getCountryCallingCode(c)}</span>
                      <span className="text-sm text-slate-600 truncate">{regionNames.of(c) || c}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-sm text-center text-slate-500">No countries found</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 w-full relative">
          <PhoneInputWithInput
            country={country}
            value={value}
            onChange={onChange || (() => {})}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={cn(
              "w-full px-3 h-11 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow",
              error ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:border-orange-500",
              disabled && "opacity-50 cursor-not-allowed bg-slate-50"
            )}
          />
        </div>
      </div>
    </div>
  )
}

export default PhoneInput
