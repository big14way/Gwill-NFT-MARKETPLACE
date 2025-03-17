// src/components/OwnedNFTCard.jsx
import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import NFT_ABI from "../ABI/nft.json";
import { Icon } from "@iconify/react/dist/iconify.js";
import { truncateString } from "../utils";
import { toast } from "sonner";
import { useAppContext } from "../contexts/appContext";
import { useTheme } from "../hooks/useTheme";

const OwnedNFTCard = ({ metadata, tokenId }) => {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [transferStatus, setTransferStatus] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { refreshNFTs } = useAppContext();
  const { theme } = useTheme();

  // Verify ownership before transfer
  const verifyOwnership = async () => {
    try {
      const owner = await publicClient.readContract({
        address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)],
      });
      return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error("Ownership verification error:", error);
      return false;
    }
  };

  const waitForTransaction = async (hash, description) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts with 2-second intervals = 60 seconds total
    
    while (attempts < maxAttempts) {
      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: 2_000, // 2 seconds per attempt
          confirmations: 1,
        });
        return receipt;
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
          throw new Error(`${description} confirmation timed out after 60 seconds`);
        }
        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const handleTransfer = async () => {
    setTransferError("");
    setTransferStatus(null);
    setIsTransferring(true);
    const toastId = toast.loading("Preparing transfer...");

    try {
      if (!walletClient || !address) {
        throw new Error("Please connect your wallet first");
      }

      if (!recipientAddress || !recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error("Invalid recipient address");
      }

      // Validate tokenId
      if (tokenId === undefined || tokenId === null) {
        throw new Error("Invalid token ID");
      }

      // Verify ownership before proceeding
      const isOwner = await verifyOwnership();
      if (!isOwner) {
        throw new Error("You are not the owner of this NFT");
      }

      const tokenIdBigInt = BigInt(tokenId);

      // First check if we have approval
      const isApproved = await publicClient.readContract({
        address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'getApproved',
        args: [tokenIdBigInt],
      });

      // Request approval if needed
      if (isApproved.toLowerCase() !== recipientAddress.toLowerCase()) {
        toast.loading("Requesting approval...", { id: toastId });
        
        try {
          // Simulate approval transaction first
          const { request: approvalRequest } = await publicClient.simulateContract({
            address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
            abi: NFT_ABI,
            functionName: 'approve',
            args: [recipientAddress, tokenIdBigInt],
            account: address,
          });

          // Send approval transaction
          const { hash: approveHash } = await walletClient.writeContract(approvalRequest);
          
          if (!approveHash) {
            throw new Error("Failed to submit approval transaction");
          }

          toast.loading("Confirming approval...", { id: toastId });
          
          // Wait for approval confirmation with retries
          await waitForTransaction(approveHash, "Approval");

          // Verify approval was successful
          const approvalCheck = await publicClient.readContract({
            address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
            abi: NFT_ABI,
            functionName: 'getApproved',
            args: [tokenIdBigInt],
          });

          if (approvalCheck.toLowerCase() !== recipientAddress.toLowerCase()) {
            throw new Error("Approval verification failed");
          }

        } catch (approvalError) {
          console.error("Approval error details:", approvalError);
          if (approvalError.message?.includes("user rejected")) {
            throw new Error("Transfer cancelled: Approval rejected");
          } else {
            throw new Error(`Approval failed: ${approvalError.message}`);
          }
        }
      }

      // Proceed with transfer
      toast.loading("Initiating transfer...", { id: toastId });
      
      try {
        // Verify ownership again before transfer
        const isStillOwner = await verifyOwnership();
        if (!isStillOwner) {
          throw new Error("Ownership verification failed");
        }

        // Prepare transfer parameters
        const transferParams = {
          address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
          abi: NFT_ABI,
          functionName: 'transferFrom',
          args: [address, recipientAddress, tokenIdBigInt],
          account: address,
        };

        // Simulate transfer transaction
        const { request } = await publicClient.simulateContract(transferParams);

        // Send transfer transaction with explicit gas estimation
        let transferHash;
        try {
          const tx = await walletClient.writeContract(request);
          transferHash = tx.hash;
        } catch (writeError) {
          console.error("Write contract error:", writeError);
          if (writeError.message?.includes("user rejected")) {
            throw new Error("Transfer cancelled by user");
          } else if (writeError.message?.includes("insufficient funds")) {
            throw new Error("Insufficient funds for gas");
          } else {
            throw new Error(`Transaction failed: ${writeError.message}`);
          }
        }

        if (!transferHash) {
          throw new Error("No transaction hash received");
        }

        toast.loading("Confirming transfer...", { id: toastId });
        
        // Wait for transfer confirmation with retries
        let receipt;
        try {
          receipt = await waitForTransaction(transferHash, "Transfer");
          
          if (!receipt || !receipt.status) {
            throw new Error("Transaction failed on-chain");
          }
        } catch (confirmError) {
          console.error("Confirmation error:", confirmError);
          throw new Error(`Transfer confirmation failed: ${confirmError.message}`);
        }

        // Add small delay before verification to allow chain to update
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify transfer was successful
        try {
          const newOwner = await publicClient.readContract({
            address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
            abi: NFT_ABI,
            functionName: 'ownerOf',
            args: [tokenIdBigInt],
          });

          if (newOwner.toLowerCase() !== recipientAddress.toLowerCase()) {
            throw new Error("Transfer verification failed - ownership not updated");
          }
        } catch (verifyError) {
          console.error("Verification error:", verifyError);
          throw new Error("Could not verify transfer completion");
        }

        setTransferStatus('success');
        toast.success("NFT transferred successfully!", { id: toastId });
        
        setTimeout(() => {
          setShowTransferModal(false);
          setTransferStatus(null);
          setRecipientAddress("");
        }, 2000);

        // Only refresh NFTs after confirmed successful transfer
        refreshNFTs();
      } catch (transferError) {
        console.error("Transfer error details:", transferError);
        throw new Error(transferError.message || "Transfer failed");
      }
    } catch (error) {
      console.error("Transfer error:", error);
      setTransferError(error.message || "Transfer failed");
      setTransferStatus('error');
      toast.error(error.message || "Transfer failed", { id: toastId });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleModalClose = () => {
    if (!isTransferring) {
      setShowTransferModal(false);
      setRecipientAddress("");
      setTransferError("");
      setTransferStatus(null);
    }
  };

  return (
    <div className="relative group">
      <div className={`
        w-full space-y-4 rounded-xl shadow-lg border p-4 transform transition-all duration-300 
        hover:scale-[1.02] hover:shadow-xl
        ${theme === 'dark' 
          ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
          : 'bg-white border-gray-200 hover:border-blue-200'
        }
      `}>
        <div className="relative aspect-square overflow-hidden rounded-lg">
          {!imageLoaded && (
            <div className={`absolute inset-0 animate-pulse ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
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
          <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {metadata.name}
          </h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {truncateString(metadata.description, 100)}
          </p>
          
          <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <Icon icon="ri:file-list-3-line" className="w-5 h-5" />
            <span className="text-sm">{metadata.attributes.length} Attributes</span>
          </div>
        </div>

        <button
          onClick={() => setShowTransferModal(true)}
          disabled={isTransferring}
          className={`
            w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 
            transition-all duration-200 transform hover:-translate-y-0.5
            ${theme === 'dark'
              ? 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-700'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
            }
            disabled:cursor-not-allowed disabled:transform-none
          `}
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

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className={`
            max-w-md w-full mx-4 p-6 rounded-xl shadow-2xl relative
            ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
          `}>
            <button 
              onClick={handleModalClose}
              disabled={isTransferring}
              className={`
                absolute top-4 right-4 disabled:opacity-50
                ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}
              `}
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>

            <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Transfer NFT
            </h2>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Enter the recipient's Ethereum address to transfer this NFT.
            </p>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Recipient address (0x...)"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  disabled={isTransferring}
                  className={`
                    w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 
                    disabled:opacity-50 transition-all duration-200
                    ${theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }
                  `}
                />
              </div>

              {transferError && (
                <p className="text-red-500 text-sm">{transferError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleModalClose}
                  disabled={isTransferring}
                  className={`
                    flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200
                    disabled:opacity-50
                    ${theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={isTransferring || !recipientAddress}
                  className={`
                    flex-1 py-3 px-4 rounded-xl font-semibold
                    transition-all duration-200 flex items-center justify-center gap-2
                    ${theme === 'dark'
                      ? 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
                    }
                    disabled:cursor-not-allowed
                  `}
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