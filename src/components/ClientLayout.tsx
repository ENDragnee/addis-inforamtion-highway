// app/components/ClientLayout.tsx
"use client";

import { useNavbar } from "../app/context/NavbarContext";
import Navbar from "./Navbar"; // Make sure the path to your Navbar component is correct

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { showNavbar } = useNavbar();

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
}
