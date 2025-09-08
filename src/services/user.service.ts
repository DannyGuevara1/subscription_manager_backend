import { UserRepository } from "../repositories/user/user.repository.ts";
import type { User } from "@prisma/client";
import prismaClient from "../config/prisma.ts";
import bcrypt from "bcrypt";
import { safeUserSchema, type SafeUser } from "@/api/components/user/user.type.ts";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository(prismaClient);
  }

  async createUser(data: Omit<User, "id">): Promise<User> {
    data.password = await bcrypt.hash(data.password, 10);
    return this.userRepository.create(data);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async getUserById(id: string): Promise<SafeUser | null> {
    const user = await this.userRepository.findById(id);
    return safeUserSchema.parse(user);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    return this.userRepository.update(id, data);
  }

  async deleteUser(id: string): Promise<User | null> {
    return this.userRepository.delete(id);
  }
}