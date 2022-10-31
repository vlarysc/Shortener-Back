var express = require('express');
var router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');

let SECRET = "app";

router.post('/login', async function (req, res, next) {
  const { email, password } = req.body;
  try {
    const result = await User.findAll();
    const authenticated = await result.filter((item) => {
      if (item.email === email && item.password === password) {
        return item
      }
    })
    const token = jwt.sign({ userId: authenticated[0].id, name: authenticated[0].name }, SECRET, { expiresIn: 30000 })
    if (!result) return res.sendStatus(404); 
    return res.status(201).json({
      'token': token,
      'id': authenticated[0].id,
      'nome': authenticated[0].name
    })
  } catch (error) {
    res.status(500).json({ error: error })
  }
});

router.post('/signUp', async function (req, res, next) {
  const { name, email, password } = req.body;
  
  const user = {
    name,
    email,
    password   
  }

  try {
    await User.create(user);
    return res.status(201).json({ message: 'Sucesso!!!' })
  } catch (error) {
    res.status(500).json({ error: error })
  }
});

module.exports = router;
