"use client";

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, AlertCircle, CheckCircle, Terminal } from 'lucide-react';

// --- Type Definitions ---
type FlowResult = {
  finalData: Record<string, any>;
  isSignatureValid: boolean;
};

type LogEntry = {
  id: number;
  type: 'info' | 'pending' | 'success' | 'error';
  message: string;
};

// --- Mutation Function ---
const triggerFlow = async (faydaId: string): Promise<FlowResult> => {
  const { data } = await axios.post('/api/v1/super/trigger-flow', { faydaId });
  return data;
};

// --- The Main Page Component ---
export default function TestingClientPage() {
  const [faydaId, setFaydaId] = useState('ext_bob_67890');
  const [log, setLog] = useState<LogEntry[]>([]);

  const mutation = useMutation<FlowResult, AxiosError<{ error: string }>, string>({
    mutationFn: triggerFlow,
    // Use the mutation callbacks to build the real-time log
    onMutate: () => {
      setLog([
        { id: 1, type: 'pending', message: 'Flow initiated. Creating data request...' },
      ]);
    },
    onSuccess: (data) => {
      setLog(prevLog => [
        ...prevLog,
        { id: 2, type: 'info', message: `User consent simulated and approved. message: ${data.finalData.message}`  },
        { id: 3, type: 'info', message: 'Polling for status... Data received from provider.' },
        { id: 4, type: 'info', message: 'Verifying provider signature...' },
        { id: 5, type: 'success', message: 'Flow completed successfully!' },
      ]);
    },
    onError: (error) => {
      setLog(prevLog => [
        ...prevLog,
        { id: prevLog.length + 1, type: 'error', message: error.response?.data?.error || error.message },
      ]);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(faydaId);
  };

  const LogIcon = ({ type }: { type: LogEntry['type'] }) => {
    switch (type) {
      case 'pending': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Terminal className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">TrustBroker Client Simulator</h1>
        <p className="text-muted-foreground">
          A tool to test the end-to-end data request flow for a specific user.
        </p>
      </div>

      {/* Responsive two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>Trigger Data Request</CardTitle>
            <CardDescription>
              Enter a users External ID 
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="faydaId">Users External ID</Label>
                <Input
                  id="faydaId"
                  placeholder="e.g., ext_alice_12345"
                  value={faydaId}
                  onChange={(e) => setFaydaId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use `ext_alice_12345` or `ext_bob_67890` from the seed data.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Executing...</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" /> Request Data</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        {/* Results Card */}
        <Card className="min-h-[200px]">
          <CardHeader>
            <CardTitle>Execution Log</CardTitle>
            <CardDescription>Real-time progress of the data request flow.</CardDescription>
          </CardHeader>
          <CardContent>
            {log.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-10">
                Results will appear here once a flow is initiated.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Real-time Log */}
                <div className="space-y-2 font-mono text-xs">
                  {log.map(entry => (
                    <div key={entry.id} className="flex items-center gap-2">
                      <LogIcon type={entry.type} />
                      <span className={entry.type === 'error' ? 'text-destructive' : ''}>{entry.message}</span>
                    </div>
                  ))}
                </div>

                {/* Final Result on Success */}
                {mutation.isSuccess && (
                  <div className="space-y-4 pt-4 border-t">
                     <div className="flex justify-between items-center">
                        <Label>Provider Signature</Label>
                        <Badge variant={mutation.data.isSignatureValid ? 'default' : 'destructive'}>
                            {mutation.data.isSignatureValid ? 'Verified' : 'Failed'}
                        </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label>Final Data Received</Label>
                      <div className="rounded-md bg-muted text-sm max-h-60 overflow-auto scrollbar-thin">
                          <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={{ margin: 0 }}>
                              {JSON.stringify(mutation.data.finalData, null, 2)}
                          </SyntaxHighlighter>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
