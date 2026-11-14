import "./setup";
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { useCartStore, CartProduct } from "../store/cart-store";

describe("Mobile Cart Store & Stock Management", () => {
  const sampleProduct: CartProduct = {
    id: "prod-1",
    name: "Classic Denim Jacket",
    price: 1999,
    description: "High quality denim jacket",
    stock: 5,
  };

  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it("should add a product with variants to cart", () => {
    const store = useCartStore.getState();
    store.addToCart(sampleProduct, 2, { Size: "M", Color: "Blue" });

    const items = useCartStore.getState().items;
    assert.equal(items.length, 1);
    assert.equal(items[0].id, "prod-1");
    assert.equal(items[0].quantity, 2);
    assert.equal(items[0].cartItemId, "prod-1::Color:Blue|Size:M");
    assert.deepEqual(items[0].selectedVariants, { Size: "M", Color: "Blue" });
  });

  it("should increment quantity when adding the exact same variant combination", () => {
    const store = useCartStore.getState();
    store.addToCart(sampleProduct, 2, { Size: "M", Color: "Blue" });
    store.addToCart(sampleProduct, 1, { Size: "M", Color: "Blue" });

    const items = useCartStore.getState().items;
    assert.equal(items.length, 1);
    assert.equal(items[0].quantity, 3);
  });

  it("should create separate cart items for different variants of the same product", () => {
    const store = useCartStore.getState();
    store.addToCart(sampleProduct, 2, { Size: "M", Color: "Blue" });
    store.addToCart(sampleProduct, 2, { Size: "L", Color: "Black" });

    const items = useCartStore.getState().items;
    assert.equal(items.length, 2);
    assert.equal(items[0].cartItemId, "prod-1::Color:Blue|Size:M");
    assert.equal(items[1].cartItemId, "prod-1::Color:Black|Size:L");
  });

  it("should enforce product aggregate stock limit across all variant combinations", () => {
    // Total stock is 5
    const store = useCartStore.getState();

    // Add 3 of Variant 1 (3 items, 2 stock remaining)
    store.addToCart(sampleProduct, 3, { Size: "M" });
    assert.equal(useCartStore.getState().items[0].quantity, 3);

    // Try to add 4 of Variant 2 (only 2 stock remaining, so capped at 2)
    store.addToCart(sampleProduct, 4, { Size: "L" });
    const items = useCartStore.getState().items;
    assert.equal(items.length, 2);
    assert.equal(items[1].quantity, 2, "Second variant should be capped at remaining stock (2)");

    // Try to add more of Variant 3 (0 stock remaining, should be rejected)
    store.addToCart(sampleProduct, 1, { Size: "XL" });
    assert.equal(useCartStore.getState().items.length, 2, "No items added when stock is exhausted");
  });

  it("should not allow increasing quantity beyond available stock", () => {
    const limitedProduct: CartProduct = {
      ...sampleProduct,
      id: "prod-limited",
      stock: 2,
    };

    const store = useCartStore.getState();
    store.addToCart(limitedProduct, 2);

    const cartItemId = useCartStore.getState().items[0].cartItemId;

    // Attempt to increase beyond stock of 2
    store.increaseQuantity(cartItemId);
    assert.equal(useCartStore.getState().items[0].quantity, 2);
  });

  it("should decrease quantity and remove item when quantity drops to 0", () => {
    const store = useCartStore.getState();
    store.addToCart(sampleProduct, 2, { Size: "S" });

    const cartItemId = useCartStore.getState().items[0].cartItemId;

    store.decreaseQuantity(cartItemId);
    assert.equal(useCartStore.getState().items[0].quantity, 1);

    store.decreaseQuantity(cartItemId);
    assert.equal(useCartStore.getState().items.length, 0, "Item should be removed when quantity drops to 0");
  });

  it("should safely update quantity and cap at available stock", () => {
    const store = useCartStore.getState();
    store.addToCart(sampleProduct, 1, { Size: "M" });
    const cartItemId = useCartStore.getState().items[0].cartItemId;

    // Requested quantity (10) exceeds stock (5) -> capped at 5
    store.updateQuantity(cartItemId, 10);
    assert.equal(useCartStore.getState().items[0].quantity, 5);

    // Setting quantity to 0 removes the item
    store.updateQuantity(cartItemId, 0);
    assert.equal(useCartStore.getState().items.length, 0);
  });

  it("should remove specific item from cart", () => {
    const store = useCartStore.getState();
    store.addToCart(sampleProduct, 1, { Size: "M" });
    store.addToCart(sampleProduct, 1, { Size: "L" });

    const firstCartItemId = useCartStore.getState().items[0].cartItemId;
    store.removeFromCart(firstCartItemId);

    const items = useCartStore.getState().items;
    assert.equal(items.length, 1);
    assert.equal(items[0].selectedVariants.Size, "L");
  });

  it("should clear all items on clearCart()", () => {
    const store = useCartStore.getState();
    store.addToCart(sampleProduct, 2);
    store.clearCart();

    assert.equal(useCartStore.getState().items.length, 0);
  });
});

