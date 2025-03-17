// src/components/MyNFTs.jsx
import { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useAppContext } from "../contexts/appContext";
import NFT_ABI from "../ABI/nft.json";
import OwnedNFTCard from "./OwnedNFTCard";
import NFTCard from "./NFTCard";
import { Icon } from "@iconify/react/dist/iconify.js";
import { shortenAddress } from "../utils";
import { useTheme } from "../hooks/useTheme";

const MyNFTs = () => {
  const { address } = useAccount();
  const { tokenMetaData, maxSupply, refreshNFTs, mintPrice, nextTokenId } = useAppContext();
  const [ownedTokens, setOwnedTokens] = useState([]);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [transferHistory, setTransferHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");
  const { theme, toggleTheme } = useTheme();
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!address || !maxSupply) return;

    const fetchTokens = async () => {
      setIsLoading(true);
      try {
        // Create batch calls for ownerOf
        const batchSize = 50; // Process 50 tokens at a time
        const totalSupply = Number(maxSupply);
        const owned = [];
        const available = [];

        for (let i = 0; i < totalSupply; i += batchSize) {
          const end = Math.min(i + batchSize, totalSupply);
          const calls = Array.from({ length: end - i }, (_, index) => ({
            address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
            abi: NFT_ABI,
            functionName: 'ownerOf',
            args: [i + index],
          }));

          const results = await Promise.allSettled(
            calls.map(call => 
              publicClient.readContract(call)
              .catch(() => null) // Handle unminted tokens
            )
          );

          results.forEach((result, index) => {
            const tokenId = i + index;
            if (result.status === 'fulfilled' && result.value) {
              if (result.value.toLowerCase() === address.toLowerCase()) {
                owned.push(tokenId);
              }
            } else {
              available.push(tokenId);
            }
          });
        }

        setOwnedTokens(owned);
        setAvailableTokens(available);
      } catch (error) {
        console.error("Error fetching tokens:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTransferHistory = async () => {
      try {
        // Fetch transfer events in larger chunks
        const fromFilter = {
          address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
          event: 'Transfer',
          args: {
            from: address
          },
          fromBlock: BigInt(0),
          toBlock: 'latest'
        };

        const toFilter = {
          address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
          event: 'Transfer',
          args: {
            to: address
          },
          fromBlock: BigInt(0),
          toBlock: 'latest'
        };

        const [fromEvents, toEvents] = await Promise.all([
          publicClient.getLogs(fromFilter),
          publicClient.getLogs(toFilter)
        ]);

        const allTransfers = [...fromEvents, ...toEvents]
          .sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber))
          .map(event => ({
            tokenId: event.args.tokenId.toString(),
            from: event.args.from,
            to: event.args.to,
            timestamp: new Date(),
            type: event.args.from.toLowerCase() === address.toLowerCase() ? 'sent' : 'received'
          }));

        setTransferHistory(allTransfers);
      } catch (error) {
        console.error("Error fetching transfer history:", error);
      }
    };

    // Fetch data in parallel
    Promise.all([
      fetchTokens(),
      fetchTransferHistory()
    ]);

    // Set up event listener for transfers
    const transferFilter = {
      address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
      event: 'Transfer'
    };

    const unwatch = publicClient.watchEvent({
      ...transferFilter,
      onLogs: (logs) => {
        const relevantTransfer = logs.some(log => 
          log.args.from?.toLowerCase() === address.toLowerCase() ||
          log.args.to?.toLowerCase() === address.toLowerCase()
        );
        if (relevantTransfer) {
          fetchTokens();
          fetchTransferHistory();
        }
      }
    });

    return () => {
      unwatch();
    };
  }, [address, maxSupply, refreshNFTs, publicClient]);

  if (!address) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 px-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        <div className={`w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'} flex items-center justify-center mb-4`}>
          <Icon 
            icon="solar:wallet-money-bold" 
            className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`}
          />
        </div>
        <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className={`text-center max-w-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Please connect your wallet to view your NFT collection and transfer history
        </p>
      </div>
    );
  }

  const TabButton = ({ value, icon, label, count }) => (
    <button
      onClick={() => setActiveTab(value)}
      className={`
        relative flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300
        ${activeTab === value 
          ? `${theme === 'dark' ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-600'} shadow-sm transform scale-105` 
          : `${theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'}`
        }
      `}
    >
      <Icon icon={icon} className={`w-5 h-5 ${activeTab === value ? 'text-current' : ''}`} />
      <span>{label}</span>
      {count > 0 && (
        <span className={`
          absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs flex items-center justify-center
          ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'}
        `}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className={`space-y-6 animate-fadeIn ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className={`flex gap-4 p-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
          <TabButton 
            value="available" 
            icon="solar:shop-2-bold" 
            label="Available" 
            count={availableTokens.length}
          />
          <TabButton 
            value="owned" 
            icon="solar:gallery-wide-bold" 
            label="Owned" 
            count={ownedTokens.length}
          />
          <TabButton 
            value="history" 
            icon="solar:clock-circle-bold" 
            label="History" 
            count={transferHistory.length}
          />
        </div>
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'} shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
        >
          <Icon icon={theme === 'dark' ? 'solar:sun-bold' : 'solar:moon-bold'} className="w-5 h-5" />
        </button>
      </div>

      <div className="min-h-[400px] transition-all duration-300">
        {activeTab === "available" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-full h-[400px] rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse`}
                />
              ))
            ) : availableTokens.length > 0 ? (
              availableTokens.map((tokenId) => (
                <NFTCard
                  key={tokenId}
                  tokenId={tokenId}
                  metadata={tokenMetaData.get(tokenId)}
                  mintPrice={mintPrice}
                  nextTokenId={nextTokenId}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <div className={`w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} flex items-center justify-center mb-4`}>
                  <Icon 
                    icon="solar:shop-2-bold" 
                    className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}
                  />
                </div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>No Available NFTs</h3>
                <p className={`text-center max-w-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  All NFTs in this collection have been minted!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "owned" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-full h-[400px] rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse`}
                />
              ))
            ) : ownedTokens.length > 0 ? (
              ownedTokens.map((tokenId) => (
                <OwnedNFTCard
                  key={tokenId}
                  tokenId={tokenId}
                  metadata={tokenMetaData.get(tokenId)}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <div className={`w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} flex items-center justify-center mb-4`}>
                  <Icon 
                    icon="solar:gallery-wide-bold" 
                    className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}
                  />
                </div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>No NFTs Found</h3>
                <p className={`text-center max-w-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  You don't own any NFTs from this collection yet. Start by minting one!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4 animate-slideUp">
            {transferHistory.length > 0 ? (
              transferHistory.map((transfer, index) => (
                <div
                  key={`${transfer.tokenId}-${index}`}
                  className={`
                    flex items-center justify-between p-6 rounded-xl border
                    ${theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
                      : 'bg-white border-gray-200 hover:border-blue-200'
                    }
                    hover:shadow-md transition-all duration-300 group
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      transition-colors duration-300
                      ${transfer.type === 'sent' 
                        ? theme === 'dark' ? 'bg-red-900/50' : 'bg-red-50'
                        : theme === 'dark' ? 'bg-green-900/50' : 'bg-green-50'
                      }
                    `}>
                      <Icon 
                        icon={transfer.type === 'sent' ? "solar:upload-bold" : "solar:download-bold"}
                        className={`
                          w-6 h-6 transition-colors duration-300
                          ${transfer.type === 'sent' 
                            ? theme === 'dark' ? 'text-red-400' : 'text-red-500'
                            : theme === 'dark' ? 'text-green-400' : 'text-green-500'
                          }
                        `}
                      />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {transfer.type === 'sent' ? 'Sent NFT' : 'Received NFT'}
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {transfer.type === 'sent' ? 'To: ' : 'From: '}
                        <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {shortenAddress(transfer.type === 'sent' ? transfer.to : transfer.from)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Token #{transfer.tokenId}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {transfer.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className={`w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} flex items-center justify-center mb-4`}>
                  <Icon 
                    icon="solar:clock-circle-bold" 
                    className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}
                  />
                </div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                  No Transfer History
                </h3>
                <p className={`text-center max-w-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  You haven't made any transfers yet. Your transfer history will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyNFTs;