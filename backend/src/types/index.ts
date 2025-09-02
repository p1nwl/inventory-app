export type User = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  theme?: string;
  language?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
