"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

export type MultiSelectOption = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: MultiSelectOption[];
  onChange: React.Dispatch<React.SetStateAction<MultiSelectOption[]>>;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (option: MultiSelectOption) => {
    onChange(selected.filter((s) => s.value !== option.value));
  };

  const handleSelect = (option: MultiSelectOption) => {
    onChange([...selected, option]);
    setInputValue(""); // Clear input after selection
  };
  
  const filteredOptions = options.filter(
    (option) => !selected.some((s) => s.value === option.value)
  );

  return (
    <Command onKeyDown={(e) => { if (e.key === "Escape") inputRef.current?.blur(); }} className="overflow-visible bg-transparent">
      <div className={`group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${className}`}>
        <div className="flex flex-wrap gap-1">
          {selected.map((option) => (
            <Badge key={option.value} variant="secondary">
              {option.label}
              <button className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => handleUnselect(option)}>
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
          <CommandPrimitive.Input 
            ref={inputRef} 
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)} 
            onFocus={() => setOpen(true)} 
            placeholder={placeholder}
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && filteredOptions.length > 0 ? (
          <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandList>
              <CommandGroup className="h-full overflow-auto">
                {filteredOptions.map((option) => (
                  <CommandItem key={option.value} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onSelect={() => handleSelect(option)}>
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        ) : null}
      </div>
    </Command>
  );
}
