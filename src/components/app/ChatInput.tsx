import { useState, useRef } from 'react';
import { Send, Smile, Paperclip, X, Loader2, Sparkles, Plus, ArrowUp, MapPin, FileText, Image as ImageIcon, FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ReplyPreview from './ReplyPreview';
import MentionInput from './MentionInput';
import { User } from '@/types/sidechat';
import { useFileUpload } from '@/hooks/useFileUpload';

interface ReplyTo {
  id: string;
  content: string;
  userId: string;
}

interface ChatInputProps {
  onSend: (content: string, file?: { url: string; name: string; type: string; size: number } | null) => void;
  onAskAI?: (content: string, file?: { url: string; name: string; type: string; size: number } | null) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  onTyping?: () => void;
  onStopTyping?: () => void;
  replyTo?: ReplyTo | null;
  onCancelReply?: () => void;
  users?: User[];
  isAILoading?: boolean;
  onSummarize?: () => Promise<void>;
  isSummarizing?: boolean;
}

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
  '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😎',
  '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣',
  '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '🤤',
  '👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🤞',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💯',
  '🎉', '🎊', '🔥', '⭐', '✨', '💡', '💬', '👀',
  '✅', '❌', '⚡', '🚀', '💻', '📱', '🎯', '📈',
];

const ChatInput = ({
  onSend,
  onAskAI,
  placeholder = 'Type a message...',
  disabled,
  onTyping,
  onStopTyping,
  replyTo,
  onCancelReply,
  users = [],
  isAILoading = false,
  onSummarize,
  isSummarizing = false,
}: ChatInputProps) => {
  const [content, setContent] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useFileUpload();

  const handleChange = (value: string) => {
    setContent(value);
    if (value.length > 0 && onTyping) {
      onTyping();
    } else if (value.length === 0 && onStopTyping) {
      onStopTyping();
    }
  };

  const handleSend = async () => {
    if ((!content.trim() && !selectedFile) || disabled || isUploading || isAILoading) return;

    let uploadedFile = null;

    if (selectedFile) {
      uploadedFile = await uploadFile(selectedFile);
      if (!uploadedFile && !content.trim()) return;
    }

    onSend(content.trim() || '', uploadedFile);
    setContent('');
    setSelectedFile(null);
    setPreviewUrl(null);
    if (onStopTyping) {
      onStopTyping();
    }
  };

  const handleAskAI = async () => {
    if ((!content.trim() && !selectedFile) || disabled || isUploading || isAILoading || !onAskAI) return;

    let uploadedFile = null;

    if (selectedFile) {
      uploadedFile = await uploadFile(selectedFile);
      if (!uploadedFile && !content.trim()) return;
    }

    const messageContent = content.trim();
    setContent('');
    setSelectedFile(null);
    setPreviewUrl(null);
    if (onStopTyping) {
      onStopTyping();
    }

    await onAskAI(messageContent, uploadedFile);
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = selectedFile?.type.startsWith('image/');

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm">
      {/* Reply Preview */}
      {replyTo && onCancelReply && (
        <ReplyPreview replyTo={replyTo} users={users} onCancel={onCancelReply} />
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl max-w-xs border border-border/50">
            {isImage && previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-14 h-14 object-cover rounded-lg" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                <Paperclip className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleRemoveFile}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className={cn(
          "flex items-end gap-2 rounded-md border border-input bg-background",
          "transition-all duration-200",
          "px-3 py-2"
        )}>
          {/* Ask AI Button - NOW ON LEFT */}
          {onAskAI && (
            <Button
              onClick={handleAskAI}
              disabled={!content.trim() || disabled || isUploading || isAILoading}
              className="shrink-0 h-9 w-9 p-0 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
              title="Ask AI"
            >
              {isAILoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </Button>
          )}

          {/* Attachment Menu */}
          <Popover open={attachmentOpen} onOpenChange={setAttachmentOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9 rounded-xl hover:bg-secondary/80"
                title="Attach"
              >
                <Plus className="w-5 h-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start" side="top" sideOffset={8}>
              <div className="flex flex-col gap-1">
                {onSummarize && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-3 py-2 h-auto font-normal"
                    onClick={async () => {
                      // Don't close popover automatically - user can close by clicking outside
                      if (!isSummarizing) {
                        await onSummarize();
                      }
                    }}
                    disabled={isSummarizing}
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                      {isSummarizing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileSearch className="w-4 h-4" />
                      )}
                    </div>
                    <span>{isSummarizing ? 'Summarizing...' : 'Summarize Chat'}</span>
                  </Button>
                )}

                {onSummarize && (
                  <div className="h-px bg-border my-1" />
                )}

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-3 py-2 h-auto font-normal"
                  onClick={() => {
                    setAttachmentOpen(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv";
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span>Document</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-3 py-2 h-auto font-normal"
                  onClick={() => {
                    setAttachmentOpen(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*";
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span>Photos</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-3 py-2 h-auto font-normal"
                  onClick={() => {
                    setAttachmentOpen(false);
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((position) => {
                        const { latitude, longitude } = position.coords;
                        const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                        onSend(`📍 Shared Location: ${locationUrl}`);
                      }, (error) => {
                        console.error("Error getting location", error);
                        alert("Could not get location. Please enable location services.");
                      });
                    } else {
                      alert("Geolocation is not supported by this browser.");
                    }
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>Location</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Hidden File Input - Dynamic Accept */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            // Default accept, logic above overrides it before click
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          />

          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-xl hover:bg-secondary/80">
                <Smile className="w-5 h-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 p-2"
              align="start"
              side="top"
              sideOffset={8}
            >
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-secondary rounded-md transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <MentionInput
            value={content}
            onChange={handleChange}
            onSend={handleSend}
            onBlur={onStopTyping}
            placeholder={placeholder}
            disabled={disabled || isUploading}
            users={users}
          />

          {/* Send Button - Human message to group */}
          <Button
            onClick={handleSend}
            disabled={(!content.trim() && !selectedFile) || disabled || isUploading || isAILoading}
            variant="secondary"
            className="shrink-0 h-9 px-4 rounded-xl gap-2 font-medium"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="text-sm">Send</span>
              </>
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
          Press Enter to send • Shift+Enter for new line • @ to mention
        </p>
      </div>
    </div>
  );
};

export default ChatInput;