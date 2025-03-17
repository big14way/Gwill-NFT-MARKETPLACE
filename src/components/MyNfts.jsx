// src/components/MyNFTs.jsx
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useAppContext } from "../contexts/appContext";
import { Contract } from "ethers";
import NFT_ABI from "../ABI/nft.json";
import { getReadOnlyProvider } from "../utils";
import OwnedNFTCard from "./OwnedNFTCard";
import { Tabs } from "@radix-ui/themes";
import { Icon } from "@iconify/react/dist/iconify.js";
import { shortenAddress } from "../utils";

const MyNFTs = () => {
  const { address } = useAccount();
  const { tokenMetaData, maxSupply, refreshNFTs } = useAppContext();
  const [ownedTokens, setOwnedTokens] = useState([]);
  const [transferHistory, setTransferHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address || !maxSupply) return;

    const contract = new Contract(
      import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
      NFT_ABI,
      getReadOnlyProvider()
    );

    const fetchOwnedTokens = async () => {
      setIsLoading(true);
      try {
      const tokens = [];
      for (let i = 0; i < Number(maxSupply); i++) {
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === address.toLowerCase()) {
            tokens.push(i);
          }
        } catch (error) {
          // Token not minted yet, skip
        }
      }
      setOwnedTokens(tokens);
      } catch (error) {
        console.error("Error fetching owned tokens:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTransferHistory = async () => {
      try {
        // Get transfer events where the user is either sender or receiver
        const filterFrom = contract.filters.Transfer(address, null, null);
        const filterTo = contract.filters.Transfer(null, address, null);
        
        const [fromEvents, toEvents] = await Promise.all([
          contract.queryFilter(filterFrom),
          contract.queryFilter(filterTo)
        ]);

        const allTransfers = [...fromEvents, ...toEvents]
          .sort((a, b) => b.blockNumber - a.blockNumber)
          .map(event => ({
            tokenId: event.args.tokenId.toString(),
            from: event.args.from,
            to: event.args.to,
            timestamp: new Date(), // In a real app, you'd get this from block timestamp
            type: event.args.from.toLowerCase() === address.toLowerCase() ? 'sent' : 'received'
          }));

        setTransferHistory(allTransfers);
      } catch (error) {
        console.error("Error fetching transfer history:", error);
      }
    };

    fetchOwnedTokens();
    fetchTransferHistory();

    // Listen for Transfer events
    const transferFilter = contract.filters.Transfer(null, null, null);
    contract.on(transferFilter, (from, to, tokenId) => {
      if (from.toLowerCase() === address.toLowerCase() || 
          to.toLowerCase() === address.toLowerCase()) {
        fetchOwnedTokens();
        fetchTransferHistory();
      }
    });

    return () => {
      contract.removeAllListeners(transferFilter);
    };
  }, [address, maxSupply, refreshNFTs]);

  if (!address) {
    return (
      <div className="text-center py-12">
        <Icon icon="solar:wallet-money-bold" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Please connect your wallet to view your NFTs</p>
      </div>
    );
  }

  return (
    <div>
      <Tabs.Root defaultValue="owned">
        <Tabs.List className="flex space-x-2 border-b border-gray-200 mb-6">
          <Tabs.Trigger
            value="owned"
            className="px-6 py-3 text-gray-600 hover:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-all duration-200"
          >
            <span className="flex items-center gap-2">
              <Icon icon="solar:gallery-wide-bold" className="w-5 h-5" />
              My NFTs
            </span>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="history"
            className="px-6 py-3 text-gray-600 hover:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-all duration-200"
          >
            <span className="flex items-center gap-2">
              <Icon icon="solar:clock-circle-bold" className="w-5 h-5" />
              Transfer History
            </span>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="owned" className="focus:outline-none">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="rounded-xl bg-gray-200 aspect-square mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2 w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : ownedTokens.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ownedTokens.map((tokenId) => (
            <OwnedNFTCard
              key={tokenId}
              metadata={tokenMetaData.get(tokenId)}
              tokenId={tokenId}
            />
          ))}
        </div>
      ) : (
            <div className="text-center py-12">
              <Icon icon="solar:box-minimalistic-bold" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">You don't own any NFTs yet</p>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="history" className="focus:outline-none">
          <div className="space-y-4">
            {transferHistory.length > 0 ? (
              transferHistory.map((transfer, index) => (
                <div
                  key={`${transfer.tokenId}-${index}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-200 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      transfer.type === 'sent' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <Icon 
                        icon={transfer.type === 'sent' ? "solar:upload-bold" : "solar:download-bold"}
                        className={`w-5 h-5 ${
                          transfer.type === 'sent' ? 'text-red-600' : 'text-green-600'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {transfer.type === 'sent' ? 'Sent NFT' : 'Received NFT'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {transfer.type === 'sent' ? 'To: ' : 'From: '}
                        {shortenAddress(transfer.type === 'sent' ? transfer.to : transfer.from)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">Token #{transfer.tokenId}</p>
                    <p className="text-sm text-gray-500">
                      {transfer.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Icon icon="solar:clock-circle-bold" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No transfer history yet</p>
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default MyNFTs;