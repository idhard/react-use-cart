import { createMachine } from "xstate";
import { createModel } from "@xstate/test";

const feedbackMachine = createMachine({
  id: "feedback",
  initial: "question",
  states: {
    question: {
      on: {
        CLICK_GOOD: "thanks",
        CLICK_BAD: "form",
        CLOSE: "closed",
      },
      meta: {
        test: () => {
          cy.get('[data-testid="question-screen"]').should("be.visible");
        },
      },
    },
    form: {
      on: {
        SUBMIT: [
          {
            target: "thanks",
            // cond: (_, e) => e.value.length,
          },
        ],
        CLOSE: "closed",
      },
      meta: {
        test: () => {
          cy.get('[data-testid="form-screen"]').should("be.visible");
        },
      },
    },
    thanks: {
      on: {
        CLOSE: "closed",
      },
      meta: {
        test: () => {
          cy.get('[data-testid="thanks-screen"]').should("be.visible");
        },
      },
    },
    closed: {
      type: "final",
      meta: {
        test: () => {
          return true;
        },
      },
    },
  },
});

const testModel = createModel(feedbackMachine, {
  events: {
    CLICK_GOOD: () => {
      cy.get('[data-testid="good-button"]').click();
    },
    CLICK_BAD: () => {
      cy.get('[data-testid="bad-button"]').click();
    },
    CLOSE: () => {
      cy.get('[data-testid="close-button"]').click();
    },
    ESC: () => {
      cy.get('[data-testid="good-button"]').click();
    },
    SUBMIT: {
      exec: function(_, event) {
        if (event.value?.length)
          cy.get("[data-testid=response-input]").type(event.value);
        cy.get("[data-testid=submit-button]").click();
      },
      cases: [{ value: "something" }, { value: "" }],
    },
  },
});

describe("feedback app", () => {
  const testPlans = testModel.getSimplePathPlans();

const testEvents = testModel.getPlanFromEvents( [
  { type: 'CLICK_BAD' },
  { type: 'CLICK_CLOSE' },
],
{
  target: 'closed'
});

console.log(testEvents);
  testPlans.forEach(plan => {
    describe(plan.description, () => {
      plan.paths.forEach(path => {
        it(path.description, function() {
          //this execute the test defined on the model !
          //Tests and executes each segment in segments sequentially, and then tests the postcondition that the state is reached.
          cy.visit("http://localhost:1234").then(path.test);
        });
      });
    });
  });
});

describe("test coverage", () => {
  it("should pass coverage", () => {
    testModel.testCoverage();
  });
});
