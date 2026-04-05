import {prisma} from "@/prisma";

interface IRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

interface IRequestPage {
  page: number;
  pageSize?: number;
  orderBy?: { field: "createdAt" | "url", direction?: "asc" | "desc" };
  filterByMethod?: string;
  filterByUrl?: string;
}

export async function addRequest(
  data: IRequest,
) {
  return prisma.request.create({
    data
  });
}

export async function getRequests({ page, pageSize = 100, orderBy, filterByMethod, filterByUrl }: IRequestPage) {
  const request: Parameters<typeof prisma.request.findMany>[0] = {
    skip: (page - 1) * pageSize,
    take: pageSize,
    where: {},
    include: {
      response: true,
    },
  };

  if (orderBy) {
    request.orderBy = {
      [orderBy.field]: orderBy.direction ?? "asc",
    };
  } else {
    request.orderBy = {
      createdAt: "desc",
    }
  }

  if (filterByMethod) {
    request.where = {
      ...request.where,
      method: filterByMethod,
    };
  }

  if (filterByUrl) {
    request.where = {
      ...request.where,
      url: {
        contains: filterByUrl
      }
    }
  }



  return prisma.request.findMany(request);
}
