import * as React from "react";
import * as ReactDOM from "react-dom";
import { CartProvider, useCart } from "../.";

function Page() {
  const { addItem, inCart } = useCart();

  const products = [
    {
      id: 1,
      name: "Malm",
      price: 14500,
    },
    {
      id: 2,
      name: "Nordli",
      price: 16500,
    },
    {
      id: 3,
      name: "Kullen",
      price: 4500,
    },
  ];

  return (
    <div>
      {products.map(p => {
        const alreadyAdded = inCart(p.id);

        return (
          <div key={p.id}>
            <button data-testid="add-item-button" onClick={() => addItem(p)}>
              {alreadyAdded ? "Add again" : "Add to Cart"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Cart() {
  const {
    isEmpty,
    cartTotal,
    totalUniqueItems,
    items,
    updateItemQuantity,
    removeItem,
    emptyCart,
    updateItem,
    service,
  } = useCart();
  if (isEmpty)
    return (
      <div>
        <h1 data-testid="zop">Cart</h1>
        <p>Your cart is empty</p>
      </div>
    );

  return (
    <>
      <h1 data-testid="zop">Cart</h1>
      <div data-testid="cart-filled">
        ({totalUniqueItems} - {cartTotal})
      </div>

      {!isEmpty && <button data-testid="empty-cart-button" onClick={emptyCart}>Empty cart</button>}

      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.quantity} x {item.name}
            <button
              data-testid="decrease-quantity-button"
              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
            >
              -
            </button>
            <button
              data-testid="increase-quantity-button"
              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
            >
              +
            </button>
            <button data-testid="remove-item-button" onClick={() => removeItem(item.id)}>Remove &times;</button>
          </li>
        ))}
      </ul>
    </>
  );
}


function App() {

  return (
    <>
      <CartProvider
        id="jamie"
        onItemAdd={item => console.log(`Item ${item.id} added!`)}
        onItemUpdate={item => console.log(`Item ${item.id} updated.!`)}
        onItemRemove={() => console.log(`Item removed!`)}
      >
        <Cart />
        <Page />
      </CartProvider>
      <CartProvider
        id="jamie2"
        onItemAdd={item => console.log(`Item ${item.id} added!`)}
        onItemUpdate={item => console.log(`Item ${item.id} updated.!`)}
        onItemRemove={() => console.log(`Item removed!`)}
      >
        <Cart />
        <Page />
      </CartProvider>
  
    </>

    
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
