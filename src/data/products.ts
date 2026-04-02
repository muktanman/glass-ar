export interface Product {
  id: string;
  name: string;
  modelUrl: string;
  thumbnail: string;
}

export const products: Product[] = [
  {
    id: "sg-001",
    name: "Aviator Black",
    modelUrl: "/models/aviator.glb",
    thumbnail: "/images/aviator.jpg",
  },
  {
    id: "sg-002",
    name: "Wayfarer Brown",
    modelUrl: "/models/wayfarer.glb",
    thumbnail: "/images/wayfarer.jpg",
  },
  {
    id: "sg-003",
    name: "Round Gold",
    modelUrl: "/models/round.glb",
    thumbnail: "/images/round.jpg",
  },
  {
    id: "sg-004",
    name: "Sport Wrap",
    modelUrl: "/models/sport.glb",
    thumbnail: "/images/sport.jpg",
  },
  {
    id: "sg-005",
    name: "Cat Eye Tortoise",
    modelUrl: "/models/cateye.glb",
    thumbnail: "/images/cateye.png",
  },
];
