import statusCode from "../constants/statusCode.js";
import appError from "../exceptions/appError.js";
import successResponse from "../exceptions/successResponse.js";
import { createFamily, fetchFamilies, getFamilyMembership, joinFamily } from "../services/family.services.js";
import { findUserById } from "../services/user.services.js";



const familyController = {

    // CREATE FAMILY CONTROLLER
    createFamily: async (req, res, next) => {
        const { id, username, imageUrl } = req.user;
        console.log("uer image url is: ", imageUrl);


        // if(true){
        //     return next(new appError("why will this be true?, you are a witch", statusCode.UNAUTHORISED))
        // }

        const { familyName } = req.body;

        if (!id || !username) {
            return next(new appError('the user details is missing in the request', statusCode.BAD_REQUEST))
        }

        const userData = {
            id,
            name: username,
            imageUrl: imageUrl
        }

        try {
            const leader = await findUserById(id);
            if (!leader) {
                return next(new appError('You are not registered!', statusCode.FORBIDDEN))
            }

            const familyData = {
                familyName: familyName,
                leader: { ...userData },
            }

            console.log('the family data is: ', familyData);

            const createNewFamily = await createFamily(familyData);

            if (!createNewFamily) {
                return next(new appError('could not create family, please try again', statusCode.INTERNAL_SERVER_ERROR))
            }

            return successResponse(res, createNewFamily, "family created successfully", statusCode.CREATED)


        } catch (error) {
            console.error("CREATE FAMILY ERROR:", error);

            if (error.code === 11000) {
                console.log("Duplicate key pattern:", error.keyPattern);
                console.log("Duplicate key value:", error.keyValue);

                const duplicatedField = Object.keys(error.keyPattern || {})[0];

                if (duplicatedField === "familyName") {
                    return next(new appError(
                        `Family name "${familyName}" already exists. Please choose another name.`,
                        statusCode.CONFLICT
                    ));
                }

                return next(new appError(
                    `Duplicate value detected in ${duplicatedField || "a unique field"}.`,
                    statusCode.CONFLICT
                ));
            }

            if (error.name === "ValidationError") {
                return next(new appError(
                    error.message,
                    statusCode.BAD_REQUEST
                ));
            }

            return next(new appError(
                "Failed to create family, please try again.",
                statusCode.INTERNAL_SERVER_ERROR
            ));
        }




    },

    // FETCH FAMILIES
    fetchFamilies: async (req, res, next) => {
        console.log('fetch family route hitted');

        try {
            const families = await fetchFamilies();

            const configFamily = {
                familyName: families.familyName,
                leaderName: families.leader.name,
                leaderImg: ""
            }

            return successResponse(res, configFamily, "families fetched successfully")
        } catch (error) {
            return next(new appError('failed to fetch available families', statusCode.INTERNAL_SERVER_ERROR))
        }

    },

    // JOIN FAMILY CONTROLLER

    joinFamily: async (req, res, next) => {
        console.log("This is the join family controller");

        const { familyId } = req.body;
        const { id } = req.user || {};

        if (!familyId) {
            return next(
                new appError(
                    "Please select a family to join",
                    statusCode.BAD_REQUEST
                )
            );
        }

        if (!id) {
            return next(
                new appError(
                    "Make sure you are logged in before joining a family",
                    statusCode.UNAUTHORISED
                )
            );
        }

        try {
            const result = await joinFamily(familyId, id);

            // Family does not exist
            if (result.notFound) {
                return next(
                    new appError(
                        "The family you are trying to join could not be found",
                        statusCode.NOT_FOUND
                    )
                );
            }

            // User already has a membership record
            if (result.existingMember) {
                const { status } = result.existingMember;

                if (status === "approved") {
                    return next(
                        new appError(
                            "You are already a member of this family",
                            statusCode.CONFLICT
                        )
                    );
                }

                if (status === "pending") {
                    return next(
                        new appError(
                            "Your request to join this family is already pending approval. Please wait for the family administrator to review your request.",
                            statusCode.CONFLICT
                        )
                    );
                }

                if (status === "rejected") {
                    return next(
                        new appError(
                            "Your previous request to join this family was declined. Please contact the family administrator for further assistance.",
                            statusCode.FORBIDDEN
                        )
                    );
                }

                return next(
                    new appError(
                        "You already have a membership record for this family",
                        statusCode.CONFLICT
                    )
                );
            }

            if (result.failed || !result.family) {
                return next(
                    new appError(
                        "Unable to process your request to join this family. Please try again.",
                        statusCode.INTERNAL_SERVER_ERROR
                    )
                );
            }

            return successResponse(
                res,
                result.family,
                "Your request to join this family has been submitted successfully"
            );

        } catch (error) {
            console.error("Join family controller error:", error);

            return next(
                new appError(
                    "An internal error occurred while processing your request",
                    statusCode.INTERNAL_SERVER_ERROR
                )
            );
        }
    },

    //  CHECK IF USER IS A MEMBER OF A FAMILY
    getMyFamilyMembership: async (req, res, next) => {
        console.log("get family membership route hitted");

        const { id } = req.user || {};

        console.log("the user id is: ", id);


        if (!id) {
            return next(
                new appError(
                    "Authentication required",
                    statusCode.UNAUTHORISED
                )
            );
        }

        try {
            const families = await getFamilyMembership(id);

            console.log("Approved families found:", families.length);
            console.log("Membership results:", families);
            return successResponse(
                res,
                {
                    hasFamily: families.length > 0,
                    families
                },
                "Family membership checked successfully"
            );

        } catch (error) {
            console.error("Family membership check error:", error);

            return next(
                new appError(
                    "Unable to verify your family membership",
                    statusCode.INTERNAL_SERVER_ERROR
                )
            );
        }
    },






}

export default familyController