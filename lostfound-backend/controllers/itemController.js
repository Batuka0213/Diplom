const Item = require("../models/Item");


// GET
exports.getItems = async (req,res)=>{
const items = await Item.find().sort({createdAt:-1});
res.json(items);
};


// CREATE
exports.createItem = async (req,res)=>{

const item = new Item({
title:req.body.title,
description:req.body.description,
location:req.body.location,
type:req.body.type,
contact:req.body.contact,
image:req.file ? req.file.filename : ""
});

await item.save();
res.json(item);

};


// DELETE
exports.deleteItem = async (req,res)=>{
await Item.findByIdAndDelete(req.params.id);
res.json({msg:"deleted"});
};


// UPDATE STATUS
exports.updateStatus = async (req,res)=>{

try{

const item = await Item.findByIdAndUpdate(
req.params.id,
{ status:req.body.status },
{ new:true }
);

res.json(item);

}catch(err){
res.status(500).json(err);
}

};