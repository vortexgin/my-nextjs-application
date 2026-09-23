import { Schema } from "joi";
import BadParameterException from "@/exceptions/BadParameterException";

export abstract class BaseUseCase<TInput = unknown, TOutput = unknown, TContext = unknown> {
  protected async validate<TValidated = TInput>(schema: Schema, input: unknown): Promise<TValidated> {
    const { error, value } = schema.validate(input, { abortEarly: false });

    if (error) {
      throw new BadParameterException(error.details.map((detail) => detail.message).join(", "));
    }

    return value as TValidated;
  }

  protected async preExec(..._args: any[]): Promise<TContext> {
    return undefined as TContext;
  }

  protected async postExec(result: TOutput, _context?: TContext): Promise<TOutput> {
    return result;
  }

  protected abstract execute(context: TContext): Promise<TOutput>;

  async exec(...args: any[]): Promise<TOutput> {
    const context = await this.preExec(...args);
    const result = await this.execute(context);
    return this.postExec(result, context);
  }
}
