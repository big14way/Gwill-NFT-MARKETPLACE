import { Box, Flex } from "@radix-ui/themes";
import React from "react";
import WalletConnection from "./WalletConnection";
import { Icon } from "@iconify/react/dist/iconify.js";

const Header = () => {
    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-lg bg-white/80">
        <Flex
            gap="3"
            width="100%"
            align="center"
            justify="between"
                className="container mx-auto px-4 py-4"
            >
                <Box className="flex items-center gap-2">
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rotate-6 transform transition-transform group-hover:rotate-12 duration-300" />
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 absolute top-0 left-0 flex items-center justify-center transform transition-transform group-hover:rotate-6 duration-300">
                                <span className="text-white font-bold text-xl">G</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    GWILL NFT
                                </h1>
                                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 text-xs font-semibold">
                                    Beta
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">Collect • Trade • Create</p>
                        </div>
                    </div>
                </Box>

                <nav className="hidden md:flex items-center gap-6">
                    <a 
                        href="#" 
                        className="text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer flex items-center gap-2 group"
                    >
                        <div className="p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                            <Icon icon="solar:shop-2-bold" className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Marketplace</span>
                    </a>
                    <a 
                        href="#" 
                        className="text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer flex items-center gap-2 group"
                    >
                        <div className="p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                            <Icon icon="solar:gallery-wide-bold" className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Collection</span>
                    </a>
                    <a 
                        href="#" 
                        className="text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer flex items-center gap-2 group"
                    >
                        <div className="p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                            <Icon icon="solar:chart-bold" className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Stats</span>
                    </a>
                </nav>

            <WalletConnection />
        </Flex>
        </header>
    );
};

export default Header;
