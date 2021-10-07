const express = require ('express');
const expressLayouts = require('express-ejs-layouts');
const {body, validationResult,check} = require('express-validator')
const methodOverride = require('method-override');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

require('./utils/db');
const Contact = require('./model/contact');

const app = express();
const port = 3000;

// setup method override
app.use(methodOverride('_method'));

// setup EJS
app.set('view engine','ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));

// setup flash
app.use(cookieParser());
app.use(session({
  cookie:{maxAge:6000},
  secret:'secret',
  resave:true,
  saveUninitialized:true
  })
  );

  app.use(flash('secret'));
// Halaman home
app.get('/', (req, res) => {
    const mahasiswa = []
    res.render('index',{nama: 'Damli Hermawan',
      layout:'layouts/main-layout',
      title:'Halaman About',
      mahasiswa, 
    });
});

// Halaman about
app.get('/about', (req, res) => {
    res.render('about',{
      layout:'layouts/main-layout',
      title:'Halaman About',
    });
  });

// Halaman kontak
  app.get('/contact', async (req, res) => {
    
    const contacts = await Contact.find();
    
  
        res.render('contact',{
        layout:'layouts/main-layout',
        title: 'Halaman Contacts',
        contacts,
        msg: req.flash('msg'),
    });
  });

// Halaman tambah kontak
app.get('/contact/add',(req,res)=>{
    res.render('add-contact',{
      title:'Form Tambah Data Contact',
      layout:'layouts/main-layout',
    });
  });

// Proses Tambah Data Kontak
  app.post('/contact', [
    body('nama').custom(async(value)=>{
      const duplikat = await Contact.findOne({nama:value});
      if(duplikat){
        throw new Error('Nama contact sudah terdaftar')
      }
      return true;
    }),
    check('email','email tidak sesuai').isEmail(),
    check('nohp','no handphone tidak benar').isMobilePhone('id-ID')
    ],(req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('add-contact',{
          title:'Form Tambah Data Contact',
          layout:'layouts/main-layout',
          errors:errors.array(),
        });
      }else{
    Contact.insertMany(req.body,(error,result)=>{
      req.flash('msg','Data contact berhasil ditambah'),
      res.redirect('/contact');
    })
      }
    });
  
// hapus contact
app.delete('/contact',(req,res)=>{
  Contact.deleteOne({nama: req.body.nama}).then((result) => {
    req.flash('msg','Data contact berhasil dihapus'),
    res.redirect('/contact');
  });
});
// Halaman Edit
app.get('/contact/edit/:nama',async(req,res)=>{
  const contact = await Contact.findOne({nama: req.params.nama});
  res.render('edit-contact',{
    title:'Form Update Data Contact',
    layout:'layouts/main-layout',
    contact,
  });
});
// update kontak
app.put('/contact', [
  body('nama').custom(async(value,{req}) =>{
    const duplikat = await Contact.findOne({nama : value});
    if(value !== req.body.oldNama && duplikat){
      throw new Error('Nama contact sudah terdaftar')
    }
    return true;
  }),
  check('email','email tidak sesuai').isEmail(),
  check('nohp','no handphone tidak benar').isMobilePhone('id-ID')
  ],(req,res)=>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // return res.status(400).json({ errors: errors.array() 
      res.render('edit-contact',{
        title:'Form Ubah Data Contact',
        layout:'layouts/main-layout',
        errors:errors.array(),
        contact:req.body,
      });
    }else{
  Contact.updateOne({_id: req.body._id},
    {
      $set:{
        nama:req.body.nama,
        email:req.body.email,
        nohp: req.body.nohp,
      },
    }
    ).then((result)=>{
      req.flash('msg','Data contact berhasil diubah'),
    res.redirect('/contact');
    });
    }
  });

// ! detail kontak
app.get('/contact/:nama', async (req, res) => {
  // const contact = findContact(req.params.nama);
  const contact = await Contact.findOne({nama: req.params.nama});
  res.render('detail',{
    layout:'layouts/main-layout',
    title: 'Halaman detail Contacts',
    contact,
  });
});
app.listen(port, () => {
    console.log(`Mongo contact | listening at http://localhost:${port}`);
});