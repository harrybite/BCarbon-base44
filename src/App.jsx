import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { WalletProvider } from "@/context/walletcontext"
import { ThirdwebProvider } from "thirdweb/react";
import { UserInfoProvider } from './context/userInfo';

function App() {
  return (
    <>
      <UserInfoProvider>
        <ThirdwebProvider >
          <WalletProvider>
            <Pages />
            <Toaster />
          </WalletProvider>
        </ThirdwebProvider>
      </UserInfoProvider>

    </>
  )
}

export default App 