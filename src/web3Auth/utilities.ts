import ThresholdKey from "@tkey/core";
import SFAServiceProvider, {
  SfaServiceProvider,
} from "@tkey/service-provider-sfa";
import { TorusStorageLayer } from "@tkey/storage-layer-torus";
import { ShareSerializationModule } from "@tkey/share-serialization";
import { SecurityQuestionsModule } from "@tkey/security-questions";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { PrivateKeyProvider } from "@web3auth/single-factor-auth";

export const reconstructPrivateKey = async (
  idToken: string,
  email: string,
  faceID: string
) => {
  const serviceProvider = new SFAServiceProvider({
    web3AuthOptions: {
      clientId:
        "BNZwCwdzlxT59IU7-0sjtt50-41v9-GsE-vzww2szBca5W1CPSLyc51JKzwZkFfLDZVGv_PB4OxASnmGqq7inZ4",
      web3AuthNetwork: "sapphire_devnet",
    },
  });
  const storageLayer = new TorusStorageLayer({
    hostUrl: "https://metadata.tor.us",
  });

  const shareSerialization = new ShareSerializationModule();
  const securityQuestions = new SecurityQuestionsModule();

  const tKey = new ThresholdKey({
    serviceProvider,
    storageLayer,
    modules: {
      shareSerialization,
      securityQuestions,
    },
  });

  const privateKeyProvider = new EthereumPrivateKeyProvider(
    {
      config: {
        chainConfig: {
          chainId: "0xaa36a7",
          rpcTarget: "https://1rpc.io/sepolia",
          displayName: "sepolia_testnet",
          blockExplorer: "https://rpc.ankr.com/eth_sepolia",
          ticker: "ETH",
          tickerName: "Ethereum",
        },
      },
    }
  ) as PrivateKeyProvider;

  await (tKey.serviceProvider as SfaServiceProvider).init(
    privateKeyProvider
  );

  await (
    tKey.serviceProvider as SfaServiceProvider
  ).connect({
    verifier: "maal-wallet-jwt-verifier",
    verifierId: email,
    idToken,
  });

  await tKey.initialize();

  await (
    tKey.modules
      .securityQuestions as SecurityQuestionsModule
  ).inputShareFromSecurityQuestions(faceID);

  const reconstructedKey = await tKey.reconstructKey();

  const privateKey =
    reconstructedKey?.privKey.toString("hex");

  return privateKey;
};
