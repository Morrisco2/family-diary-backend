const successResponse = (res, data, message,  statusCode=200, csrfToken="" )=>{
 return res.status(statusCode).json({
    success: true,
    status: 'success',
    data,
    message,
    csrfToken
 })
}
export default successResponse;