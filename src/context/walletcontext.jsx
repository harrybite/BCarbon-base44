/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState } from "react";

const WalletContext = createContext(undefined);

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState("");

  const ConnectWallet = async () => {
    if (typeof window !== "undefined" && window?.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (err) {
        console.error("Wallet check failed:", err);
      }
    }
  };

  return (
    <WalletContext.Provider value={{ walletAddress, setWalletAddress, ConnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export function useConnectWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}