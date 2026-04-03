import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GroupComboboxProps {
  value: string;
  onChange: (value: string) => void;
  existingGroups: string[];
  placeholder?: string;
}

export function GroupCombobox({ value, onChange, existingGroups, placeholder = 'Select or type a group' }: GroupComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    if (open) setInputValue(value);
  }, [open, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'w-full justify-start font-normal h-10 text-sm',
            !value && 'text-muted-foreground',
          )}
        >
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type new group..."
            value={inputValue}
            onValueChange={(v) => {
              setInputValue(v);
              onChange(v);
            }}
          />
          <CommandList>
            <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
              Press Enter or click away to use this value
            </CommandEmpty>
            {existingGroups.length > 0 && (
              <CommandGroup>
                {existingGroups.map((group) => (
                  <CommandItem
                    key={group}
                    value={group}
                    onSelect={(selected) => {
                      onChange(selected);
                      setInputValue(selected);
                      setOpen(false);
                    }}
                  >
                    {group}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
