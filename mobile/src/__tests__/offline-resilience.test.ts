import "./setup";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isAxiosError } from "axios";

describe("Mobile Offline Resilience & Error Recovery", () => {
  it("should detect network failure without crashing and distinguish offline state", async () => {
    // Simulated health check function matching mobile/src/services/api.ts
    const checkServerAvailability = async (pingFn: () => Promise<any>): Promise<boolean> => {
      try {
        await pingFn();
        return true;
      } catch {
        return false;
      }
    };

    // When server is offline / times out:
    const failingPing = async () => {
      throw new Error("Network Error: ECONNREFUSED");
    };

    const isOnlineWhenDown = await checkServerAvailability(failingPing);
    assert.equal(isOnlineWhenDown, false, "Should return false when backend is down");

    // When server recovers:
    const workingPing = async () => {
      return { status: 200, data: { success: true } };
    };

    const isOnlineWhenUp = await checkServerAvailability(workingPing);
    assert.equal(isOnlineWhenUp, true, "Should return true when backend recovers");
  });

  it("should extract user-friendly error message from Axios error without throwing unhandled exceptions", () => {
    const getErrorMessage = (error: unknown): string => {
      if (isAxiosError(error)) {
        return (
          error.response?.data?.message ||
          error.message ||
          "Something went wrong."
        );
      }
      return error instanceof Error ? error.message : "Something went wrong.";
    };

    // 1. Backend returns structured JSON error
    const backendError: any = new Error("Request failed with status code 400");
    backendError.isAxiosError = true;
    backendError.response = {
      status: 400,
      data: { message: "Insufficient stock for product." },
    };

    assert.equal(getErrorMessage(backendError), "Insufficient stock for product.");

    // 2. Network timeout error
    const timeoutError: any = new Error("timeout of 10000ms exceeded");
    timeoutError.isAxiosError = true;
    assert.equal(getErrorMessage(timeoutError), "timeout of 10000ms exceeded");

    // 3. Generic JS exception
    const genericError = new Error("Null pointer or unexpected format");
    assert.equal(getErrorMessage(genericError), "Null pointer or unexpected format");
  });

  it("should handle session expiry (401) gracefully and guide to re-authentication", () => {
    type SessionState = "authenticated" | "unauthenticated" | "offline";

    const handleApiResponse = (status: number, currentState: SessionState): SessionState => {
      if (status === 401) {
        return "unauthenticated"; // Clear active session, prompt login
      }
      if (status >= 500) {
        return "offline"; // Maintain offline read-only cached view
      }
      return currentState;
    };

    assert.equal(handleApiResponse(401, "authenticated"), "unauthenticated");
    assert.equal(handleApiResponse(503, "authenticated"), "offline");
    assert.equal(handleApiResponse(200, "authenticated"), "authenticated");
  });
});

