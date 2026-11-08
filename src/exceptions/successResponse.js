const successResponse = (res, data, message, statusCode=200, csrfToken="" )=>{
 return res.status(statusCode).json({
    success: true,
    status: 'success',
    message,
    data,
    csrfToken
 })
}
export default successResponse;