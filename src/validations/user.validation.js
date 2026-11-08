import { z } from 'zod'

export const registerUserSchema = z.object({
    name: z
        .string({ required_error: 'name is required' })
        .trim()
        .nonempty({ message: 'name is required' })
        .min(3, { message: 'name must be at least 3 characters long' })
        .regex(/^[A-Za-z\s]+$/, { message: 'name must contain letters only' }),

    email: z
        .string({ required_error: 'email is required' })
        .trim()
        .nonempty({ message: 'email is required' })
        .email({ message: 'Invalid email format' }),

    phoneNumber: z
        .string({ required_error: 'Phone number is required' })
        .trim()
        .min(1, { message: 'Phone number is required' })
        .regex(/^\+[1-9]\d{7,14}$/, {
            message: 'Enter a valid full phone number, including country code',
        }),
    dob: z
        .string({ required_error: 'date of birth is required' })
        .nonempty({ message: 'date of birth is required' }),

    role: z
        .string({ message: 'role must contain letters only' }).default('user')
    ,

    password: z
        .string({ required_error: 'password is required' })
        .nonempty({ message: 'password is required' })
        .min(8, { message: 'password must be at least 8 characters long' })
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            { message: 'Password must include uppercase, lowercase, a number, and a special character.' }
        ),
        terms: z.string({required_error: 'accept the terms and agree to the privacy policy'})

});

export const loginUserSchema = z.object({
    email: z.string({ message: 'email is required' }).nonempty({ message: 'email is required' }).email({ message: 'invalid email format' }),
    password: z.string({ message: 'password is required' }).nonempty({ message: 'password is required' })

})



export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const imageValidationSchema = z.object({
    size: z.number().max(MAX_FILE_SIZE, "The profile picture must be smaller than 5MB."),
    mimetype: z.string().refine((type) => ACCEPTED_IMAGE_TYPES.includes(type), {
        message: "Only .jpg, .jpeg, .png and .webp formats are supported."
    })
});

