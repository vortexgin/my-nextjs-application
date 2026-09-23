import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { fail, getErrorStatus, ok, queryParam } from "@/libraries/Http";
import { UserCreateUseCase } from "@/app/base/useCases/user/UserCreateUseCase";
import { UserListUseCase } from "@/app/base/useCases/user/UserListUseCase";
import type { CreateUserInput } from "@/app/base/models/UserModel";

export const runtime = "nodejs";

async function handleGet(request: NextRequest) {
  try {
    await connectDatabase();
    const params = request.nextUrl.searchParams;
    const users = await new UserListUseCase().exec({
      filter: {
        q: queryParam(params, "filter[q]"),
        name: queryParam(params, "filter[name]"),
        email: queryParam(params, "filter[email]"),
        phone: queryParam(params, "filter[phone]"),
      },
      sortProperty: queryParam(params, "sortProperty"),
      sortDirection: queryParam(params, "sortDirection"),
      offset: queryParam(params, "offset"),
      limit: queryParam(params, "limit"),
    });
    return ok(users);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch users.", getErrorStatus(error, 500));
  }
}

async function handlePost(request: NextRequest) {
  try {
    await connectDatabase();
    const payload = (await request.json()) as Partial<CreateUserInput>;

    const user = await new UserCreateUseCase().exec(payload as CreateUserInput);
    return ok(user, 201);
  } catch (error: any) {
    return fail(error.message ?? "Failed to create user.", getErrorStatus(error, 500));
  }
}

export const GET = withAuthorization(handleGet, ["base:user:list:list"]);
export const POST = withAuthorization(handlePost, ["base:user:create:create"]);
