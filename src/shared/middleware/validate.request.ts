import type { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

export const validateRequest = (schema: ZodObject<any>) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const validatedData = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            if (validatedData.body) req.body = validatedData.body;
            if (validatedData.query) req.query = validatedData.query as any;
            if (validatedData.params) req.params = validatedData.params as any;
            next();
        } catch (error) {
            next(error);
        }
    };
};
