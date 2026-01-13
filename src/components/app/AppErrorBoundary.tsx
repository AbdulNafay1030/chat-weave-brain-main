import React from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Keep a console trace for debugging.
    // Avoid logging sensitive user data.
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message || 'Unknown error';

    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <Card className="w-full max-w-xl p-6">
          <header className="space-y-2">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              The app hit an unexpected error. Reloading usually fixes it.
            </p>
          </header>

          <section className="mt-4 rounded-md border border-border bg-muted/30 p-3">
            <p className="text-xs font-mono break-words">{message}</p>
          </section>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => window.location.reload()}>Reload</Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `Sidechat error: ${message}\n\n${this.state.error?.stack || ''}`
                  );
                } catch {
                  // ignore
                }
              }}
            >
              Copy error
            </Button>
          </div>
        </Card>
      </main>
    );
  }
}
