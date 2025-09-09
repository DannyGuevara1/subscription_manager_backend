import { type Request, type Response } from "express";
import { UserService } from "@/services/user.service.ts";

interface userParams {
  id: string;
}

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getUserById(req: Request<userParams>, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const user = await this.userService.getUserById(id);
        if (!user) {
          res.status(404).json({ message: "User not found" });
          return;
        }
        res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
        const userData = req.body;
        const newUser = await this.userService.createUser(userData);
        res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }   
}
}