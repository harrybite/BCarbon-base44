/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { apihost } from "@/components/contract/address";

const userInfoContext = createContext(undefined);

export const UserInfoProvider = ({ children }) => {
  // Initialize with null instead of empty object to avoid false authentication
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const decodeToken = useCallback((token) => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        console.log("Token expired");
        return null;
      }
      return decoded;
    } catch (e) {
      console.error("Token decode error:", e);
      return null;
    }
  }, []);

  const loadFromStorage = useCallback(async () => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return null;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setUserInfo(null);
      setIsLoading(false);
      return null;
    }

    try {
      // First decode the token locally to check if it's valid
      const decodedInfo = decodeToken(token);
      if (!decodedInfo) {
        localStorage.removeItem("token");
        setUserInfo(null);
        setIsLoading(false);
        return null;
      }

      // Then verify with the server
      const res = await fetch(`${apihost}/api/protected`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        console.log("Token expired or invalid, logging out");
        localStorage.removeItem("token");
        setUserInfo(null);
        setIsLoading(false);
        // Don't redirect here - let components handle it
        return null;
      } else if (res.ok) {
        setUserInfo(decodedInfo);
        setIsLoading(false);
        return decodedInfo;
      } else {
        throw new Error("Failed to verify token");
      }
    } catch (error) {
      console.error("Error loading user info:", error);
      localStorage.removeItem("token");
      setUserInfo(null);
      setIsLoading(false);
      return null;
    }
  }, [decodeToken]);

  // Load user info on mount - only once
  useEffect(() => {
    loadFromStorage();
  }, []); // Remove loadFromStorage dependency to prevent infinite loop

  const reloadUserInfo = useCallback(() => {
    setIsLoading(true);
    return loadFromStorage();
  }, [loadFromStorage]);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    setUserInfo(null);
    setIsLoading(false);
    // Don't force redirect here - let components handle it
  }, []);

  // Fix the authentication check
  const isAuthenticated = userInfo && userInfo.userId && userInfo.userId !== "";

  const contextValue = {
    userInfo,
    setUserInfo,
    isAuthenticated,
    isLoading,
    reloadUserInfo,
    logout,
  };

  return (
    <userInfoContext.Provider value={contextValue}>
      {children}
    </userInfoContext.Provider>
  );
};

export function useUserInfo() {
  const context = useContext(userInfoContext);
  if (!context) {
    throw new Error("useUserInfo must be used within a UserInfoProvider");
  }
  return context;
}