import { Icon } from "@iconify/react/dist/iconify.js";
import { formatEther } from "viem";
import React from "react";
import { truncateString } from "../../utils";
import { useMintToken } from "../../hooks/useMintToken";

const NFTCard = ({ metadata, mintPrice, tokenId, nextTokenId }) => {
    const { mint, isMinting, isReady } = useMintToken();

    const isNextToken = Number(nextTokenId) === tokenId;
    const isOwned = Number(nextTokenId) > tokenId;

    return (
        <div className="w-full space-y-4 rounded-xl bg-secondary shadow-sm border border-primary p-2">
            <img
                src={metadata.image}
                alt={`${metadata.name} image`}
                className="rounded-xl w-full h-64"
            />
            <h1 className="font-bold">{metadata.name}</h1>
            <p className="text-s">
                {truncateString(metadata.description, 100)}
            </p>

            <div className="flex gap-2">
                <Icon icon="ri:file-list-3-line" className="w-6 h-6" />
                <span>{metadata.attributes.length} Attributes</span>
            </div>

            <div className="flex gap-2">
                <Icon icon="ri:eth-line" className="w-6 h-6" />
                <span>{`${formatEther(mintPrice)} ETH`}</span>
            </div>

            <button
                disabled={!isReady || !isNextToken || isMinting}
                onClick={mint}
                className="w-full p-4 bg-primary/80 rounded-md text-secondary font-bold disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {isOwned ? "Owned" : 
                 isMinting ? "Minting..." :
                 !isReady ? "Connect Wallet" :
                 "Mint NFT"}
            </button>
        </div>
    );
};

export default NFTCard;
