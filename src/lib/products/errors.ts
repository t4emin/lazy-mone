export class ProductError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
