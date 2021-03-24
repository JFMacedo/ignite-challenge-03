import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productStock = await api.get<Stock>(`stock/${productId}`);
      
      const cartProduct = cart.find(product => product.id === productId);

      if(cartProduct) {
        const amount = cartProduct.amount + 1;
        updateProductAmount({ productId, amount });
      } else {
        if(productStock.data.amount > 0) {
          const product = await api.get(`products/${productId}`)
    
          setCart([...cart, { ...product.data, amount: 1 }])
    
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {
            ...product.data, amount: 1
          }]));
        } else {
          toast.error('Produto sem estoque!')
        }
      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartProduct = cart.find(product => product.id === productId);

      if(cartProduct) {
        const filteredCart = cart.filter(product => product.id !== productId);
  
        setCart(filteredCart);
  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredCart));
      } else {
        toast.error('Erro na remoção do produto')
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount < 1) {
        toast.error('Erro na alteração de quantidade do produto')
      } else {
        const productStock = await api.get<Stock>(`stock/${productId}`);
  
        if(amount > productStock.data.amount) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          const updatedCart = cart.map(product => product.id === productId ? {
            ...product,
            amount: amount
          } : product );
    
          setCart(updatedCart);
    
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        }
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={ { cart, addProduct, removeProduct, updateProductAmount } }
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
