import bcrypt from "bcryptjs";


const verifyPassword = async (reqPassword, dbPassword)=>{
    return (await bcrypt.compare(reqPassword, dbPassword))
}


export default verifyPassword