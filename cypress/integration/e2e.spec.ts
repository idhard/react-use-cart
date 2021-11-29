import { createMachine, assign } from "xstate";
import { createModel } from "@xstate/test";
// import shoppingCartMachine from '../../src/cartMachine';

interface Item {
  id: string;
  price: number;
  quantity?: number;
  currency?: string;
  itemTotal?: number;
  [key: string]: any;
}


interface Metadata {
  [key: string]: any;
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

export type ShoppingCartMachineEvent =
  | {
      type: "ADD_TO_CART";
      item: Item;
    }
  | {
      type: "REMOVE_FROM_CART";
      itemId: string;
    }
  | {
      type: "EMPTY_CART";
    }
  | {
      type: "CHECK_OUT";
      itemId: string;
    };

const shoppingCartTestMachine = createMachine<Events>(
  {
    id: "shoppingCart",
    initial: "empty",
    states: {
      empty: {
        on: {
          ADD_ITEM: "adding",
          INCREASE_QUANTITY_ITEM: "adding",
        },
        meta: {
          test: () => {
            //just visial representations !
            cy.get('[data-testid="question-screen"]').should("be.visible");
          },
        },
      },
      adding: {
        always:{
          target: 'filled'
        },
        meta: {
          test: () => {
            cy.get('[data-testid="cart-filled"]').should("be.visible");
          },
        },
      },
      filled: {
        on: {
          EMPTY_CART: "empty",
          ADD_ITEM: "adding",
          INCREASE_QUANTITY_ITEM: "adding",
          DECREASE_QUANTITY_ITEM: "adding",
          REMOVE_ITEM: 'adding',
          UPDATE_ITEM: 'adding',
        },
        meta: {
          test: () => {
            cy.get('[data-testid="cart-filled"]').should("be.visible");
          },
        },
      },
    },
    
  }
);


describe("feedback app", () => {
  const testModel = createModel(shoppingCartTestMachine, {
    events: {
      ADD_ITEM: () => {
        cy.get('[data-testid="add-item-button"]').click({ multiple: true });
      },
      UPDATE_ITEM: () => {
        cy.get('[data-testid="good-button"]').click();
      },
      INCREASE_QUANTITY_ITEM: () => {
        cy.get('[data-testid="increase-quantity-button"]').click();
      },
      DECREASE_QUANTITY_ITEM: () => {
        cy.get('[data-testid="decrease-quantity-button"]').click();
      },
      REMOVE_ITEM: () =>{
        cy.get('[data-testid="good-button"]').click();
      },
      EMPTY_CART:() =>{
        cy.get('[data-testid="empty-cart-button"]').click();
      }
      // CLICK_BAD: () => {
      //   cy.get('[data-testid="bad-button"]').click();
      // },
      // CLOSE: () => {
      //   cy.get('[data-testid="close-button"]').click();
      // },
      // ESC: () => {
      //   cy.get('[data-testid="good-button"]').click();
      // },
      // SUBMIT: {
      //   exec: function(_, event) {
      //     if (event.value?.length)
      //       cy.get("[data-testid=response-input]").type(event.value);
      //     cy.get("[data-testid=submit-button]").click();
      //   },
      //   cases: [{ value: "something" }, { value: "" }],
      // },
    },
  });

  const testPlans = testModel.getSimplePathPlans();

  // add and update an item 
  const testEvents = testModel.getPlanFromEvents( [
    { type: 'ADD_ITEM' },
    { type: 'INCREASE_QUANTITY_ITEM' },
    // { type: 'DECREASE_QUANTITY_ITEM' },
  ],
  {
    target: 'empty'
  });

  console.log(testEvents);


  testPlans.forEach(plan => {
    describe(plan.description, () => {
      plan.paths.forEach(path => {
        it(path.description, function() {
          //this execute the test defined on the model !
          //Tests and executes each segment in segments sequentially, and then tests the postcondition that the state is reached.
          // Each test plan represents a target state and simple paths
          // from the initial state to that target state. Each test path
          // represents a series of steps to get to that target state,
          // with each step including a state (precondition) and an event
          // (action) that is executed after verifying that the app is in the state.
          cy.visit("http://localhost:1234").then(path.test);
        });
      });
    });
  });
});

// describe("toggle app", () => {
//   // Stateless machine definition
//   // machine.transition(...) is a pure function used by the interpreter.
//   const toggleMachine = createMachine(
//     {
//       id: "toggle",
//       initial: "inactive",
//       context: {
//         isActive: false,
//       },
//       states: {
//         inactive: {
//           on: {
//             TOGGLE: {
//               target: "active",
//               actions: "activate",
//             },
//             TOGGLE2: {
//               target: "active",
//             },
//           },
//         },
//         active: { on: { TOGGLE: "inactive" } },
//       },
//       on: {
//         TOGGLE: {
//           target: "active",
//           actions: "activeAction",
//         },
//       },
//     },
//     {
//       actions: {
//         activate: assign({
//           isActive: (_ctx, e) => {
//             console.log(e);
//             // this will fail on testModel.getSimplePathPlans()
//             //return true;
//             return e.payload.isActive;
//           },
//         }),
//       },
//     }
//   );

//   const testModel = createModel(toggleMachine, {
//     events: {
//       TOGGLE: {
//         cases: [{ payload: { isActive: false } }],
//         exec: () => {
//           cy.get('[data-testid="togglebutton"]').click();
//         },
//       },
//     },
//   });

//   const testPlans = testModel.getSimplePathPlans();

//   testPlans.forEach(plan => {
//     describe(plan.description, () => {
//       plan.paths.forEach(path => {
//         it(path.description, function() {
//           cy.visit("http://localhost:1234").then(plan.test);
//         });
//       });
//     });
//   });
// });
