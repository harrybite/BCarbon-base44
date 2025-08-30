/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState } from "react";
import { useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";


const WalletContext = createContext(undefined);

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const activeAccount = useActiveAccount();
  useEffect(()=>{
    setWalletAddress(activeAccount?.address);
  },[activeAccount?.address])


  return (
    <WalletContext.Provider value={{ walletAddress, setWalletAddress, }}>
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