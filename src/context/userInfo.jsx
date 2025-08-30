/* eslint-disable react-hooks/rules-of-hooks */

/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

const userInfoContext = createContext(undefined);


export const UserInfoProvider = ({ children }) => {
    // set user info state
  const [userInfo, setUserInfo] = useState({ 
            userId: "", 
            email: "", 
            roles: [],
            name: "",
            organizationName: "",
            isKYCCompleted: false,
            walletAddress: ""
        });

  const decodeToken = useCallback((token) => {
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (e) {
      return null;
    }
  }, []);

  const loadFromStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const info = decodeToken(token);
    setUserInfo(info);
    return info;
  }, [decodeToken]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const reloadUserInfo = () => loadFromStorage();

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    setUserInfo(null);
  };

  const contextValue = {
    userInfo,
    setUserInfo,
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
    throw new Error("useUserInfo must be used within a infoProvider");
  }
  return context;
}