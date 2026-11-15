import Families from "../models/createFamily.model.js";

export const createFamily = async (familyData) => {
    const family = await Families.create(familyData)
    return family
};

export const fetchFamilies = async () => {
    const families = await Families.find();
    return families
};


export const findOneFamily = async (familyName) => {
    const family = await Families.findOne(familyName);
    return family
}


export const joinFamily = async (familyId, userId) => {
    let family = await Families.findById(familyId).select("members");

    if (!family) {
        return { notFound: true };
    }

    const existingMember = family.members.find(
        (member) => member.user?.toString() === userId.toString()
    );

    if (existingMember) {
        return { existingMember };
    }

    family = await Families.findOneAndUpdate(
        {
            _id: familyId,
            "members.user": { $ne: userId }
        },
        {
            $push: {
                members: {
                    user: userId,
                    status: "pending"
                }
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (family) {
        return { family };
    }

    const latestFamily = await Families.findById(familyId).select("members");

    if (!latestFamily) {
        return { notFound: true };
    }

    const newlyExistingMember = latestFamily.members.find(
        (member) => member.user?.toString() === userId.toString()
    );

    if (newlyExistingMember) {
        return { existingMember: newlyExistingMember };
    }

    return { failed: true };
};


// export const getFamilyMembership = async (userId) => {
//   const families = await Families.find({
//     $or: [
//       // Check whether the user created the family.
//       {
//         "leader.id": userId
//       },

//       // Check whether the user is an approved member.
//       {
//         members: {
//           $elemMatch: {
//             user: userId,
//             status: "approved"
//           }
//         }
//       }
//     ]
//   }).select("_id familyName leader members");

//   return families;
// };


export const getFamilyMembership = async (userId) => {
  const families = await Families.find({
    $or: [
      {
        "leader.id": userId
      },
      {
        members: {
          $elemMatch: {
            user: userId,
            status: "approved"
          }
        }
      }
    ]
  }).select("_id familyName leader members");

  return families;
};