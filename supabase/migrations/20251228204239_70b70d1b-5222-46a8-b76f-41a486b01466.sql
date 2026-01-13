-- Create reactions table for group messages
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create reactions table for side thread messages
CREATE TABLE public.side_thread_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.side_thread_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Add is_pinned column to messages
ALTER TABLE public.messages ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;

-- Add is_pinned column to side_thread_messages
ALTER TABLE public.side_thread_messages ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;

-- Enable RLS on reaction tables
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.side_thread_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_reactions
CREATE POLICY "Group members can view reactions"
ON public.message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id
    AND is_group_member(auth.uid(), m.group_id)
  )
);

CREATE POLICY "Group members can add reactions"
ON public.message_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id
    AND is_group_member(auth.uid(), m.group_id)
  )
);

CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for side_thread_message_reactions
CREATE POLICY "Participants can view reactions"
ON public.side_thread_message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.side_thread_messages stm
    WHERE stm.id = message_id
    AND is_side_thread_participant(auth.uid(), stm.side_thread_id)
  )
);

CREATE POLICY "Participants can add reactions"
ON public.side_thread_message_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.side_thread_messages stm
    WHERE stm.id = message_id
    AND is_side_thread_participant(auth.uid(), stm.side_thread_id)
  )
);

CREATE POLICY "Users can remove their own thread reactions"
ON public.side_thread_message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.side_thread_message_reactions;