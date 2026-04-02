"use client";

import Image from "next/image";
import { products, Product } from "@/data/products";

interface ProductSelectorProps {
  selected: Product | null;
  onSelect: (product: Product) => void;
}

export default function ProductSelector({
  selected,
  onSelect,
}: ProductSelectorProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onSelect(product)}
          className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
            selected?.id === product.id
              ? "border-blue-500 bg-blue-50"
              : "border-transparent bg-white/70 hover:border-gray-300"
          }`}
        >
          <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden relative">
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/64x64/e5e7eb/9ca3af?text=?";
              }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 text-center leading-tight max-w-[72px]">
            {product.name}
          </span>
        </button>
      ))}
    </div>
  );
}
