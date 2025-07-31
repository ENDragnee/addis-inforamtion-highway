'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import UserConsentScreen from '@/components/client/UserConsentScreen';
import BankDataDisplay from '@/components/client/BankDataDisplay';

// --- MOCK DATA ---
// This represents the user data we would get after a successful FIN lookup
const mockUserData = {
  fin: "12345678Z",
  name: "Abebe Bekele",
  avatarUrl: "https://i.pravatar.cc/150?u=abebebekele",
};

// This represents the financial data we'll receive AFTER user consent
const mockFinancialData = {
  providers: [
    { name: "Bank of Abyssinia", balance: 150234.50, creditScore: 720 },
    { name: "Awash Bank", balance: 78540.25, creditScore: 750 },
    { name: "CBE", balance: 450100.00, creditScore: 780 },
  ],
  aggregated: {
    totalBalance: 678874.75,
    averageCreditScore: 750,
  },
};
// --- END MOCK DATA ---

type Stage = 'initial' | 'loading' | 'consent_required' | 'consent_given' | 'consent_denied' | 'completed';

export default function BankClientPage() {
  const [fin, setFin] = useState('');
  const [stage, setStage] = useState<Stage>('initial');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fin) return;
    setStage('loading');
    
    // Simulate API call to your Trust Broker to initiate the request
    setTimeout(() => {
      // The Trust Broker has validated the rules and is now awaiting user consent
      setStage('consent_required'); 
    }, 1500);
  };
  
  const handleConsentResponse = (approved: boolean) => {
    setStage(approved ? 'consent_given' : 'consent_denied');
    
    if (approved) {
      // Simulate API call to the providers to get the data
      setTimeout(() => {
        setStage('completed');
      }, 2000);
    }
  };

  const handleReset = () => {
    setFin('');
    setStage('initial');
  };

  return (
    <main className="min-h-screen bg-muted/40 p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left Side: Bank Employee's UI */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Customer Financial Check</CardTitle>
            <CardDescription>Enter a customers FIN to request their aggregated financial data from partner institutions.</CardDescription>
          </CardHeader>
          <CardContent>
            {stage !== 'completed' && (
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="fin">Financial Identification Number (FIN)</Label>
                  <Input 
                    id="fin" 
                    placeholder="e.g., 12345678Z" 
                    value={fin}
                    onChange={(e) => setFin(e.target.value)}
                    disabled={stage !== 'initial'}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={stage !== 'initial'}>
                  {stage === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Search className="mr-2 h-4 w-4" />
                  Request Data
                </Button>
              </form>
            )}

            {stage === 'consent_denied' && (
               <Alert variant="destructive" className="mt-4">
                <AlertTitle>Request Denied</AlertTitle>
                <AlertDescription>
                  The user has denied consent to share their data.
                </AlertDescription>
              </Alert>
            )}

            {stage === 'completed' && (
              <BankDataDisplay 
                user={mockUserData} 
                financialData={mockFinancialData}
                onReset={handleReset}
              />
            )}
          </CardContent>
        </Card>

        {/* Right Side: The User's Consent Screen (simulated) */}
        <div>
          {stage === 'consent_required' && (
            <UserConsentScreen
              user={mockUserData}
              requester="Dashen Bank"
              providers={mockFinancialData.providers.map(p => p.name)}
              onConsent={handleConsentResponse}
            />
          )}
           {stage !== 'consent_required' && (
            <div className="h-full w-full rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center p-8 text-center text-muted-foreground">
              <p>The users consent screen will appear here once a data request is initiated.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
