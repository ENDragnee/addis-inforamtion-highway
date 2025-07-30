import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { UserCheck, ShieldCheck, GitBranchPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Import Shadcn's Button
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'; // Import Shadcn's Card components

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="pt-20"> 
        
        <section className="container mx-auto text-center py-20 px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            The Future of Secure Data Exchange
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Our platform acts as a <span className="font-bold text-primary">Trust Broker</span>, not a data proxy. We empower users and connect institutions with unparalleled security and scalability.
          </p>
          <div className="mt-8 flex justify-center">
            {/* UPDATED: Using Shadcn Button with asChild prop for the Link */}
            <Button asChild size="lg" className="gap-2 group">
              <Link href="/login">
                Access the Platform 
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">How Our System Works</h2>
            <p className="mt-2 text-muted-foreground">A revolutionary approach to data sharing.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<UserCheck className="w-10 h-10 text-ring" />} // Using cyan (ring)
              title="User-Centric Consent"
              description="No data moves without explicit, cryptographic consent from the user for every single transaction. The user is always in control."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-10 h-10" style={{color: "hsl(var(--chart-1))"}} />} // Using green
              title="Zero Data Liability"
              description="We never see or store sensitive data. It flows directly from the provider to the requester, drastically reducing your security burden and liability."
            />
            <FeatureCard
              icon={<GitBranchPlus className="w-10 h-10" style={{color: "hsl(var(--chart-2))"}} />} // Using orange
              title="Scalable & Asynchronous"
              description="Our role as a coordinator prevents bottlenecks. The system remains fast and reliable, even as the number of partners and requests grows."
            />
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

// UPDATED: This component now uses the official Shadcn Card component for consistency
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-4">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function Footer() {
  return (
    <footer className="border-t mt-20">
      <div className="container mx-auto py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} ASCII Technologies. All rights reserved.</p>
      </div>
    </footer>
  );
}
