
import mongoose from "mongoose";
import Product from "../models/product.model";
import Order, {
  PaymentMethod,
  IOrder,
} from "../models/order.model";

type CreateOrderItemInput = {
  productId: string;
  quantity: number;
  selectedVariants?: Record<string, string>;
};

type ShippingAddressInput = {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
};

type CreateOrderInput = {
  items: CreateOrderItemInput[];
  shippingAddress: ShippingAddressInput;
  paymentMethod: PaymentMethod;
};

const DELIVERY_FEE = 40;

export class OrderServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "OrderServiceError";
  }
}

export async function createPendingOrder(
  userId: string,
  input: CreateOrderInput
): Promise<IOrder> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new OrderServiceError("Invalid user ID.", 401);
  }

  if (!input.items || input.items.length === 0) {
    throw new OrderServiceError("Cart cannot be empty.");
  }

  if (!["UPI", "CARD", "COD"].includes(input.paymentMethod)) {
    throw new OrderServiceError("Invalid payment method.");
  }

  // Validate product IDs and quantities.
  for (const item of input.items) {
    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      throw new OrderServiceError("Invalid product ID.");
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new OrderServiceError(
        "Product quantity must be a positive integer."
      );
    }
  }

  // Combine duplicate product IDs for aggregate stock validation.
  const requestedQuantities = new Map<string, number>();

  for (const item of input.items) {
    const current =
      requestedQuantities.get(item.productId) ?? 0;

    requestedQuantities.set(
      item.productId,
      current + item.quantity
    );
  }

  const productIds = [...requestedQuantities.keys()];

  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  });

  const productMap = new Map(
    products.map((product) => [
      product._id.toString(),
      product,
    ])
  );

  // Validate product availability and aggregate stock.
  for (const [productId, requestedQuantity] of requestedQuantities) {
    const product = productMap.get(productId);

    if (!product) {
      throw new OrderServiceError(
        "One or more products are unavailable.",
        404
      );
    }

    if (product.stock < requestedQuantity) {
      throw new OrderServiceError(
        `Insufficient stock for ${product.name}.`
      );
    }
  }

  // Build order items using trusted database prices.
  let subtotal = 0;

  const orderItems = input.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const selectedVariants = item.selectedVariants ?? {};

    // Validate selected variant names and values.
    for (const [variantName, variantValue] of Object.entries(
      selectedVariants
    )) {
      const variant = product.variants.find(
        (entry) => entry.name === variantName
      );

      if (!variant || !variant.options.includes(variantValue)) {
        throw new OrderServiceError(
          `Invalid ${variantName} selection for ${product.name}.`
        );
      }
    }

    // Require every configured variant to be selected.
    for (const variant of product.variants) {
      if (!selectedVariants[variant.name]) {
        throw new OrderServiceError(
          `Please select ${variant.name} for ${product.name}.`
        );
      }
    }

    subtotal += product.price * item.quantity;

    return {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: item.quantity,
      selectedVariants,
    };
  });

  const deliveryFee = DELIVERY_FEE;
  const totalAmount = subtotal + deliveryFee;

  const orderNumber =
    `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Associate the order with the authenticated user.
  const order = await Order.create({
    userId: new mongoose.Types.ObjectId(userId),
    orderNumber,
    items: orderItems,
    shippingAddress: input.shippingAddress,
    subtotal,
    deliveryFee,
    totalAmount,
    paymentMethod: input.paymentMethod,
    paymentStatus: "PENDING",
    orderStatus: "PENDING",
  });

  return order;
}
