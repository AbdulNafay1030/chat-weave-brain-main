-- Allow users to update their own messages in group chat
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own messages in group chat
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to update their own side thread messages
CREATE POLICY "Users can update their own side thread messages"
ON public.side_thread_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own side thread messages
CREATE POLICY "Users can delete their own side thread messages"
ON public.side_thread_messages
FOR DELETE
USING (auth.uid() = user_id);