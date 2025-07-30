"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface NavbarContextType {
  showNavbar: boolean;
}

const NavbarContext = createContext<NavbarContextType>({ showNavbar: false });

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showNavbar, setShowNavbar] = useState(false);

  useEffect(() => {
    const shouldShowNavbar = ["/", "/signup", "/login"].includes(pathname);
    setShowNavbar(shouldShowNavbar);
  }, [pathname]);

  return (
    <NavbarContext.Provider value={{ showNavbar }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  return useContext(NavbarContext);
}
