

const userController = {
    fetchProfileData: async (req, res, next)=>{

        console.log("fetch user profile data route hitted");
        console.log("the user data is: ", req.user);
        
        
    }
}


export default userController