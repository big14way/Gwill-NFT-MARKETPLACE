import React from "react";
import { useAccount, useDisconnect, useEnsName } from "wagmi";
import WalletModal from "./WalletModal";
import { shortenAddress } from "../../utils";
import { Flex, Popover } from "@radix-ui/themes";
import { Icon } from "@iconify/react/dist/iconify.js";
import { supportedNetworks } from "../../config/wallet-connection/wagmi";
import { toast } from "sonner";

const WalletConnection = () => {
    const { address } = useAccount();
    const { disconnect } = useDisconnect();
    const { data: ensName } = useEnsName({ address });

    const copyAddress = () => {
        navigator.clipboard.writeText(address);
        toast.success("Address copied to clipboard!");
    };

    if (!address) {
        return <WalletModal />;
    }

    return (
        <Popover.Root>
            <Popover.Trigger>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200 cursor-pointer group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <Icon 
                            icon="mingcute:wallet-4-fill" 
                            className="w-4 h-4 text-white"
                        />
                    </div>
                    <span className="text-gray-700 font-medium">
                        {ensName || shortenAddress(address)}
                    </span>
                    <Icon
                        icon="solar:alt-arrow-down-bold"
                        className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors"
                    />
                </button>
            </Popover.Trigger>

            <Popover.Content className="w-72 p-2 bg-white rounded-xl shadow-xl border border-gray-100">
                <div className="space-y-1">
                    <a
                        href={`${supportedNetworks[0].blockExplorers.default.url}/address/${address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer text-gray-700 hover:text-blue-600"
                    >
                        <Icon icon="solar:eye-bold" className="w-5 h-5" />
                        <span className="font-medium">View on Explorer</span>
                    </a>

                    <button
                        onClick={copyAddress}
                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer text-gray-700 hover:text-blue-600"
                    >
                        <Icon icon="solar:copy-bold" className="w-5 h-5" />
                        <span className="font-medium">Copy Address</span>
                    </button>

                    <button
                        onClick={() => {
                            disconnect();
                            toast.success("Wallet disconnected");
                        }}
                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer text-gray-700 hover:text-red-600"
                    >
                        <Icon icon="solar:logout-2-bold" className="w-5 h-5" />
                        <span className="font-medium">Disconnect</span>
                    </button>
                </div>
            </Popover.Content>
        </Popover.Root>
    );
};

export default WalletConnection;
