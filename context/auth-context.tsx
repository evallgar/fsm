/**
 * Authentication context module providing global auth state and methods.
 * The engineer signs in to the OneMap server; Firebase is only used for file storage.
 * @module
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/Toast";
import {
  ApiError,
  login,
  logout,
  OneMapUser,
  restoreSession,
  setUnauthorizedHandler,
} from "@/lib/onemap-api";

interface AuthContextType {
  /**
   * Signs in with the platform account.
   * @returns the user, or undefined when the sign-in failed (the reason is shown in a toast)
   */
  signIn: (email: string, password: string) => Promise<OneMapUser | undefined>;
  /** Signs out and forgets the session on this device */
  signOut: () => void;
  /** The signed-in engineer */
  user: OneMapUser | null;
  /** True until the stored session has been checked */
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

/** Hook to access the authentication context. */
export function useSession(): AuthContextType {
  const value = useContext(AuthContext);

  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

export function SessionProvider(props: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [user, setUser] = useState<OneMapUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // A session that is still good from the last time the app was open, and what to do when it stops being good.
    setUnauthorizedHandler(() => setUser(null));
    restoreSession()
      .then((restored) => setUser(restored && !restored.disabled ? restored : null))
      .finally(() => setIsLoading(false));
    return () => setUnauthorizedHandler(undefined);
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      const signedIn = await login(email.trim(), password);
      if (signedIn.disabled) {
        await logout();
        toast(t("invalid-credentials"), "destructive", 4000);
        return undefined;
      }
      setUser(signedIn);
      return signedIn;
    } catch (err) {
      let errorMessage = t("signin-error");
      if (err instanceof ApiError) {
        // 401: wrong email or password; 429: the server is throttling attempts
        if (err.status === 401 || err.status === 403) errorMessage = t("invalid-credentials");
        else if (err.status === 429) errorMessage = t("too-many-attempts");
      } else if (err instanceof Error && /network request failed/i.test(err.message)) {
        errorMessage = t("network-error");
      }
      toast(errorMessage, "destructive", 4000);
      return undefined;
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("[handleSignOut error] ==>", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn: handleSignIn,
        signOut: handleSignOut,
        user,
        isLoading,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
