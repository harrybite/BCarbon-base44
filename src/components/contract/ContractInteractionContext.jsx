// src/contract/ContractInteractionContext.jsx
import { createContext, useContext } from "react";
import { useContractInteraction } from "./ContractInteraction"; // your existing logic

const ContractInteractionContext = createContext(null);

export default function ContractInteractionProvider(props) {
  const { children = null } = props || {};
  const { error } = useContractInteraction();
  return (
    <ContractInteractionContext.Provider value={error}>
      {error && (
        <div className="p-4">
          <div className="text-red-600 text-sm font-semibold flex items-center gap-2">
            ⚠️ <span>{error}</span>
          </div>
        </div>
      )}
      {children}
    </ContractInteractionContext.Provider>
  );
};

export const useContract = () => {
  const context = useContext(ContractInteractionContext);
  if (!context) {
    throw new Error("useContract must be used within a ContractInteractionProvider");
  }
  return context;
};
