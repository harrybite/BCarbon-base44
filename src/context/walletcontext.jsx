/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { thirdwebclient } from "@/thirwebClient";
import React, { createContext, useContext, useState } from "react";
import { useEffect } from "react";
import { useActiveAccount, useConnect } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

const WalletContext = createContext(undefined);

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const activeAccount = useActiveAccount();
  useEffect(()=>{
    setWalletAddress(activeAccount?.address);
  },[activeAccount?.address])

//  const ConnectWalletThiredWeb = async () => {
//   try {
//     await connect(async () => {
//       const wallet = createWallet("io.metamask");
//       await wallet.connect({
//         client: thirdwebclient,
//       });
//       // return the wallet
//       return wallet;
//     });
//   } catch (err) {
//     console.error("Error connecting wallet:", err);
//   }
// };

// const disconnectWallet = async () => {
//   try {
//      // Assuming you have a disconnect method in your wallet
     
//   } catch (error) {
//     console.error("Error disconnecting wallet:", error);
    
//   }
// }

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