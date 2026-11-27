import statusCode from "../constants/statusCode.js";
import appError from "../exceptions/appError.js";
import successResponse from "../exceptions/successResponse.js";
import {
    createFamily,
    fetchFamilies,
    findFamilyByLeaderAndMember,
    getFamilyMembership,
    joinFamily,
    updateFamilyMemberStatus
} from "../services/family.services.js";
import {
    findUserById,
    updateUser
} from "../services/user.services.js";
import User from "../models/user.model.js";
import {
    createIndividualNotification
} from "../services/notification.services.js";


const familyController = {

    // CREATE FAMILY CONTROLLER
    createFamily: async (req, res, next) => {
        const { id, username, imageUrl } = req.user;

        const { familyName } = req.body;

        if (!id || !username) {
            return next(
                new appError(
                    "the user details is missing in the request",
                    statusCode.BAD_REQUEST
                )
            );
        }

        const userData = {
            id,
            name: username,
            imageUrl: imageUrl
        };

        try {
            const leader = await findUserById(id);

            if (!leader) {
                return next(
                    new appError(
                        "You are not registered!",
                        statusCode.FORBIDDEN
                    )
                );
            }

            const familyData = {
                familyName: familyName,
                leader: { ...userData },
            };

            const createNewFamily = await createFamily(familyData);

            if (!createNewFamily) {
                return next(
                    new appError(
                        "could not create family, please try again",
                        statusCode.INTERNAL_SERVER_ERROR
                    )
                );
            }

            const result = await joinFamily(createNewFamily.id, id);

            const userRole = {
                id: id,
                role: "leader"
            };

            const updateRole = await updateUser(userRole);

            return successResponse(
                res,
                createNewFamily,
                "family created successfully",
                statusCode.CREATED
            );

        } catch (error) {
            console.error("CREATE FAMILY ERROR:", error);

            if (error.code === 11000) {
                const duplicatedField = Object.keys(
                    error.keyPattern || {}
                )[0];

                if (duplicatedField === "familyName") {
                    return next(
                        new appError(
                            `Family name "${familyName}" already exists. Please choose another name.`,
                            statusCode.CONFLICT
                        )
                    );
                }

                return next(
                    new appError(
                        `Duplicate value detected in ${duplicatedField || "a unique field"}.`,
                        statusCode.CONFLICT
                    )
                );
            }

            if (error.name === "ValidationError") {
                return next(
                    new appError(
                        error.message,
                        statusCode.BAD_REQUEST
                    )
                );
            }

            return next(
                new appError(
                    "Failed to create family, please try again.",
                    statusCode.INTERNAL_SERVER_ERROR
                )
            );
        }
    },


    // FETCH FAMILIES
    fetchFamilies: async (req, res, next) => {
        console.log("fetch family route hitted");

        try {
            const families = await fetchFamilies();

            const configFamily = {
                familyName: families.familyName,
                leaderName: families.leader.name,
                leaderImg: ""
            };

            return successResponse(
                res,
                configFamily,
                "families fetched successfully"
            );

        } catch (error) {
            return next(
                new appError(
                    "failed to fetch available families",
                    statusCode.INTERNAL_SERVER_ERROR
                )
            );
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

            // The join request has been successfully submitted.
            // Retrieve the requesting user's actual details.
            try {
                const requestingUser = await findUserById(id);

                if (!requestingUser) {
                    console.error(
                        "Unable to retrieve requesting user details for notification."
                    );
                } else {
                    const family = result.family;

                    const leaderId =
                        family.leader?.id ||
                        family.leader?._id;

                    // Do not send the notification to the requester.
                    // Only notify the family leader.
                    if (
                        leaderId &&
                        String(leaderId) !== String(id)
                    ) {
                        const requesterName =
                            requestingUser.username ||
                            requestingUser.name ||
                            [
                                requestingUser.firstName,
                                requestingUser.lastName
                            ].filter(Boolean).join(" ") ||
                            "A user";

                        const familyName =
                            family.familyName || "your family";

                        await createIndividualNotification({
                            userId: leaderId,
                            senderId: id,
                            title: "New Family Membership Request",
                            text: `${requesterName} wants to join ${familyName}. Please review this membership request and either reject or confirm the request using the buttons below.`,
                            type: "MEMBER_CONFIRMATION",
                            relatedId: family._id,
                            confirmMember: true
                        });

                        console.log(
                            "Membership request notification sent to family leader."
                        );
                    } else {
                        console.error(
                            "Family leader ID unavailable or matches the requesting user."
                        );
                    }
                }

            } catch (notificationError) {
                // Do not undo the membership request if notification delivery fails.
                console.error(
                    "Membership request notification error:",
                    notificationError.message
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


    // CHECK IF USER IS A MEMBER OF A FAMILY
    getMyFamilyMembership: async (req, res, next) => {
        console.log("get family membership route hitted");

        const { id } = req.user || {};

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

            // Extract all unique leader IDs from the families array
            const leaderIds = families
                .map((family) => family.leader?.id)
                .filter(Boolean);

            // Fetch all matching users from the users collection
            const leaderUsers = await User.find({
                _id: { $in: leaderIds }
            })
                .select("-password -__v")
                .lean();

            // Create a lookup map keyed by user ID
            const leaderMap = leaderUsers.reduce((acc, user) => {
                acc[user._id.toString()] = user;
                return acc;
            }, {});

            const enrichedFamilies = families.map((family) => {
                const familyObj = family.toObject
                    ? family.toObject()
                    : family;

                const leaderIdStr =
                    familyObj.leader?.id?.toString();

                const fullUserData =
                    leaderMap[leaderIdStr] || {};

                return {
                    ...familyObj,
                    leader: {
                        ...familyObj.leader,
                        ...fullUserData
                    }
                };
            });

            return successResponse(
                res,
                {
                    hasFamily: enrichedFamilies.length > 0,
                    families: enrichedFamilies
                },
                "Family membership checked successfully"
            );

        } catch (error) {
            console.error(
                "Family membership check error:",
                error
            );

            return next(
                new appError(
                    "Unable to verify your family membership",
                    statusCode.INTERNAL_SERVER_ERROR
                )
            );
        }
    },

    confirmNewMember: async (req, res, next)=>{
        console.log('confirm new member route hitted');
        const {id, username, email, role} = req.user;
        const {senderId} = req.body;
        
       try {
        const family = await findFamilyByLeaderAndMember(id, senderId);

        if (!family) {F
            return next(
                new appError(
                    "Family or member not found",
                    statusCode.NOT_FOUND
                )
            );
        }

        console.log(family._id, family.familyName);
        
        const updateStatus = await updateFamilyMemberStatus(family._id, senderId, action)
        ;

       } catch (error) {
        
       }
        
    }

};

export default familyController;