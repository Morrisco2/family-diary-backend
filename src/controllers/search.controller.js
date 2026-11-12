import Families from "../models/createFamily.model.js";
import searchAndPaginate from "../utils/searchAndPaginate.js";
import statusCode from "../constants/statusCode.js";
import appError from "../exceptions/appError.js";
import searchSuccessResponse from "../exceptions/searchSuccessRespones.js";


const searchController = {
    familySearch: async (req, res, next) => {
        console.log("family search route hitted");
        
        
        try {
            const { data, pagination } = await searchAndPaginate({
                model: Families,
                query: req.query,

                searchFields: [
                    "familyName",
                    "leader.name",
                ],

                sort: {
                    createdAt: -1,
                },
            });

            searchSuccessResponse(res, data, "Families fetched successfully.", statusCode.SUCCESS,  pagination)


        } catch (error) {

            next(new appError(error.message, statusCode.SERVICE_UNAVAILABLE))
        }
    }
}



export default searchController