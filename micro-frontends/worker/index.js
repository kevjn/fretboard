import { WorkerEntrypoint } from "cloudflare:workers";

export default class extends WorkerEntrypoint {
  async fetch(request) {
    const response = await this.env.ASSETS.fetch(request)
    const newResponse = new Response(response.body, response)
    newResponse.headers.set("access-control-allow-origin", "*")
    return newResponse
  }
}

