-- Read receipts for group messages
CREATE TABLE public.message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Read receipts for side thread messages
CREATE TABLE public.side_thread_message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.side_thread_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Add reply_to column for message replies
ALTER TABLE public.messages ADD COLUMN reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.side_thread_messages ADD COLUMN reply_to_id UUID REFERENCES public.side_thread_messages(id) ON DELETE SET NULL;

-- Add file attachment columns
ALTER TABLE public.messages ADD COLUMN file_url TEXT;
ALTER TABLE public.messages ADD COLUMN file_name TEXT;
ALTER TABLE public.messages ADD COLUMN file_type TEXT;
ALTER TABLE public.messages ADD COLUMN file_size INTEGER;

ALTER TABLE public.side_thread_messages ADD COLUMN file_url TEXT;
ALTER TABLE public.side_thread_messages ADD COLUMN file_name TEXT;
ALTER TABLE public.side_thread_messages ADD COLUMN file_type TEXT;
ALTER TABLE public.side_thread_messages ADD COLUMN file_size INTEGER;

-- Enable RLS on read tables
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.side_thread_message_reads ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_reads
CREATE POLICY "Group members can view read receipts"
ON public.message_reads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_reads.message_id
    AND public.is_group_member(auth.uid(), m.group_id)
  )
);

CREATE POLICY "Users can mark messages as read"
ON public.message_reads FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_reads.message_id
    AND public.is_group_member(auth.uid(), m.group_id)
  )
);

-- RLS policies for side_thread_message_reads
CREATE POLICY "Participants can view thread read receipts"
ON public.side_thread_message_reads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.side_thread_messages stm
    WHERE stm.id = side_thread_message_reads.message_id
    AND public.is_side_thread_participant(auth.uid(), stm.side_thread_id)
  )
);

CREATE POLICY "Users can mark thread messages as read"
ON public.side_thread_message_reads FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.side_thread_messages stm
    WHERE stm.id = side_thread_message_reads.message_id
    AND public.is_side_thread_participant(auth.uid(), stm.side_thread_id)
  )
);

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);

-- Storage policies for chat attachments
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for read receipts
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.side_thread_message_reads;