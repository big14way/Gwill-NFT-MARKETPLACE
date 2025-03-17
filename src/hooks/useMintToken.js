import { useCallback, useState } from "react";
import { useAccount, useChainId, useWalletClient, usePublicClient } from "wagmi";
import { useAppContext } from "../contexts/appContext";
import NFT_ABI from "../ABI/nft.json";
import { isSupportedNetwork } from "../utils";
import { toast } from "sonner";
import { parseEther } from "viem";

export const useMintToken = () => {
    const { address } = useAccount();
    const chainId = useChainId();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { nextTokenId, maxSupply, mintPrice, refreshNFTs } = useAppContext();
    const [isMinting, setIsMinting] = useState(false);

    const mint = useCallback(async () => {
        if (!address || !walletClient) {
            toast.error("Please connect your wallet");
            return;
        }

        if (!isSupportedNetwork(chainId)) {
            toast.error("Please switch to a supported network");
            return;
        }

        if (isMinting) {
            return;
        }

        try {
            setIsMinting(true);
            
            // Prepare the transaction
            const { request } = await publicClient.simulateContract({
                address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
                abi: NFT_ABI,
                functionName: 'mint',
                value: mintPrice,
                account: address,
            });

            // Send the transaction
            const hash = await walletClient.writeContract(request);
            
            toast.loading("Minting your NFT...");

            // Wait for the transaction
            const receipt = await publicClient.waitForTransactionReceipt({ 
                hash,
                timeout: 30000,
                confirmations: 1
            });

            if (receipt.status === 'success' || receipt.status === 1) {
                toast.success("Successfully minted your NFT!");
                await refreshNFTs();
            } else {
                toast.error("Failed to mint NFT");
            }

        } catch (error) {
            console.error("Mint error:", error);
            if (error.message?.includes("user rejected")) {
                toast.error("Transaction rejected");
            } else if (error.message?.includes("insufficient funds")) {
                toast.error("Insufficient funds");
            } else {
                toast.error("Failed to mint NFT");
            }
        } finally {
            setIsMinting(false);
        }
    }, [address, chainId, walletClient, publicClient, mintPrice, isMinting, refreshNFTs]);

    return {
        mint,
        isMinting,
        isReady: !!walletClient && !!address && isSupportedNetwork(chainId)
    };
};
