import { useState } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const WalletConnection = () => {
  const { userAddress, connectWallet, error } = useContractInteraction();
  const [connecting, setConnecting] = useState(false);

  const handleConnectWallet = async () => {
    setConnecting(true);
    try {
      await connectWallet();
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {userAddress ? (
        <p className="text-sm text-gray-700">Connected: {userAddress}</p>
      ) : (
        <Button
          onClick={handleConnectWallet}
          disabled={connecting}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
        >
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      )}
    </div>
  );
};

export default WalletConnection;