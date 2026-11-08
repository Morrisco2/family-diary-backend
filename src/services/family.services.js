import Families from "../models/createFamily.model.js";

export const createFamily = async (familyData)=>{
  const family = await Families.create(familyData)
  return family
};

export const fetchFamilies = async ()=>{
    const families = await Families.find();
    return families
};


export const findOneFamily = async (familyName)=>{
    const family = await families.findOne(familyName);
    return family
}