import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStored = await AsyncStorage.getItem('products');
      if (productsStored) {
        const productsStoredArr: Product[] = JSON.parse(productsStored);
        setProducts(productsStoredArr);
      }
      setProductsLoaded(true);
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function storeProducts(): Promise<void> {
      await AsyncStorage.setItem('products', JSON.stringify(products));
    }
    if (productsLoaded) {
      storeProducts();
    }
  }, [products, productsLoaded]);

  const addToCart = useCallback(async product => {
    setProducts(oldState => {
      const thisProductInCart = { ...product, quantity: 1 };
      const othersProductsInCart = oldState.filter(item => {
        if (item.id === product.id) {
          thisProductInCart.quantity = item.quantity + 1;
          return false;
        }
        return true;
      });
      return [...othersProductsInCart, thisProductInCart];
    });
  }, []);

  const increment = useCallback(async id => {
    setProducts(oldState => {
      const productsCartUpdated = oldState.map(product => {
        if (product.id === id) {
          return {
            ...product,
            quantity: product.quantity + 1,
          };
        }
        return product;
      });
      return productsCartUpdated;
    });
  }, []);

  const decrement = useCallback(async id => {
    setProducts(oldState => {
      const productsCartUpdated = oldState.reduce(
        (accumulator: Product[], product) => {
          const productUpdated = product;
          if (product.id === id) {
            const { quantity } = product;
            const newQuantity = quantity > 1 ? quantity - 1 : 0;
            if (newQuantity === 0) {
              return accumulator;
            }
            productUpdated.quantity = newQuantity;
          }
          return [...accumulator, productUpdated];
        },
        [],
      );
      return productsCartUpdated;
    });
  }, []);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
