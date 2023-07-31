const ejs=require('ejs');
const uuidAPIKey = require('uuid-apikey');
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;
var jwt = require('jsonwebtoken');
require('dotenv').config()
var cookie = require('cookie');

const app=express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+"/assets"));


try{
    mongoose.connect(process.env.Mongo);
    console.log("Connected to database");

}
catch(err){
    console.log(err);
}
const biobankSchema=new mongoose.Schema({
    name:{type:String,required:true},
    symptoms:String,
    medicine:String
});
const userSchema=new mongoose.Schema({
    email:{type:String,required:true },
    uuid:String,
    password:{type:String,required:true},
    count:Number,
    UpdatedAt:Date

});
const adminSchema=new mongoose.Schema({
    email:{type:String,required:true },
    password:{type:String,required:true}

})
const adminmodel=mongoose.model("admin",adminSchema)
const usermodel=mongoose.model("user",userSchema);
const biomodel=mongoose.model("biobank",biobankSchema);
app.get("/",function(req,res){
    res.render("index")
})
app.get("/docs",function(req,res){
    res.render("docs")
})
app.get("/pricing",function(req,res){
    res.render("pricing")
})
app.get("/api",function(req,res){
    res.render("api")
})
app.get("/contacts",function(req,res){
    res.render("contacts")
})

app.get("/signup",function(req,res){
    res.render("signup")
    

})
app.get("/login",function(req,res){
    res.render("login")
    

})
app.get("/adminlogin",function(req,res){
    res.render("loginadmin")
    

})
app.get("/adminsignup",function(req,res){
    res.render("adminsignup")
    

})

app.get("/adminhome",function(req,res){
    var cookies = cookie.parse(req.headers.cookie || '');

    jwt.verify(cookies.jwtToken,process.env.TOKEN_KEY, async function(err, decoded) {
        if(!err){
            var bioart=await biomodel.find({})
            bioart = Array.from(bioart);
            console.log(bioart)
    res.render("adminrender",{bioart:bioart})
        }
        else{
            res.send("need auth")
        }
})
})
app.get("/updateform/:id",function(req,res){
    var cookies = cookie.parse(req.headers.cookie || '');

    jwt.verify(cookies.jwtToken,process.env.TOKEN_KEY, async function(err, decoded) {
        if(!err){
            var bio=await biomodel.findOne({_id:req.params.id})
            res.render("updateform",{bio:bio})

        }
        else{
            res.send("need auth")
        }

})
})
app.get("/addform",function(req,res){
    var cookies = cookie.parse(req.headers.cookie || '');

    jwt.verify(cookies.jwtToken,process.env.TOKEN_KEY, async function(err, decoded) {
        if(!err){
            var bio=await biomodel.findOne({_id:req.params.id})
            res.render("addform")

        }
        else{
            res.send("need auth")
        }

})
})


app.post("/signup",async function(req,res){
    const found= await usermodel.findOne({email:req.body.email});
    if(!found){
        
      
       const hash= bcrypt.hashSync(req.body.password, saltRounds);
         const user=new usermodel({
          email:req.body.email,
          uuid:uuidAPIKey.create().uuid,
           password:hash,
           count:0})
            try{
                await user.save()
                res.render('profile',{apikey:user.uuid});
                
            }
            catch(err){
                res.send(err);
            }

        }
       
     else{
        res.redirect("/login");
    }
    
})

app.post("/login",async function(req,res){
    const found= await usermodel.findOne({email:req.body.email});
       if(found){
        const pass=found.password;
        bcrypt.compare(req.body.password, pass, function(err, result) {
            if(result==true){
                res.render('profile',{apikey:found.uuid,rate:found.count});
            }
            else if(result==false){
                res.send("password incorrect");
            }
            else{
                res.send(err);
            }
            // result == true
        });
       }
       else{
        res.redirect("/signup");
       }

});


app.get("/",function(req,res){
    res.redirect("/biobank");
})
app.get("/biobank/:uuid/",async function(req,res){
const foundUser=await usermodel.findOne({uuid:req.params.uuid})
if (foundUser) {
    const currentDate = new Date();
    if (!foundUser.UpdatedAt || !(foundUser.UpdatedAt instanceof Date) || currentDate.setHours(0, 0, 0, 0) !== foundUser.UpdatedAt.setHours(0, 0, 0, 0)) {
        await usermodel.findOneAndUpdate(
            { uuid: req.params.uuid },
            { $set: { count: 0, UpdatedAt: currentDate } },
            { new: true }
        );
    }
}
 if(foundUser&&foundUser.count<=30){
    try{
    
   items = await biomodel.find({});
   res.json(items);
   await usermodel.findOneAndUpdate(
    { uuid: req.params.uuid },
    { $inc: { count: 1 } },
    { new: true }
  );
   
    
    }
    catch(err){
        res.send(err);
    }
       
}
else{
    res.send("invalid uuid or exceeded number of requests");
}
    })

