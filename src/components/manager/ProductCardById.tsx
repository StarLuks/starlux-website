import { useEffect, useState } from "react";
import ProductCard from "@/components/manager/ProductCard";
import { api } from "@/lib/api";
import { NomProduct, PriceType, ProductGroup } from "@/lib/nomenclature";
import { toast } from "@/hooks/use-toast";

interface Props {
  productId: string | null;
  onClose: () => void;
  onSaved?: () => void;
}

type Data = { products: NomProduct[]; groups: ProductGroup[]; priceTypes: PriceType[] };

const ProductCardById = ({ productId, onClose, onSaved }: Props) => {
  const [data, setData] = useState<Data | null>(null);
  const [product, setProduct] = useState<NomProduct | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const d = data ?? (await api<Data>("nomenclature", {}));
        if (cancelled) return;
        setData(d);
        const p = d.products.find((x) => x.id === productId);
        if (!p) {
          toast({ title: "Товар не найден", description: "Возможно, он был удалён из номенклатуры." });
          onClose();
          return;
        }
        setProduct(p);
      } catch (e) {
        toast({ title: "Не удалось открыть карточку", description: (e as Error).message });
        onClose();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return (
    <ProductCard
      product={product}
      isNew={false}
      groups={data?.groups ?? []}
      priceTypes={data?.priceTypes ?? []}
      onClose={() => {
        setProduct(null);
        onClose();
      }}
      onSaved={() => {
        setData(null);
        onSaved?.();
      }}
    />
  );
};

export default ProductCardById;
