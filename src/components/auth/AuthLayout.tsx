import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink">{title}</h1>
          <p className="text-comment mt-2">{description}</p>
        </div>
        <div className="bg-current-line p-8 rounded-lg shadow-2xl">
          {children}
        </div>
      </div>
    </main>
  );
}
