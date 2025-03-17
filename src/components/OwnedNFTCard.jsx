// src/components/OwnedNFTCard.jsx
import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Contract } from "ethers";
import NFT_ABI from "../ABI/nft.json";
import { Icon } from "@iconify/react/dist/iconify.js";
import { truncateString } from "../utils";
import { toast } from "sonner";
import { useAppContext } from "../contexts/appContext";
import { getPublicClient } from "wagmi/actions";

const OwnedNFTCard = ({ metadata, tokenId }) => {
  const [recipient, setRecipient] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { refreshNFTs } = useAppContext();

  const handleTransfer = async () => {
    if (!walletClient || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!recipient) {
      toast.error("Please enter a recipient address");
      return;
    }
    
    if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    setIsTransferring(true);
    const toastId = toast.loading("Preparing transfer...");

    try {
      const publicClient = getPublicClient();
      
      // First check if we have approval for the NFT specifically
      const isApproved = await publicClient.readContract({
        address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'getApproved',
        args: [tokenId],
      });

      // If not approved, request approval
      if (isApproved !== import.meta.env.VITE_NFT_CONTRACT_ADDRESS) {
        toast.loading("Requesting approval...", { id: toastId });
        
        try {
          const { hash: approveHash } = await walletClient.writeContract({
            address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
            abi: NFT_ABI,
            functionName: 'approve',
            args: [import.meta.env.VITE_NFT_CONTRACT_ADDRESS, tokenId],
          });

          toast.loading("Confirming approval...", { id: toastId });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        } catch (approvalError) {
          console.error("Approval error:", approvalError);
          if (approvalError.message?.includes("user rejected")) {
            toast.error("Transfer cancelled: Approval rejected", { id: toastId });
          } else {
            toast.error("Failed to approve transfer", { id: toastId });
          }
          return;
        }
      }

      // Now proceed with the transfer
      toast.loading("Initiating transfer...", { id: toastId });
      
      const { hash } = await walletClient.writeContract({
        address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'transferFrom',
        args: [address, recipient, tokenId],
      });

      toast.loading("Confirming transfer...", { id: toastId });
      await publicClient.waitForTransactionReceipt({ hash });
      
      toast.success("NFT transferred successfully!", { id: toastId });
      setRecipient("");
      setShowTransferModal(false);
      refreshNFTs();
    } catch (error) {
      console.error("Transfer error:", error);
      let errorMessage = "Transfer failed. Please try again.";
      
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        if (error.message.includes("user rejected")) {
          errorMessage = "Transaction was rejected";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas";
        }
      }
      
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleModalClose = () => {
    if (!isTransferring) {
      setShowTransferModal(false);
      setRecipient("");
    }
  };

  return (
    <div className="relative group">
      <div className="w-full space-y-4 rounded-xl bg-white shadow-lg border border-gray-200 p-4 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
        <div className="relative aspect-square overflow-hidden rounded-lg">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gray-200" />
          )}
          <img
            src={metadata.image}
            alt={`${metadata.name} image`}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">{metadata.name}</h1>
          <p className="text-sm text-gray-600">
            {truncateString(metadata.description, 100)}
          </p>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Icon icon="ri:file-list-3-line" className="w-5 h-5" />
            <span className="text-sm">{metadata.attributes.length} Attributes</span>
          </div>
        </div>

        <button
          onClick={() => setShowTransferModal(true)}
          disabled={isTransferring}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:from-gray-400 disabled:to-gray-500 disabled:transform-none"
        >
          {isTransferring ? (
            <>
              <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin" />
              <span>Transferring...</span>
            </>
          ) : (
            <>
              <Icon icon="solar:transfer-horizontal-bold" className="w-5 h-5" />
              <span>Transfer NFT</span>
            </>
          )}
        </button>
      </div>

      {/* Custom Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 relative">
            <button 
              onClick={handleModalClose}
              disabled={isTransferring}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-2">Transfer NFT</h2>
            <p className="text-gray-600 mb-6">
              Enter the recipient's Ethereum address to transfer this NFT.
            </p>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Recipient address (0x...)"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={isTransferring}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleModalClose}
                  disabled={isTransferring}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={isTransferring || !recipient}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isTransferring ? (
                    <>
                      <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin" />
                      <span>Transferring...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:transfer-horizontal-bold" className="w-5 h-5" />
                      <span>Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnedNFTCard;