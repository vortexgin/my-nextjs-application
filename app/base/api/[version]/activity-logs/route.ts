import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { fail, getErrorStatus, ok, queryParam } from "@/libraries/Http";
import { ActivityLogListUseCase } from "@/app/base/useCases/activityLog/ActivityLogListUseCase";

export const runtime = "nodejs";

async function handleGet(request: NextRequest) {
  try {
    await connectDatabase();
    const params = request.nextUrl.searchParams;
    // Supports single values and comma-separated multi-entity queries,
    // e.g. filter[entity]=lead,lead_metadata,lead_activity
    // and filter[entity_uuid]=uuid1,uuid2 (+ plural aliases).
    const logs = await new ActivityLogListUseCase().exec({
      filter: {
        entity: queryParam(params, "filter[entity]"),
        entities: queryParam(params, "filter[entities]"),
        entity_uuid: queryParam(params, "filter[entity_uuid]"),
        entity_uuids: queryParam(params, "filter[entity_uuids]"),
      },
      sortProperty: queryParam(params, "sortProperty"),
      sortDirection: queryParam(params, "sortDirection"),
      offset: queryParam(params, "offset"),
      limit: queryParam(params, "limit"),
    });
    return ok(logs);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch activity logs.", getErrorStatus(error, 500));
  }
}

export const GET = withAuthorization(handleGet, ["base:activity-log:list:list"]);
