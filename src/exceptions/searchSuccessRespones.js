const searchSuccessResponse = (res, data, message,  statusCode=200, pagination={} )=>{
 return res.status(statusCode).json({
    success: true,
    status: 'success',
    data,
    message,
    pagination
 })
}
export default searchSuccessResponse;