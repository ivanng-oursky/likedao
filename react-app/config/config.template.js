window.appConfig = {
  sentry: null,
  chainInfo: {
    bech32Config: {
      bech32PrefixAccAddr: "like",
      bech32PrefixAccPub: "likepub",
      bech32PrefixValAddr: "likevaloper",
      bech32PrefixValPub: "likevaloperpub",
      bech32PrefixConsAddr: "likevalcons",
      bech32PrefixConsPub: "likevalconspub",
    },
    gasPrice: "200000nanoekil",
    chainId: "likecoin-public-testnet-5",
    chainRpc: "https://likecoin-public-testnet-5.oursky.dev:443/rpc/",
    currency: {
      coinDenom: "EKIL",
      coinMinimalDenom: "nanoekil",
      coinDecimals: 9,
    },
  },
  desmosRpc: "https://rpc.mainnet.desmos.network",
  graphql: {
    endpoint: "http://localhost:8080/graphql",
  },
  authEndpoint: "http://localhost:8080/auth",
  chainLinks: [],
  footerLinks: {
    osmosis: "https://app.osmosis.zone/?from=ATOM&to=LIKE",
    liquid: "https://app.liquid.com/exchange/LIKEUSDT",
    emeris: "https://app.emeris.com/welcome",
    contactSupport:
      "https://go.crisp.chat/chat/embed/?website_id=5c009125-5863-4059-ba65-43f177ca33f7",
  },
};
