import appError from "../../exceptions/appError.js";
import statusCode from "../../constants/statusCode.js";

/**
 * Validate and replace req[source] with Zod's parsed/sanitized value.
 * Use after body parsers and, for multipart forms, after Multer.
 */
const validateRequest = (schema, source = "body") => {
    return (req, res, next) => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            const message = result.error.issues
                .map((issue) => `${issue.path.join(".") || source}: ${issue.message}`)
                .join("; ");

            return next(new appError(message || "Invalid request data.", statusCode.BAD_REQUEST));
        }

        req[source] = result.data;
        return next();
    };
};

export default validateRequest;