app.post("/biobank",async function(req,res){
    var cookies = cookie.parse(req.headers.cookie || '');

    jwt.verify(cookies.jwtToken,process.env.TOKEN_KEY, async function(err, decoded) {
        if(!err){
    const bio=new biomodel({
        name:req.body.name,
        symptoms:req.body.symptoms,
        medicine:req.body.medicine
    });
    try{
        await bio.save()
        res.redirect("/adminhome")
    }
    catch(err){
        res.send(err);
    }
}
else{
    res.send("need auth");

}
})
})

app.post("/biobank/:id",async function(req,res){
    var cookies = cookie.parse(req.headers.cookie || '');

    jwt.verify(cookies.jwtToken,process.env.TOKEN_KEY, async function(err, decoded) {
        if(!err){
    const filter=({_id:req.params.id});
    // console.log(req.body.name)
    const update={$set:{name:req.body.name,symptoms:req.body.symptoms,medicine:req.body.symptoms}}
    const foun=await biomodel.findOneAndUpdate(filter,update,{new:true})
    res.redirect("/adminhome")
    // res.send(foun)
   
}
else{
    res.send("need auth");

}
})
})
app.delete("/biobank/:id",async function(req,res){
    var cookies = cookie.parse(req.headers.cookie || '');

    jwt.verify(cookies.jwtToken,process.env.TOKEN_KEY, async function(err, decoded) {
        if(!err){
    const filter=({_id:req.params.id});
    const foun=await biomodel.findOneAndDelete(filter,{new:true})
    res.redirect("/adminhome")
    
}
else{
    res.send("need auth");

}
})
})


  
     

app.get("/biobank/:uuid/:name",async function(req,res){
    const foundUser=await usermodel.findOne({uuid:req.params.uuid})
    if (foundUser) {
        const currentDate = new Date();
        if (!foundUser.UpdatedAt || !(foundUser.UpdatedAt instanceof Date) || currentDate.setHours(0, 0, 0, 0) !== foundUser.UpdatedAt.setHours(0, 0, 0, 0)) {
            await usermodel.findOneAndUpdate(
                { uuid: req.params.uuid },
                { $set: { count: 0, UpdatedAt: currentDate } },
                { new: true }
            );
        }
    }

 if(foundUser&&foundUser.count<=30){
    try{
        const found=await biomodel.findOne({name:req.params.name}).exec();
        res.json(found);
   
    
   
   await usermodel.findOneAndUpdate(
    { uuid: req.params.uuid },
    { $inc: { count: 1 } },
    { new: true }
   )
    }
   
    
    
    catch(err){
        res.send(err);
    }
       
}
else{
    res.send("invalid uuid or exceeded number of requests");
}
    
})
app.post("/adminsignup",async function(req,res){
    const found= await adminmodel.findOne({email:req.body.email});
    if(found){
        res.redirect("/adminlogin");
    }
    else{
        const hash= bcrypt.hashSync(req.body.password, saltRounds);
        const admin=new adminmodel({
            email:req.body.email,
            password:hash

        })
        const token = jwt.sign(
            { user_id: admin._id},
            process.env.TOKEN_KEY,
            {
              expiresIn: "1h",
            }
          );
          
          
          var setCookie=cookie.serialize('jwtToken', token,{
            httpOnly: true,
            maxAge: 60 * 60 // 1 hour
        });
         res.setHeader('Set-Cookie', setCookie);//used to send cookie to client

        try{
            await admin.save()
            res.redirect("/adminhome")
        }
        catch(err){
            res.json(err)
        }
    }

})
app.post("/adminlogin",async function(req,res){
    const found= await adminmodel.findOne({email:req.body.email})
    if(found){
        const pass=found.password
        bcrypt.compare(req.body.password, pass, function(err, result) {
            if(result==true){
                const token = jwt.sign(
                    { user_id: found._id },
                    process.env.TOKEN_KEY,
                    {
                      expiresIn: "1h",
                    }
                  );
                 
                  
                  var setCookie=cookie.serialize('jwtToken', token,{
                    httpOnly: true,
                    maxAge: 60 * 60 // 1 hour
                });
                  res.setHeader('Set-Cookie', setCookie);//used to send cookie to client
                res.redirect("/adminhome")
            }
            else if(result==false){
                res.send("password incorrect");
            }
            else{
                res.send(err);
            }})
    }
    else{
        res.redirect('/adminsignup');
    }})

    
app.listen(process.env.PORT||3000,function(err){
    if(!err){
        console.log("Connected sucessfully");
    }
    else{
        console.log(err);
    }
})


