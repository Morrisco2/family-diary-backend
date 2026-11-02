import bcrypt from 'bcryptjs'

const encryptPassword = async (password)=>{
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // console.log('encrypted password is : ', hashedPassword);
    

    return hashedPassword
}


export default encryptPassword;