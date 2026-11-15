import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { errorHandler } from "./errorHandler.js";

describe("errorHandler", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 404 for errors with statusCode 404", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    const error = Object.assign(new Error("Object not found"), {
      statusCode: 404,
    });

    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    const req = {
      method: "GET",
      originalUrl: "/documents/missing",
    } as Request;

    const res = { status } as unknown as Response;

    errorHandler(error, req, res, jest.fn() as NextFunction);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: "Not Found" });
  });

  it("returns 500 for other errors", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    const error = new Error("Unexpected failure");

    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    const req = {
      method: "GET",
      originalUrl: "/documents",
    } as Request;

    const res = { status } as unknown as Response;

    errorHandler(error, req, res, jest.fn() as NextFunction);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Internal Server Error",
    });
  });
});
