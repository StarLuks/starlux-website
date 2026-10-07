export interface PriceType {
  id: number;
  name: string;
  code1c: string;
  isMain: boolean;
  active: boolean;
  pricesCount: number;
}

export interface ProductGroup {
  id: number;
  name: string;
  code1c: string;
  productsCount: number;
}

export interface ProductImage {
  id: number;
  url: string;
  isMain: boolean;
}

export interface NomProduct {
  id: string;
  groupId: number | null;
  active: boolean;
  name: string;
  fullName: string;
  article: string;
  code1c: string;
  barcode: string;
  unit: string;
  manufacturer: string;
  dimensions: string;
  weight: number;
  pack: string;
  stock: number;
  description: string;
  updatedAt: string;
  images: ProductImage[];
  prices: Record<string, number>;
}

export const fileToBase64 = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  });

export const downloadBase64 = (b64: string, name: string, type: string) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};
