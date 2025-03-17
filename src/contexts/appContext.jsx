import { Contract } from "ethers";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getReadOnlyProvider } from "../utils";
import NFT_ABI from "../ABI/nft.json";

const appContext = createContext();

export const useAppContext = () => {
  const context = useContext(appContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [nextTokenId, setNextTokenId] = useState(null);
  const [maxSupply, setMaxSupply] = useState(null);
  const [baseTokenURI, setBaseTokenURI] = useState("");
  const [tokenMetaData, setTokenMetaData] = useState(new Map());
  const [mintPrice, setMintPrice] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshNFTs = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const contract = new Contract(
      import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
      NFT_ABI,
      getReadOnlyProvider()
    );

    // Listen for Minted event
    const handleMinted = async (to, tokenId) => {
      setNextTokenId(tokenId.add(1)); // Update nextTokenId after mint
      refreshNFTs();
    };
    contract.on("Minted", handleMinted);

    // Initial state fetches
    const fetchContractData = async () => {
      try {
        const [id, uri, supply, price] = await Promise.all([
          contract.nextTokenId(),
          contract.baseTokenURI(),
          contract.maxSupply(),
          contract.mintPrice()
        ]);
        setNextTokenId(id);
        setBaseTokenURI(uri);
        setMaxSupply(supply);
        setMintPrice(price);
      } catch (error) {
        console.error("Error fetching contract data:", error);
      }
    };

    fetchContractData();

    // Cleanup listener on unmount
    return () => {
      contract.removeListener("Minted", handleMinted);
    };
  }, [refreshTrigger]); // Add refreshTrigger to dependencies

  useEffect(() => {
    if (!maxSupply || !baseTokenURI) return;
    const tokenIds = Array.from({ length: Number(maxSupply) }, (_, i) => i);
    const promises = tokenIds.map((id) =>
      fetch(`${baseTokenURI}${id}.json`)
        .then((response) => response.json())
        .then((data) => data)
    );
    Promise.all(promises)
      .then((responses) => {
        const tokenMetaData = new Map();
        responses.forEach((response, index) => {
          tokenMetaData.set(index, response);
        });
        setTokenMetaData(tokenMetaData);
      })
      .catch(console.error);
  }, [baseTokenURI, maxSupply]);

  return (
    <appContext.Provider
      value={{ 
        nextTokenId, 
        maxSupply, 
        baseTokenURI, 
        tokenMetaData, 
        mintPrice,
        refreshNFTs 
      }}
    >
      {children}
    </appContext.Provider>
  );
};