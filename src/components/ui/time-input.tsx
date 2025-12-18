import * as React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  error?: string;
}

export function TimeInput({ value, onChange, className, error }: TimeInputProps) {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^\d:]/g, '');
    
    // Auto-format as user types
    if (input.length === 2 && !input.includes(':') && localValue.length < 3) {
      input = input + ':';
    }
    
    // Limit to HH:MM format
    if (input.length > 5) {
      input = input.slice(0, 5);
    }
    
    setLocalValue(input);
  };

  const handleBlur = () => {
    // Validate and format on blur
    const parts = localValue.split(':');
    let hours = parseInt(parts[0] || '0', 10);
    let minutes = parseInt(parts[1] || '0', 10);
    
    // Clamp values
    hours = Math.max(0, Math.min(23, hours || 0));
    minutes = Math.max(0, Math.min(59, minutes || 0));
    
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setLocalValue(formatted);
    onChange(formatted);
  };

  return (
    <div className="space-y-1">
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]{2}:[0-9]{2}"
        placeholder="HH:MM"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          'h-12 bg-secondary border-border tv-focus text-center font-mono text-lg',
          error && 'border-destructive',
          className
        )}
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
