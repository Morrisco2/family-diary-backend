import {z} from 'zod';

export const familySchema = z.object({
    familyName: z.string({ required_error: 'name is required' })
            .nonempty({message: 'family name is required'})
            .regex(/^[A-Za-z\s]+$/, { message: 'name must contain letters only' })
            .max(40, {message:'family name cannot be more than 40 characters'})
})