import type { NextFunction, Request, Response } from "express";

// Last middleware in the chain. The client gets a fixed shape and no detail;
// the detail goes to the log. Express only treats a 4-argument function as an
// error handler, so `next` stays even though it is unused.
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  void next;
  console.error(`${req.method} ${req.originalUrl}`, err);

  if (err instanceof Error && "statusCode" in err && err.statusCode === 404) {
    res.status(404).json({ error: "Not Found" });
    return;
  }

  res.status(500).json({ error: "Internal Server Error" });
}
