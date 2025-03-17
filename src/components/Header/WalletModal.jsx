import { Icon } from "@iconify/react/dist/iconify.js";
import { Dialog } from "@radix-ui/themes";
import React, { useState } from "react";
import { useConnectors } from "wagmi";
import { toast } from "sonner";

// Define suggested wallets that might not be installed
const suggestedWallets = [
    {
        id: 'metamask',
        name: 'MetaMask',
        icon: 'logos:metamask-icon',
        downloadUrl: 'https://metamask.io/download/',
        description: 'The most popular Web3 wallet'
    },
    {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        icon: 'logos:coinbase-icon',
        downloadUrl: 'https://www.coinbase.com/wallet/downloads',
        description: 'The secure wallet by Coinbase'
    },
    {
        id: 'trustwallet',
        name: 'Trust Wallet',
        icon: 'logos:trust-wallet',
        downloadUrl: 'https://trustwallet.com/download',
        description: 'The most trusted & secure crypto wallet'
    },
    {
        id: 'rainbow',
        name: 'Rainbow',
        icon: 'logos:rainbow',
        downloadUrl: 'https://rainbow.me',
        description: 'The fun & friendly wallet'
    }
];

// Enhanced wallet icon mapping
const getWalletIcon = (walletName) => {
    const normalizedName = walletName.toLowerCase();
    
    // Specific wallet mappings
    const walletIcons = {
        'metamask': 'logos:metamask-icon',
        'coinbase wallet': 'logos:coinbase-icon',
        'trust wallet': 'logos:trust-wallet',
        'walletconnect': 'logos:walletconnect',
        'rainbow': 'logos:rainbow',
        'phantom': 'logos:phantom',
        'brave wallet': 'logos:brave',
        'opera wallet': 'logos:opera',
        'crypto.com': 'logos:crypto-com',
        'binance wallet': 'cryptocurrency:bnb',
        'exodus': 'logos:exodus-icon',
    };

    // Check for exact matches first
    if (walletIcons[normalizedName]) {
        return walletIcons[normalizedName];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(walletIcons)) {
        if (normalizedName.includes(key)) {
            return value;
        }
    }

    // Default icon with wallet color
    return 'solar:wallet-money-bold';
};

const WalletModal = () => {
    const connectors = useConnectors();
    const [pendingConnectorUID, setPendingConnectorUID] = useState(null);
    const [showSuggested, setShowSuggested] = useState(false);

    const walletConnectConnector = connectors.find(
        (connector) => connector.id === "walletConnect"
    );

    const otherConnectors = connectors.filter(
        (connector) => connector.id !== "walletConnect"
    );

    const connectWallet = async (connector) => {
        try {
            setPendingConnectorUID(connector.id);
            await connector.connect();
            toast.success("Wallet connected successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to connect wallet");
        } finally {
            setPendingConnectorUID(null);
        }
    };

    const renderWalletIcon = (walletName, iconClassName = "w-6 h-6") => {
        const iconKey = getWalletIcon(walletName);
        return (
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-colors duration-200">
                <Icon 
                    icon={iconKey} 
                    className={iconClassName}
                    style={{ color: iconKey === 'solar:wallet-money-bold' ? '#3b82f6' : undefined }}
                />
            </div>
        );
    };

    return (
        <Dialog.Root>
            <Dialog.Trigger>
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 transform hover:-translate-y-0.5">
                    <Icon icon="solar:wallet-money-bold" className="w-5 h-5" />
                    Connect Wallet
                </button>
            </Dialog.Trigger>

            <Dialog.Content className="bg-white rounded-2xl p-6 max-w-md w-full">
                <Dialog.Title className="text-2xl font-bold text-gray-900 mb-2">
                    Connect Wallet
                </Dialog.Title>
                <Dialog.Description className="text-gray-600 mb-6">
                    Choose your preferred wallet to connect to our dApp
                </Dialog.Description>

                <div className="space-y-3">
                    {/* Available Wallets */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Available Wallets
                        </h3>
                        {walletConnectConnector && (
                            <button
                                onClick={() => connectWallet(walletConnectConnector)}
                                disabled={pendingConnectorUID === walletConnectConnector.id}
                                className="w-full p-4 rounded-xl border border-gray-200 hover:border-blue-200 bg-white hover:bg-blue-50 transition-all duration-200 flex items-center justify-between group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    {renderWalletIcon('WalletConnect')}
                                    <div className="text-left">
                                        <h3 className="font-semibold text-gray-900">WalletConnect</h3>
                                        <p className="text-sm text-gray-500">Connect with mobile wallet</p>
                                    </div>
                                </div>
                                {pendingConnectorUID === walletConnectConnector.id ? (
                                    <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin text-blue-600" />
                                ) : (
                                    <Icon 
                                        icon="solar:arrow-right-bold" 
                                        className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                                    />
                                )}
                            </button>
                        )}

                        {otherConnectors.map((connector) => (
                            <button
                                key={connector.id}
                                onClick={() => connectWallet(connector)}
                                disabled={pendingConnectorUID === connector.id}
                                className="w-full p-4 rounded-xl border border-gray-200 hover:border-blue-200 bg-white hover:bg-blue-50 transition-all duration-200 flex items-center justify-between group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    {renderWalletIcon(connector.name)}
                                    <div className="text-left">
                                        <h3 className="font-semibold text-gray-900">
                                            {connector.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Connect with browser wallet
                                        </p>
                                    </div>
                                </div>
                                {pendingConnectorUID === connector.id ? (
                                    <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin text-blue-600" />
                                ) : (
                                    <Icon 
                                        icon="solar:arrow-right-bold" 
                                        className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Suggested Wallets */}
                    <div className="pt-4">
                        <button
                            onClick={() => setShowSuggested(!showSuggested)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            <Icon 
                                icon={`solar:alt-arrow-${showSuggested ? 'up' : 'down'}-bold`}
                                className="w-4 h-4"
                            />
                            Show More Wallets
                        </button>

                        {showSuggested && (
                            <div className="space-y-3 mt-3">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    Suggested Wallets
                                </h3>
                                {suggestedWallets.map((wallet) => (
                                    <a
                                        key={wallet.id}
                                        href={wallet.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full p-4 rounded-xl border border-gray-200 hover:border-blue-200 bg-white hover:bg-blue-50 transition-all duration-200 flex items-center justify-between group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            {renderWalletIcon(wallet.name)}
                                            <div className="text-left">
                                                <h3 className="font-semibold text-gray-900">
                                                    {wallet.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {wallet.description}
                                                </p>
                                            </div>
                                        </div>
                                        <Icon 
                                            icon="solar:download-bold" 
                                            className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                                        />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <p className="mt-6 text-center text-sm text-gray-500">
                    By connecting your wallet, you agree to our{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-700">
                        Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-700">
                        Privacy Policy
                    </a>
                </p>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default WalletModal;
