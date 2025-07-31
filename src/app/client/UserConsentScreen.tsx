'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Shield, X, Banknote } from "lucide-react";

interface UserConsentScreenProps {
  user: { name: string; avatarUrl: string };
  requester: string;
  providers: string[];
  onConsent: (approved: boolean) => void;
}

export default function UserConsentScreen({ user, requester, providers, onConsent }: UserConsentScreenProps) {
  return (
    <div className="bg-background rounded-2xl p-2 shadow-2xl border w-full max-w-sm mx-auto">
      <Card className="border-none">
        <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
           </div>
          <CardTitle>Data Access Request</CardTitle>
          <CardDescription>{user.name}, you have a new request.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm p-3 rounded-lg bg-muted">
            <p><span className="font-bold text-accent">{requester}</span> is requesting to access the following information:</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Banknote className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Account Balances</span>
            </div>
             <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Credit Scores</span>
            </div>
          </div>
          
          <Separator />

          <p className="text-sm text-muted-foreground">This data will be securely retrieved from:</p>
          <div className="flex flex-wrap gap-2">
            {providers.map(provider => (
              <Badge key={provider} variant="secondary">{provider}</Badge>
            ))}
          </div>

        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="w-full" onClick={() => onConsent(false)}>
            <X className="mr-2 h-4 w-4" />
            Deny
          </Button>
          <Button className="w-full" onClick={() => onConsent(true)}>
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
