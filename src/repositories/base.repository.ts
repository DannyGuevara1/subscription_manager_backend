import prismaClient from "@/config/prisma.ts";

export abstract class BaseRepository<T> {
  protected readonly prisma = prismaClient;

  constructor(prisma: typeof prismaClient) {
    this.prisma = prisma;
  }

  abstract create(data: Omit<T, "id">): Promise<T>;
  abstract findAll(): Promise<T[]>;
  abstract findById(id: string): Promise<T | null>;
  abstract update(id: string, data: Partial<T>): Promise<T | null>;
  abstract delete(id: string): Promise<T | null>;
}