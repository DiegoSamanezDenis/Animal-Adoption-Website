const express=require('express');
const ejs=require('ejs');
const path=require('path');
const fs = require('fs');
const session=require('express-session');
const bodyParser=require('body-parser');

const app=express();

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.get('/giveaway', (req, res) => {
    res.render('login', { message: '' });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = fs.readFileSync('login.txt', 'utf8').split('\n');
    let loggedIn = false;
    for (let i = 0; i < users.length; i++) {
        const [storedUsername, storedPassword] = users[i].split(':');
        if (username === storedUsername && password === storedPassword) {
            loggedIn = true;
            req.session.username=username;
            req.session.loggedIn=true;
            break;
        }
    }
    if (loggedIn) {
        res.redirect('/giveaway/form');
    } else {
        res.render('login', { message: 'Invalid username or password.' });
    }
});
app.post('/create-account', (req, res) => {
    const { username, password } = req.body;
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(username)) {
        return res.send('Username can only contain letters (both upper and lower case) and digits.');
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$/;
    if (!passwordRegex.test(password)) {
        return res.send('Password must be at least 4 characters long and contain at least one letter and one digit.');
    }
    fs.readFile('login.txt', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading login data.');
        }
        const existingUsers = data.split('\n').map(line => line.split(':')[0]);
        if (existingUsers.includes(username)) {
            return res.send('Username already exists. Please choose a different username.');
        }
        const newUserLine = `${username}:${password}\n`;
        fs.appendFile('login.txt', newUserLine, err => {
            if (err) {
                return res.status(500).send('Error creating account.');
            }
            res.send('Account successfully created. You can now log in.');
        });
    });
});

app.get('/giveaway/form', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/giveaway');
    }
    const username = req.session.username;
    res.render('giveaway', { username: username});
});
app.post('/giveaway', (req,res)=>{
    const species = req.body.species1 ? 'Dog' : req.body.species2 ? 'Cat' : '';
    let dogBreeds=[];
    for(let i=1;i<=3;i++){
        const breed=req.body[`breed${i}`];
        if (breed){
            dogBreeds.push(breed);
        }
    }
    const breed=dogBreeds.join(', ');
    const ageOptions={
        '1':'0-1 years old',
        '2':'2-5 years old',
        '3':'5-7 years old',
        '4':'7-10 years old',
        '5':'10-15 years old'
    };
    const ageIndex=req.body.age;
    const age=ageOptions[ageIndex];
    const gender = req.body.gender1 ? 'Male' : req.body.gender2 ? 'Female' : '';
    const alongDog = req.body.getalongD1 ? 'Yes' : req.body.getalongD2 ? 'No' : '';
    const alongCat = req.body.getalongC1 ? 'Yes' : req.body.getalongC2 ? 'No' : '';
    const alongChildren = req.body.getalongCh1 ? 'Yes' : req.body.getalongCh2 ? 'No' : '';
    const comment=req.body.comment;
    const firstname=req.body['first-name'];
    const lastname=req.body['last-name'];
    const email=req.body.email;
    const username=req.session.username;
    var j=0;
    j++;
    const newData=`${j}:${username}:${species}:${breed}:${age}:${gender}:${alongDog}:${alongCat}:${alongChildren}:${comment}:${firstname}:${lastname}:${email}\n`;
    fs.appendFile('petInfo.txt', newData, (err)=>{
        if(err){
            return res.status(500).send("Error submitting giveaway form.");
        }
        res.render('giveawayConfirm');
    });
});

app.post('/find', (req, res) => {
    const species = req.body.species1 ? 'Dog' : req.body.species2 ? 'Cat' : '';
    const breed=req.body.breed1 ||'It does\'t matter';
    
    const ageOptions={
        '1':'0-1 years old',
        '2':'2-5 years old',
        '3':'5-7 years old',
        '4':'7-10 years old',
        '5':'10-15 years old'
    };
    const ageIndex=req.body.age;
    const age=ageOptions[ageIndex];
    const gender = req.body.gender1 ? 'Male' : req.body.gender2 ? 'Female' : '';
    const alongDog = req.body.getalongD1 ? 'Yes' : req.body.getalongD2 ? 'No' : 'It doesn\'t matter';
    const alongCat = req.body.getalongC1 ? 'Yes' : req.body.getalongC2 ? 'No' : 'It doesn\'t matter';
    const alongChildren = req.body.getalongCh1 ? 'Yes' : req.body.getalongCh2 ? 'No' : 'It doesn\'t matter';
    fs.readFile('petInfo.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading petInfo.txt:', err);
            return res.status(500).send("Error retrieving pet information.");
        }
        const lines = data.split('\n').filter(line => line.trim() !== '');
        const records = lines.map(line => line.split(':'));
        const matchingRecords = records.filter(record => {
            const [counter, username, recordSpecies, recordBreed, recordAge, recordGender, recordAlongDog, recordAlongCat, recordAlongChildren] = record;
            return (
                (recordSpecies === species) &&
                ((breed === 'It doesn\'t matter' || breed === recordBreed)) &&
                (age === recordAge) &&
                (gender === 'It does\'t matter' || recordGender === gender) &&
                (alongDog === 'It doesn\'t matter' || recordAlongDog === alongDog) &&
                (alongCat === 'It doesn\'t matter' || recordAlongCat === alongCat) &&
                (alongChildren === 'It doesn\'t matter' || recordAlongChildren === alongChildren)
            );
        });
        res.render('findResults', { matchingRecords });
    });

});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error logging out.');
        }
        res.redirect('/logoutConfirmation');
    });
});

app.get('/logoutConfirmation', (req, res) => {
    res.render('logout');
});

app.get('/home', (req, res)=>{
    res.render('home', {
        header: '<%- include(header.ejs) %>',
        footer: '<%- include(footer.ejs) %>'
    });
});

app.get('/catcare',(req,res)=>{
    res.render('catcare', {
        header: '<%- include(header.ejs) %>',
        footer: '<%- include(footer.ejs) %>'
    });
});
app.get('/createAccount',(req,res)=>{
    res.render('createAccount', {
        header: '<%- include(header.ejs) %>',
        footer: '<%- include(footer.ejs) %>'
    });
});

app.get('/dogcare',(req,res)=>{
    res.render('dogcare', {
        header: '<%- include(header.ejs) %>',
        footer: '<%- include(footer.ejs) %>'
    });
});
app.get('/find',(req,res)=>{
    res.render('find', {
        header: '<%- include(header.ejs) %>',
        footer: '<%- include(footer.ejs) %>'
    });
});
app.get('/giveaway',(req,res)=>{
    res.render('giveaway', {
        header: '<%- include(header.ejs) %>',
        footer: '<%- include(footer.ejs) %>'
    });
});

app.get('/contact', (req,res)=>{
    res.render('contact', {
        header: '<%- include(header.ejs) %>',
        footer: '<%- include(footer.ejs) %>'
    });
});

const port=3000;
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});
