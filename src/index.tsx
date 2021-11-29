import * as React from "react";
import { createMachine, assign } from "xstate";
import useLocalStorage from "./useLocalStorage";
import { useMachine } from "@xstate/react";

interface Item {
  id: string;
  price: number;
  quantity?: number;
  currency?: string;
  itemTotal?: number;
  [key: string]: any;
}

interface InitialState {
  id: string;
  items: Item[];
  isEmpty: boolean;
  totalItems: number;
  totalUniqueItems: number;
  cartTotal: number;
  metadata?: Metadata;
}

interface Metadata {
  [key: string]: any;
}

interface CartProviderState extends InitialState {
  addItem: (item: Item, quantity?: number) => void;
  removeItem: (id: Item["id"]) => void;
  updateItem: (id: Item["id"], payload: object) => void;
  setItems: (items: Item[]) => void;
  updateItemQuantity: (id: Item["id"], quantity: number) => void;
  emptyCart: () => void;
  getItem: (id: Item["id"]) => any | undefined;
  inCart: (id: Item["id"]) => boolean;
  clearCartMetadata: () => void;
  setCartMetadata: (metadata: Metadata) => void;
  updateCartMetadata: (metadata: Metadata) => void;
  service: any;
}

export type Events =
  | { type: "SET_ITEMS"; payload: Item[] }
  | { type: "ADD_ITEM"; payload: Item }
  | { type: "REMOVE_ITEM"; id: Item["id"] }
  | {
      type: "UPDATE_ITEM";
      id: Item["id"];
      payload: object;
    }
  | { type: "EMPTY_CART" }
  | { type: "CLEAR_CART_META" }
  | { type: "SET_CART_META"; payload: Metadata }
  | { type: "UPDATE_CART_META"; payload: Metadata };

export const initialState: any = {
  items: [],
  isEmpty: true,
  totalItems: 0,
  totalUniqueItems: 0,
  cartTotal: 0,
  metadata: {},
};

const shoppingCartMachine = createMachine<InitialState, Events>(
  {
    id: "shoppingCart",
    context: {
      id: "",
      items: [],
      isEmpty: true,
      totalItems: 0,
      totalUniqueItems: 0,
      cartTotal: 0,
      metadata: {},
    },
    initial: "empty",
    states: {
      empty: {
        on: {
          SET_ITEMS: {
            target: "filled",
            actions: "setItems",
          },
          ADD_ITEM: {
            target: "adding",
            actions: "addItem",
          },
        },
      },
      adding: {
        after: {
          // after 1 second, transition to yellow
          1000: { target: "filled" },
        },
      },
      filled: {
        on: {
          EMPTY_CART: {
            actions: "emptyCart",
          },
          ADD_ITEM: {
            target: "adding",
            actions: "addItem",
          },
          REMOVE_ITEM: [
            { actions: "removeItem" },
            // Only transition to 'empty' if the guard (cond) evaluates to true
            {
              target: "empty",
              cond: "isCartEmpty",
            },
          ],
          UPDATE_ITEM: {
            actions: "updateItem",
          },
        },
      },
      checkingOut: {},
    },
    on: {
      CLEAR_CART_META: {
        actions: "clearMeta",
      },
      SET_CART_META: {
        actions: "setMeta",
      },
      UPDATE_CART_META: {
        actions: "updateMeta",
      },
      UPDATE_ITEM: {
        actions: "updateItem",
      },
      REMOVE_ITEM: {
        actions: "removeItem",
      },
      EMPTY_CART: {
        actions: "emptyCart",
      },
    },
  },
  {
    actions: {
      setItems: assign((context, event) => {
        if (event.type !== "SET_ITEMS") return {};
        return generateCartState(context, event.payload);
      }),
      addItem: assign((context, event) => {
        if (event.type !== "ADD_ITEM") return {};
        const items = [...context.items, event.payload];
        return generateCartState(context, items);
      }),
      updateItem: assign((context, event) => {
        if (event.type !== "UPDATE_ITEM") return {};
        const items = context.items.map((item: Item) => {
          if (item.id !== event.id) return item;

          return {
            ...item,
            ...event.payload,
          };
        });

        return generateCartState(context, items);
      }),
      emptyCart: assign((_context, event) => {
        if (event.type !== "EMPTY_CART") return {};
        return initialState;
      }),
      removeItem: assign((context, event) => {
        if (event.type !== "REMOVE_ITEM") return {};
        const items = context.items.filter((i: Item) => i.id !== event.id);

        return generateCartState(context, items);
      }),
      clearMeta: assign({
        metadata: (_context, _event) => {
          return {};
        },
      }),
      setMeta: assign({
        metadata: (_context, event) => {
          if (event.type !== "SET_CART_META") return {};
          return {
            ...event.payload,
          };
        },
      }),
      updateMeta: assign({
        metadata: (context, event) => {
          if (event.type !== "UPDATE_CART_META") return {};
          return {
            ...context.metadata,
            ...event.payload,
          };
        },
      }),
    },

    guards: {
      isCartEmpty: context => context.isEmpty,
    },
  }
);

const CartContext = React.createContext<CartProviderState | undefined>(
  initialState
);

export const useCart = () => {
  const context = React.useContext(CartContext);

  if (!context) throw new Error("Expected to be wrapped in a CartProvider");

  return context;
};

export const createCartIdentifier = (len = 12) =>
  [...Array(len)].map(() => (~~(Math.random() * 36)).toString(36)).join("");

