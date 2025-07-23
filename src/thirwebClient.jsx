import { createThirdwebClient } from "thirdweb";

const NEXT_PUBLIC_THIRDWEB_CLIENT_ID = "8018c7a63d37f038f9e2097ace35b324"
 
export const thirdwebclient = createThirdwebClient({
  clientId: NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});