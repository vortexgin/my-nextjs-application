import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { withEncryption } from "@/libraries/EncryptedRoute";
import { fail, getErrorStatus, ok, queryParam } from "@/libraries/Http";
import { RoleCreateUseCase } from "@/app/base/useCases/role/RoleCreateUseCase";
import { RoleListUseCase } from "@/app/base/useCases/role/RoleListUseCase";
import type { CreateRoleInput } from "@/app/base/models/RoleModel";

export const runtime = "nodejs";

async function handleGet(request: NextRequest) {
  try {
    await connectDatabase();
    const params = request.nextUrl.searchParams;
    const roles = await new RoleListUseCase().exec({
      filter: {
        q: queryParam(params, "filter[q]"),
        name: queryParam(params, "filter[name]"),
        slug: queryParam(params, "filter[slug]"),
      },
      sortProperty: queryParam(params, "sortProperty"),
      sortDirection: queryParam(params, "sortDirection"),
      offset: queryParam(params, "offset"),
      limit: queryParam(params, "limit"),
    });
    return ok(roles);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch roles.", getErrorStatus(error, 500));
  }
}

async function handlePost(request: NextRequest) {
  try {
    await connectDatabase();
    const payload = (await request.json()) as Partial<CreateRoleInput>;

    const role = await new RoleCreateUseCase().exec(payload as CreateRoleInput);
    return ok(role, 201);
  } catch (error: any) {
    return fail(error.message ?? "Failed to create role.", getErrorStatus(error, 500));
  }
}

export const GET = withAuthorization(withEncryption(handleGet), ["base:role:list:list"]);
export const POST = withAuthorization(withEncryption(handlePost), ["base:role:create:create"]);
