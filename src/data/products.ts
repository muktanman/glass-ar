export interface Product {
  id: string;
  name: string;
  modelUrl: string;
  thumbnail: string;
  price: number;
}

export const products: Product[] = [
  {
    id: "sg-001",
    name: "Aviator Black",
    modelUrl: "/models/aviator.glb",
    thumbnail: "/images/aviator.jpg",
    price: 299,
  },
  {
    id: "sg-002",
    name: "Wayfarer Brown",
    modelUrl: "/models/wayfarer.glb",
    thumbnail: "/images/wayfarer.jpg",
    price: 249,
  },
  {
    id: "sg-003",
    name: "Round Gold",
    modelUrl: "/models/round.glb",
    thumbnail: "/images/round.jpg",
    price: 319,
  },
  {
    id: "sg-004",
    name: "Sport Wrap",
    modelUrl: "/models/sport.glb",
    thumbnail: "/images/sport.jpg",
    price: 199,
  },
  {
    id: "sg-005",
    name: "Cat Eye Tortoise",
    modelUrl: "/models/cateye.glb",
    thumbnail: "/images/cateye.jpg",
    price: 279,
  },
];
