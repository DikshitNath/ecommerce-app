import "./setup";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Mobile Checkout & Address Validation", () => {
  const phoneRegex = /^[6-9]\d{9}$/;
  const pinCodeRegex = /^\d{6}$/;

  const validateAddress = (address: {
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
  }): { valid: boolean; error?: string } => {
    if (
      !address.fullName.trim() ||
      !address.phone.trim() ||
      !address.addressLine.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !address.postalCode.trim()
    ) {
      return { valid: false, error: "Missing required fields" };
    }

    if (!phoneRegex.test(address.phone.trim())) {
      return { valid: false, error: "Invalid phone number" };
    }

    if (!pinCodeRegex.test(address.postalCode.trim())) {
      return { valid: false, error: "Invalid PIN code" };
    }

    return { valid: true };
  };

  const calculateTotals = (items: { price: number; quantity: number }[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = items.length > 0 ? 40 : 0;
    const total = subtotal + deliveryFee;
    return { subtotal, deliveryFee, total };
  };

  describe("Address field validation", () => {
    it("should accept valid Indian delivery address", () => {
      const validAddress = {
        fullName: "Rahul Sharma",
        phone: "9876543210",
        addressLine: "Flat 402, Sunshine Apartments, MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
      };

      const result = validateAddress(validAddress);
      assert.equal(result.valid, true);
    });

    it("should reject address with missing fields", () => {
      const incompleteAddress = {
        fullName: "",
        phone: "9876543210",
        addressLine: "MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
      };

      const result = validateAddress(incompleteAddress);
      assert.equal(result.valid, false);
      assert.equal(result.error, "Missing required fields");
    });

    it("should validate Indian 10-digit phone numbers starting with 6, 7, 8, 9", () => {
      const validPhones = ["9876543210", "8123456789", "7001234567", "6987654321"];
      for (const phone of validPhones) {
        assert.ok(phoneRegex.test(phone), `Phone ${phone} should be valid`);
      }

      const invalidPhones = [
        "1234567890", // starts with 1
        "5555555555", // starts with 5
        "987654321",  // 9 digits
        "98765432100", // 11 digits
        "98765abcde", // non-numeric
      ];
      for (const phone of invalidPhones) {
        assert.ok(!phoneRegex.test(phone), `Phone ${phone} should be invalid`);
      }
    });

    it("should validate Indian 6-digit PIN codes", () => {
      const validPins = ["560001", "110001", "400001", "700001"];
      for (const pin of validPins) {
        assert.ok(pinCodeRegex.test(pin), `PIN ${pin} should be valid`);
      }

      const invalidPins = ["56000", "5600001", "56000A", "abcdef"];
      for (const pin of invalidPins) {
        assert.ok(!pinCodeRegex.test(pin), `PIN ${pin} should be invalid`);
      }
    });
  });

  describe("Checkout order calculations", () => {
    it("should calculate correct subtotal, ₹40 delivery fee, and grand total", () => {
      const cartItems = [
        { price: 499, quantity: 2 }, // 998
        { price: 1200, quantity: 1 }, // 1200
      ];

      const { subtotal, deliveryFee, total } = calculateTotals(cartItems);
      assert.equal(subtotal, 2198);
      assert.equal(deliveryFee, 40);
      assert.equal(total, 2238);
    });

    it("should return 0 delivery fee for empty cart", () => {
      const { subtotal, deliveryFee, total } = calculateTotals([]);
      assert.equal(subtotal, 0);
      assert.equal(deliveryFee, 0);
      assert.equal(total, 0);
    });
  });
});

