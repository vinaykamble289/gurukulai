import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserService } from '../services/user.service';

export class UserController {
  private userService = new UserService();

  getProfile = async (req: AuthRequest, res: Response) => {
    const profile = await this.userService.getProfile(req.userId!);
    res.json({ profile });
  };

  updateProfile = async (req: AuthRequest, res: Response) => {
    const profile = await this.userService.updateProfile(req.userId!, req.body);
    res.json({ profile });
  };

  getPreferences = async (req: AuthRequest, res: Response) => {
    const preferences = await this.userService.getPreferences(req.userId!);
    res.json({ preferences });
  };

  updatePreferences = async (req: AuthRequest, res: Response) => {
    const preferences = await this.userService.updatePreferences(req.userId!, req.body);
    res.json({ preferences });
  };
}
