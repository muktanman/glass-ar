"use client";

import { useState } from "react";
import ARViewer from "@/components/ARViewer";
import ProductSelector from "@/components/ProductSelector";
import { Product } from "@/data/products";

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4 gap-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          glass-ar
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Try on sunglasses in real time
        </p>
      </header>

      <div className="w-full max-w-2xl flex flex-col gap-4">
        <ARViewer selectedProduct={selectedProduct} />

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Choose a style
          </h2>
          <ProductSelector
            selected={selectedProduct}
            onSelect={setSelectedProduct}
          />
        </section>
      </div>
    </main>
  );
}
