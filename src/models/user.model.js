import mongoose from 'mongoose';

const profilePictureSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true,
        trim: true
    },
    cloudinary_id: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false }); //avoids creating an unnecessary sub-ID for the nested object

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: (value) => {
                return /[a-zA-Z]/.test(value)
            },
            message: 'name must contain letters only'
        }
    },

    email: {
        type: String,
        required: [true, 'email address is required'],
        trim: true,
        lowercase: true,
        unique: true,
        validate: {
            validator: (value) => {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
            },
            message: "invalid email address",
        }
    },

    phoneNumber: {
        type: String,
        trim: true,
        required: false,
        validate: {
            validator: function (v) {
                return /^\+?[1-9]\d{1,14}$/.test(v);
            },
            message: 'invalid phone number'
        },
        default: null 
    },

    dob: {
        type: String,
        trim: true,
        required: true,
    },
    
    role: {
        type: String,
        required: false,
        trim: true,
        enum: ['user', 'leader', 'admin'],
        default: 'user'
    },

    password: {
        type: String,
        trim: true,
    },

    image: {
        type: profilePictureSchema,
        required: false,
        default: null
    }
}, { timestamps: true }); 

const User = mongoose.model('User', userSchema);

export default User;












// import mongoose from 'mongoose';


// const userSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//         trim: true,
//         validate: {
//             validator: (value) => {
//                 return /[a-zA-Z]/.test(value)
//             },
//             message: 'name must contain letters only'
//         }
//     },

//     email: {
//         type: String,
//         required: [true, 'email address is required'],
//         trim: true,
//         lowercase: true,
//         unique: true,
//         validate: {
//             validator: (value) => {
//                 return /^[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
//             },
//             message: "invalid email address",
//         }

//     },

//     phoneNumber: {
//         type: String,
//         trim: true,
//         required: false,
//         validate: {
//             validator: function (v) {
//                 return /^\+?[1-9]\d{1,14}$/.test(v);
//             },
//             message: 'invalid phone number'
//         },
//         default: 'nil'
//     },

//     dob: {
//         type: String,
//         trim: true,
//         required: true,
//     },
//     role: {
//         type: String,
//         required: false,
//         trim: true,
//         enum: ['user', 'leader', 'admin'],
//         default: 'user'
//     },
//     password: {
//         type: String,
//         trim: true,

//     },

// })


// const User = mongoose.model('User', userSchema);

// export default User