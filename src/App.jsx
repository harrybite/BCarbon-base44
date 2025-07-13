import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { WalletProvider } from "@/context/walletcontext"

function App() {
  return (
    <>
    <WalletProvider>
      <Pages />
      <Toaster />
      </WalletProvider>
    </>
  )
}

export default App 