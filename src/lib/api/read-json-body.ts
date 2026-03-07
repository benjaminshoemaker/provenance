export class ReadJsonBodyError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function readJsonBody(
  req: Request,
  maxBytes: number
): Promise<unknown> {
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const size = Number(contentLength);
    if (Number.isFinite(size) && size > maxBytes) {
      throw new ReadJsonBodyError(413, "Request body too large");
    }
  }

  const bodyText = await req.text();
  const bodyBytes = new TextEncoder().encode(bodyText).length;
  if (bodyBytes > maxBytes) {
    throw new ReadJsonBodyError(413, "Request body too large");
  }

  if (!bodyText.trim()) {
    throw new ReadJsonBodyError(400, "Request body is required");
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    throw new ReadJsonBodyError(400, "Invalid JSON body");
  }
}
