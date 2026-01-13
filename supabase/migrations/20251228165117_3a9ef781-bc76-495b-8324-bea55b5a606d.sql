-- Create side_threads table for private conversations within groups
CREATE TABLE public.side_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create side_thread_participants table
CREATE TABLE public.side_thread_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  side_thread_id UUID NOT NULL REFERENCES public.side_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(side_thread_id, user_id)
);

-- Create side_thread_messages table
CREATE TABLE public.side_thread_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  side_thread_id UUID NOT NULL REFERENCES public.side_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.side_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.side_thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.side_thread_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is participant in side thread
CREATE OR REPLACE FUNCTION public.is_side_thread_participant(_user_id uuid, _side_thread_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.side_thread_participants
    WHERE user_id = _user_id
      AND side_thread_id = _side_thread_id
  )
$$;

-- RLS policies for side_threads
CREATE POLICY "Users can view side threads they participate in"
ON public.side_threads FOR SELECT
USING (
  is_side_thread_participant(auth.uid(), id) OR created_by = auth.uid()
);

CREATE POLICY "Group members can create side threads"
ON public.side_threads FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND is_group_member(auth.uid(), group_id)
);

CREATE POLICY "Creators can update their side threads"
ON public.side_threads FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their side threads"
ON public.side_threads FOR DELETE
USING (auth.uid() = created_by);

-- RLS policies for side_thread_participants
CREATE POLICY "Participants can view other participants"
ON public.side_thread_participants FOR SELECT
USING (
  is_side_thread_participant(auth.uid(), side_thread_id)
);

CREATE POLICY "Thread creators can add participants"
ON public.side_thread_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.side_threads
    WHERE id = side_thread_id AND created_by = auth.uid()
  ) OR (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.side_threads st
      WHERE st.id = side_thread_id AND is_group_member(auth.uid(), st.group_id)
    )
  )
);

CREATE POLICY "Thread creators can remove participants"
ON public.side_thread_participants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.side_threads
    WHERE id = side_thread_id AND created_by = auth.uid()
  ) OR user_id = auth.uid()
);

-- RLS policies for side_thread_messages
CREATE POLICY "Participants can view messages"
ON public.side_thread_messages FOR SELECT
USING (is_side_thread_participant(auth.uid(), side_thread_id));

CREATE POLICY "Participants can send messages"
ON public.side_thread_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND is_side_thread_participant(auth.uid(), side_thread_id)
);

-- Enable realtime for messages and side_thread_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.side_thread_messages;

-- Add trigger for updated_at on side_threads
CREATE TRIGGER update_side_threads_updated_at
BEFORE UPDATE ON public.side_threads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();