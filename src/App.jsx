import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { WalletProvider } from "@/context/walletcontext"
import { ThirdwebProvider } from "thirdweb/react";

function App() {
  return (
    <>
      <ThirdwebProvider >
        <WalletProvider>
          <Pages />
          <Toaster />
        </WalletProvider>
      </ThirdwebProvider>

    </>
  )
}

export default App 