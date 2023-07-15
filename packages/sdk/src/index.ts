export { client, Client } from "./Client";
export { Bot } from "./Bot";
/**
 * Catch Remix response that was thrown and return it.
 */
export async function catchRemixResponse(
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    const resp = await handler();
    return resp;
  } catch (e: any) {
    if (e instanceof Response) {
      return e;
    } else {
      throw e;
    }
  }
}
