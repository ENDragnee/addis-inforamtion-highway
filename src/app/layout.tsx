// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./context/AuthProvider";
import { ThemeProvider } from "./context/ThemeProvider";
import { NavbarProvider } from "./context/NavbarContext";
import ClientLayout from "../components/ClientLayout"; 

export const metadata: Metadata = {
  title: "Addis-Information-Highway",
  description: "Secure, User-Consented Data Sharing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <NavbarProvider>
              {/* Use the ClientLayout to wrap the children */}
              <ClientLayout>{children}</ClientLayout>
            </NavbarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
