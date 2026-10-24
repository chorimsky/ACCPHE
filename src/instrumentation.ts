export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnv } = await import("./env");
    assertEnv();
    const { bootstrapProduction } = await import("./server/bootstrap");
    await bootstrapProduction();
  }
}
