import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SidechatLogo from '@/components/SidechatLogo';
import { Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react';

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'needs-auth'>('loading');
  const [message, setMessage] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupId, setGroupId] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus('needs-auth');
      return;
    }

    const acceptInvitation = async () => {
      try {
        if (!token) throw new Error('No token provided');

        const result = await api.acceptInvitation(token, user.id);

        if (result.error) {
          throw new Error(result.error);
        }

        setStatus('success');
        setMessage('You have joined the group!');
        setGroupName(result.groupName || '');
        setGroupId(result.groupId || '');
      } catch (error) {
        console.error('Error accepting invitation:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to accept invitation');
      }
    };

    acceptInvitation();
  }, [token, user, authLoading]);

  const handleGoToApp = () => {
    navigate('/app');
  };

  const handleSignIn = () => {
    // Store the invite token to process after auth
    sessionStorage.setItem('pendingInvite', token || '');
    navigate('/auth');
  };

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Processing invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'needs-auth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <SidechatLogo className="w-12 h-12" />
            </div>
            <CardTitle>Join Sidechat</CardTitle>
            <CardDescription>
              Sign in or create an account to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={handleSignIn} className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              Sign in to Continue
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You'll be redirected back after signing in
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'success' ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-destructive" />
            )}
          </div>
          <CardTitle>
            {status === 'success' ? 'Welcome to the team!' : 'Invitation Error'}
          </CardTitle>
          <CardDescription>
            {status === 'success'
              ? `You've joined ${groupName || 'the group'}`
              : message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'success' && (
            <Button onClick={handleGoToApp} className="w-full">
              Open Sidechat
            </Button>
          )}
          {status === 'error' && (
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Go to Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
