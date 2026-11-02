const successResponse = (res, data, message, statusCode=200)=>{
 return res.status(statusCode).json({
    success: true,
    status: 'success',
    message,
    data
 })
}
export default successResponse;