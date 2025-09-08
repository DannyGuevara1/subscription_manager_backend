import prismaClient from "@/config/prisma.ts";
import { BaseRepository } from "@/repositories/base.repository.ts";
import type { User } from "@prisma/client";
import { uuidv7 } from "uuidv7";

export class UserRepository extends BaseRepository<User> {

  constructor(prisma: typeof prismaClient) {
    super(prisma);
  }

  async create(data: Omit<User, "id">): Promise<User> {
    const id = uuidv7();
    return this.prisma.user.create({ data : { ...data, id } });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<User | null> {
    return this.prisma.user.delete({ where: { id } });
  }
}