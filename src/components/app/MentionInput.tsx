import { useState, useRef, useEffect, KeyboardEvent, forwardRef, useImperativeHandle } from 'react';
import { User } from '@/types/sidechat';
import { cn } from '@/lib/utils';
import UserAvatar from './UserAvatar';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  users: User[];
  className?: string;
}

export interface MentionInputRef {
  focus: () => void;
  insertMention: (user: User) => void;
}

const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(({
  value,
  onChange,
  onSend,
  onBlur,
  placeholder,
  disabled,
  users,
  className,
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    insertMention: (user: User) => insertMention(user),
  }));

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(mentionSearch.toLowerCase())
  ).slice(0, 5);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  }, [value]);

  const checkForMention = (text: string, cursorPos: number) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) {
      setShowMentions(false);
      return;
    }

    if (lastAtIndex > 0 && !/\s/.test(textBeforeCursor[lastAtIndex - 1])) {
      setShowMentions(false);
      return;
    }

    const searchText = textBeforeCursor.slice(lastAtIndex + 1);
    
    if (searchText.includes(' ')) {
      setShowMentions(false);
      return;
    }

    setMentionSearch(searchText);
    setShowMentions(true);
    setMentionIndex(0);
  };

  const insertMention = (user: User) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    const beforeMention = value.slice(0, lastAtIndex);
    const afterMention = value.slice(cursorPosition);
    
    const newValue = `${beforeMention}@${user.name} ${afterMention}`;
    onChange(newValue);
    setShowMentions(false);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = lastAtIndex + user.name.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Replace newlines with spaces to prevent multi-line expansion
    const cleanedText = pastedText.replace(/\n/g, ' ').replace(/\r/g, ' ');
    
    // Insert at cursor position
    const textarea = e.currentTarget;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const currentValue = value;
    const newValue = currentValue.slice(0, start) + cleanedText + currentValue.slice(end);
    const newCursorPos = start + cleanedText.length;
    
    onChange(newValue);
    setCursorPosition(newCursorPos);
    
    // Set cursor position after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        checkForMention(newValue, newCursorPos);
      }
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart || 0;
    setCursorPosition(newCursorPos);
    onChange(newValue);
    checkForMention(newValue, newCursorPos);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mentions navigation
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[mentionIndex]);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertMention(filteredUsers[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }
    
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      onSend?.();
      return;
    }
    // Shift+Enter adds a new line (default behavior)
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const cursorPos = e.currentTarget.selectionStart || 0;
    setCursorPosition(cursorPos);
    checkForMention(value, cursorPos);
  };

  useEffect(() => {
    const handleClickOutside = () => setShowMentions(false);
    if (showMentions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMentions]);

  return (
    <div className="relative flex-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        onClick={handleClick}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "w-full bg-transparent resize-none border-none outline-none ring-0 focus:ring-0 focus:outline-none text-sm text-foreground placeholder:text-muted-foreground",
          "min-h-[24px] max-h-32 py-1.5 leading-relaxed whitespace-pre-wrap break-words",
          className
        )}
      />
      
      {/* Mentions Dropdown */}
      {showMentions && filteredUsers.length > 0 && (
        <div 
          className="absolute bottom-full left-0 mb-2 w-64 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-1">
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                onClick={() => insertMention(user)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  index === mentionIndex
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <UserAvatar user={user} size="sm" />
                <div className="flex-1 text-left">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

MentionInput.displayName = 'MentionInput';

export default MentionInput;