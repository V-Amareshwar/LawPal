import type { ChangeEvent } from 'react';

interface InputRangeProps {
  title: string;
  value: number;
  min: string;
  max: string;
  step: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function InputRange({ title, value, ...props }: InputRangeProps) {
  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm text-text-secondary w-12 text-center">{title}</span>
      <input
        type="range"
        value={value}
        {...props}
        className="w-48 h-2 bg-accent rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}