const { connect, Contract, keyStores, WalletConnection } = nearApi;

const CONTRACT_NAME = "levels-browsing.svntax.testnet";

//const nearConfig = getConfig(process.env.NODE_ENV || "development")
const nearConfig = {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
    contractName: CONTRACT_NAME,
    walletUrl: "https://wallet.testnet.near.org",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://explorer.testnet.near.org",
};

export async function initContract(){
    const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, nearConfig));
    window.walletConnection = new WalletConnection(near);
    window.accountId = window.walletConnection.getAccountId();
    window.contract = await new Contract(window.walletConnection.account(), nearConfig.contractName, {
        viewMethods: ["getLevels"],
        changeMethods: ["addLevel"],
    });
}

export function logout(){
    window.walletConnection.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
}

export function login(){
    window.walletConnection.requestSignIn(nearConfig.contractName, "js13kGames 2022 Game");
}