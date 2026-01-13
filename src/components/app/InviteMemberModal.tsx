import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2, Copy, Check, Loader2, Twitter, Facebook, Linkedin, MessageCircle, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

const InviteMemberModal = ({ isOpen, onClose, groupId, groupName }: InviteMemberModalProps) => {
  const [inviteLink, setInviteLink] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateInviteLink = async () => {
    if (!user?.id) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to invite members.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const { data, error } = await supabase.functions.invoke('create-invite-link', {
        body: { groupId },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.token) {
        throw new Error(data?.error || 'Failed to create invitation');
      }

      const invitationToken = data.token as string;

      // Generate the invite link - use production URL for preview environments
      const host = window.location.hostname;
      const isPreview =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.startsWith('id-preview--') ||
        host.startsWith('preview--') ||
        (host.endsWith('.lovable.app') && host.includes('--'));

      // Use the actual published production URL
      const productionUrl = 'https://sidechatai.vercel.app';
      const appUrl = isPreview ? productionUrl : window.location.origin;
      const link = `${appUrl}/invite/${invitationToken}`;
      setInviteLink(link);

      toast({
        title: 'Invite link generated!',
        description: 'Copy the link or share it via social media.',
      });
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: 'Failed to create invitation',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Invite link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  const shareMessage = `Join me on ${groupName}!`;

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(inviteLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}&quote=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${inviteLink}`)}`;
    window.open(url, '_blank');
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent(`Join ${groupName}`);
    const body = encodeURIComponent(`Hey!\n\nI'd like to invite you to join ${groupName}.\n\nClick here to join: ${inviteLink}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleClose = () => {
    setInviteLink('');
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Invite to {groupName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!inviteLink ? (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Generate a shareable invite link to add someone to{' '}
                  <span className="font-medium text-foreground">{groupName}</span>. The link expires in 7 days.
                </p>
              </div>

              <Button
                onClick={generateInviteLink}
                disabled={generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Generate Invite Link
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Invite link</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={inviteLink}
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Social Share Buttons */}
              <div className="space-y-2">
                <Label>Share via</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={shareToWhatsApp}
                    variant="outline"
                    size="sm"
                    className="gap-2 flex-1 min-w-[120px] bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-600 dark:text-green-400"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={shareToTwitter}
                    variant="outline"
                    size="sm"
                    className="gap-2 flex-1 min-w-[120px] bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-500"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </Button>
                  <Button
                    onClick={shareToFacebook}
                    variant="outline"
                    size="sm"
                    className="gap-2 flex-1 min-w-[120px] bg-blue-600/10 hover:bg-blue-600/20 border-blue-600/30 text-blue-600"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </Button>
                  <Button
                    onClick={shareToLinkedIn}
                    variant="outline"
                    size="sm"
                    className="gap-2 flex-1 min-w-[120px] bg-blue-700/10 hover:bg-blue-700/20 border-blue-700/30 text-blue-700 dark:text-blue-400"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </Button>
                  <Button
                    onClick={shareToEmail}
                    variant="outline"
                    size="sm"
                    className="gap-2 flex-1 min-w-[120px]"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => {
                    setInviteLink('');
                    setCopied(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Generate New Link
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberModal;
