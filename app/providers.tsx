"use client";

import { ThemeProvider } from "next-themes";
import { AuthCoreContextProvider } from "@particle-network/auth-core-modal";
import { SolanaDevnet } from "@particle-network/chains";
import { Buffer } from "buffer";
import { useEffect, useState } from "react";

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}
type ProviderProps = React.ComponentProps<typeof AuthCoreContextProvider>;
type AuthOptions = NonNullable<ProviderProps['options']>;
type ActualAuthTypes = AuthOptions['authTypes'];


export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthCoreContextProvider
        options={{
          projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID as string, 
          clientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY as string, 
          appId: process.env.NEXT_PUBLIC_PARTICLE_APP_ID as string,         
          authTypes: ["email", "google", "apple"] as ActualAuthTypes, 
          themeType: "dark",
          wallet: {
            visible: true,
            customStyle: {
              supportChains: [SolanaDevnet], 
            },
          },
        }}
      >
        {children}
      </AuthCoreContextProvider>
    </ThemeProvider>
  );
}