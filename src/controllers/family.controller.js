import statusCode from "../constants/statusCode.js";
import appError from "../exceptions/appError.js";
import successResponse from "../exceptions/successResponse.js";
import { createFamily, fetchFamilies } from "../services/family.services.js";
import { findUser, findUserById } from "../services/user.services.js";



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
    joinFamily: async (req, res) => {
        console.log(' this is the join family controller');

    },





}

export default familyController