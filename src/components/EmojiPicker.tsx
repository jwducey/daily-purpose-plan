import { useState, useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-12 h-12 text-2xl p-0 rounded-xl"
          type="button"
        >
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0" side="bottom" align="start">
        <Picker
          data={data}
          onEmojiSelect={(emoji: any) => {
            onChange(emoji.native);
            setOpen(false);
          }}
          theme="auto"
          previewPosition="none"
          skinTonePosition="search"
          maxFrequentRows={2}
          perLine={8}
        />
      </PopoverContent>
    </Popover>
  );
}
