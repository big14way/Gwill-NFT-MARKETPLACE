import { Icon } from "@iconify/react/dist/iconify.js";
import React from "react";

const Footer = () => {
    return (
    <footer className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">GWILL NFT</h3>
            <p className="text-blue-100">
              Discover, collect, and trade unique digital assets on our NFT marketplace.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-200 transition-colors">
                <Icon icon="mdi:twitter" className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-blue-200 transition-colors">
                <Icon icon="mdi:discord" className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-blue-200 transition-colors">
                <Icon icon="mdi:github" className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-blue-100 hover:text-white transition-colors">
                  Marketplace
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-100 hover:text-white transition-colors">
                  My NFTs
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-100 hover:text-white transition-colors">
                  Create
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Stay Updated</h3>
            <p className="text-blue-100">
              Subscribe to our newsletter for the latest updates and releases.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg bg-blue-700 text-white placeholder-blue-300 border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-blue-500">
          <p className="text-center text-blue-200">
            © {new Date().getFullYear()} GWILL NFT. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
    );
};

export default Footer;
