// src/App.jsx
import Header from "./components/Header";
import Footer from "./components/Footer";
import { useAppContext } from "./contexts/appContext";
import NFTCard from "./components/NFTCard";
import { useMintToken } from "./hooks/useMintToken";
import { Tabs } from "@radix-ui/themes";
import MyNFTs from "./components/MyNfts";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Toaster } from "sonner";

function App() {
  const { nextTokenId, tokenMetaData, mintPrice } = useAppContext();
  const tokenMetaDataArray = Array.from(tokenMetaData.values());
  const mintToken = useMintToken();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Toaster position="top-center" />
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs.Root
          defaultValue="mint"
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <Tabs.List className="flex space-x-2 border-b border-gray-200 mb-6">
            <Tabs.Trigger
              value="mint"
              className="px-6 py-3 text-gray-600 hover:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-all duration-200"
            >
              <span className="flex items-center gap-2">
                <Icon icon="solar:hand-stars-bold" className="w-5 h-5" />
                Mint NFTs
              </span>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="my-nfts"
              className="px-6 py-3 text-gray-600 hover:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-all duration-200"
            >
              <span className="flex items-center gap-2">
                <Icon icon="solar:gallery-wide-bold" className="w-5 h-5" />
                My NFTs
              </span>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="mint" className="focus:outline-none">
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 blur-xl opacity-20 rounded-3xl" />
                  <h1 className="relative text-4xl md:text-5xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent py-2">
                    NFT Marketplace
                  </h1>
                </div>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                Discover and collect extraordinary NFTs from our curated collection. 
                Each piece is unique, verified, and ready to become part of your digital legacy.
              </p>
              <div className="flex items-center justify-center gap-8 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{tokenMetaDataArray.length}</div>
                  <div className="text-sm text-gray-500">Total Items</div>
                </div>
                <div className="h-10 w-px bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{Number(nextTokenId)}</div>
                  <div className="text-sm text-gray-500">Items Minted</div>
                </div>
                <div className="h-10 w-px bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">
                    {tokenMetaDataArray.length - Number(nextTokenId)}
                  </div>
                  <div className="text-sm text-gray-500">Available</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <Icon icon="solar:hand-stars-bold" className="w-8 h-8 text-blue-600 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Mint NFT</h2>
                <p className="text-gray-600">
                  Create your unique digital asset and join our vibrant community.
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                <Icon icon="solar:gallery-wide-bold" className="w-8 h-8 text-purple-600 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Manage NFTs</h2>
                <p className="text-gray-600">
                  View and manage your collection with ease.
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200">
                <Icon icon="solar:shop-2-bold" className="w-8 h-8 text-pink-600 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Trade NFTs</h2>
                <p className="text-gray-600">
                  Buy, sell, and transfer NFTs in our secure marketplace.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tokenMetaDataArray.map((token, i) => (
                <NFTCard
                  key={token.name.split(" ").join("")}
                  metadata={token}
                  mintPrice={mintPrice}
                  tokenId={i}
                  nextTokenId={nextTokenId}
                  mintNFT={mintToken}
                />
              ))}
            </div>
          </Tabs.Content>

          <Tabs.Content value="my-nfts" className="focus:outline-none">
            <MyNFTs />
          </Tabs.Content>
        </Tabs.Root>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