const generateCartState = (state = initialState, items: Item[]) => {
  const totalUniqueItems = calculateUniqueItems(items);
  const isEmpty = totalUniqueItems === 0;

  return {
    ...initialState,
    ...state,
    items: calculateItemTotals(items),
    totalItems: calculateTotalItems(items),
    totalUniqueItems,
    cartTotal: calculateTotal(items),
    isEmpty,
  };
};

const calculateItemTotals = (items: Item[]) =>
  items.map(item => ({
    ...item,
    itemTotal: item.price * item.quantity!,
  }));

const calculateTotal = (items: Item[]) =>
  items.reduce((total, item) => total + item.quantity! * item.price, 0);

const calculateTotalItems = (items: Item[]) =>
  items.reduce((sum, item) => sum + item.quantity!, 0);

const calculateUniqueItems = (items: Item[]) => items.length;

export const CartProvider: React.FC<{
  children?: React.ReactNode;
  id?: string;
  defaultItems?: Item[];
  onSetItems?: (items: Item[]) => void;
  onItemAdd?: (payload: Item) => void;
  onItemUpdate?: (payload: object) => void;
  onItemRemove?: (id: Item["id"]) => void;
  storage?: (
    key: string,
    initialValue: string
  ) => [string, (value: Function | string) => void];
  metadata?: Metadata;
}> = ({
  children,
  id: cartId,
  defaultItems = [],
  onSetItems,
  onItemAdd,
  onItemUpdate,
  onItemRemove,
  storage = useLocalStorage,
  metadata,
}) => {
  const id = cartId ? cartId : createCartIdentifier();

  //TODO: check declaration on top
  const initstate = { ...initialState, id };

  //load persisted cart state
  //@ts-ignore
  const [savedCart, saveCart] = storage(
    cartId ? `react-use-cart-${id}` : `react-use-cart`,
    ""
  );

  //@ts-ignore
  const [current, send, service] = useMachine(shoppingCartMachine, {
    context: {
      ...initstate,
      metadata,
      id,
      items: defaultItems,
    },
    // state: JSON.parse(savedCart) ? JSON.parse(savedCart): undefined ,
    devTools: true,
  });

  const state = current.context;

  //save the state of the machine on each update
  React.useEffect(() => {
    const subscription = service.subscribe(state => {
      saveCart(JSON.stringify(state));
    });

    return subscription.unsubscribe;
  }, [service]);

  // Interface functions
  const setItems = (items: Item[]) => {
    service.send({
      type: "SET_ITEMS",
      payload: items.map(item => ({
        ...item,
        quantity: item.quantity || 1,
      })),
    });

    onSetItems && onSetItems(items);
  };

  const addItem = (item: Item, quantity: number = 1) => {
    if (!item.id) throw new Error("You must provide an `id` for items");
    if (quantity <= 0) return;

    const currentItem = state.items.find((i: Item) => i.id === item.id);

    if (!currentItem && !item.hasOwnProperty("price"))
      throw new Error("You must pass a `price` for new items");

    if (!currentItem) {
      const payload = { ...item, quantity };

      service.send({ type: "ADD_ITEM", payload });

      //listeners
      onItemAdd && onItemAdd(payload);

      return;
    }

    //@ts-ignore
    const payload = { ...item, quantity: currentItem.quantity + quantity };

    service.send({ type: "UPDATE_ITEM", id: item.id, payload });

    //listeners
    onItemUpdate && onItemUpdate(payload);
  };

  const updateItem = (id: Item["id"], payload: object) => {
    if (!id || !payload) {
      return;
    }

    service.send({ type: "UPDATE_ITEM", id, payload });

    onItemUpdate && onItemUpdate(payload);
  };

  const updateItemQuantity = (id: Item["id"], quantity: number) => {
    if (quantity <= 0) {
      service.send({ type: "REMOVE_ITEM", id });
      onItemRemove && onItemRemove(id);
      return;
    }

    const currentItem = state.items.find((item: Item) => item.id === id);

    if (!currentItem) throw new Error("No such item to update");

    const payload = { ...currentItem, quantity };

    service.send({
      type: "UPDATE_ITEM",
      id,
      payload,
    });

    onItemUpdate && onItemUpdate(payload);
  };

  const removeItem = (id: Item["id"]) => {
    if (!id) return;

    service.send({ type: "REMOVE_ITEM", id });
    onItemRemove && onItemRemove(id);
  };

  const emptyCart = () => {
    service.send({
      type: "EMPTY_CART",
    });
  };
  const getItem = (id: Item["id"]) =>
    state.items.find((i: Item) => i.id === id);

  const inCart = (id: Item["id"]) => state.items.some((i: Item) => i.id === id);

  const clearCartMetadata = () => {
    service.send({
      type: "CLEAR_CART_META",
    });
  };

  const setCartMetadata = (metadata: Metadata) => {
    if (!metadata) return;

    service.send({
      type: "SET_CART_META",
      payload: metadata,
    });
  };

  const updateCartMetadata = (metadata: Metadata) => {
    if (!metadata) return;

    service.send({
      type: "UPDATE_CART_META",
      payload: metadata,
    });
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        getItem,
        inCart,
        setItems,
        addItem,
        updateItem,
        updateItemQuantity,
        removeItem,
        emptyCart,
        clearCartMetadata,
        setCartMetadata,
        updateCartMetadata,
        //xstate machine
        service,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
